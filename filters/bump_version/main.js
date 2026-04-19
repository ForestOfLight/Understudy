import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { spawnSync } from 'child_process';
import { tmpdir } from 'os';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '../..');
const settings = JSON.parse(process.env.FILTER_SETTINGS || '{}');

function bumpVersion(versionStr, type) {
    const parts = versionStr.split('.').map(Number);
    if (type === 'major') { parts[0]++; parts[1] = 0; parts[2] = 0; }
    else if (type === 'minor') { parts[1]++; parts[2] = 0; }
    else { parts[2]++; }
    return parts.join('.');
}

function getCurrentVersion() {
    const content = fs.readFileSync(
        path.join(projectRoot, 'packs', 'BP', 'scripts', 'main.js'), 'utf8'
    );
    const match = content.match(/version:\s*['"]([^'"]+)['"]/);
    if (!match) throw new Error('Could not find version in main.js');
    return match[1];
}

function updateMainJs(filePath, newVersion) {
    let content = fs.readFileSync(filePath, 'utf8');
    content = content.replace(/(version:\s*['"])[^'"]+(['"])/, `$1${newVersion}$2`);
    fs.writeFileSync(filePath, content, 'utf8');
}

function updateManifest(filePath, newVersion) {
    let content = fs.readFileSync(filePath, 'utf8');
    const [maj, min, pat] = newVersion.split('.').map(Number);

    content = content.replace(/(["']name["']\s*:\s*["'][^"']*v)[\d.]+/, `$1${newVersion}`);
    content = content.replace(
        /("version":\s*\[)\s*\d+\s*,\s*\d+\s*,\s*\d+\s*(\])/,
        `$1${maj}, ${min}, ${pat}$2`
    );

    fs.writeFileSync(filePath, content, 'utf8');
}

function buildWindowsPromptScript(currentVersion) {
    const patch = bumpVersion(currentVersion, 'patch');
    const minor = bumpVersion(currentVersion, 'minor');
    const major = bumpVersion(currentVersion, 'major');

    const csharp = 'using System; using System.IO; using System.Runtime.InteropServices; using Microsoft.Win32.SafeHandles;'
        + ' public class ConsoleIO {'
        + ' [DllImport("kernel32.dll", SetLastError=true, CharSet=CharSet.Auto)]'
        + ' static extern IntPtr CreateFile(string n, uint a, uint s, IntPtr sec, uint d, uint f, IntPtr t);'
        + ' public static FileStream OpenInput()  { return new FileStream(new SafeFileHandle(CreateFile("CONIN$",  0x80000000u, 3u, IntPtr.Zero, 3u, 0u, IntPtr.Zero), true), FileAccess.Read); }'
        + ' public static FileStream OpenOutput() { return new FileStream(new SafeFileHandle(CreateFile("CONOUT$", 0x40000000u, 3u, IntPtr.Zero, 3u, 0u, IntPtr.Zero), true), FileAccess.Write); }'
        + ' }';
    return `
try {
    Add-Type -TypeDefinition '${csharp}' -ErrorAction Stop
    $conIn  = [ConsoleIO]::OpenInput()
    $conOut = [ConsoleIO]::OpenOutput()
} catch {
    Write-Output "[bump-version] Cannot access terminal: $($_.Exception.Message)"
    exit 1
}
$reader = New-Object System.IO.StreamReader($conIn)
$writer = New-Object System.IO.StreamWriter($conOut)
$writer.AutoFlush = $true
$writer.WriteLine('[bump-version] Current version: v${currentVersion}')
$writer.WriteLine('  1) patch  v${currentVersion} -> v${patch}')
$writer.WriteLine('  2) minor  v${currentVersion} -> v${minor}')
$writer.WriteLine('  3) major  v${currentVersion} -> v${major}')
$writer.Write('Select bump type [1-3] (default: 1): ')
$choice = $reader.ReadLine()
$conIn.Close(); $conOut.Close()
if (-not $choice) { $choice = '1' }
if ($choice -eq '2') { exit 2 } elseif ($choice -eq '3') { exit 3 } else { exit 1 }
`.trim();
}

function promptBumpTypeWindows(currentVersion) {
    const tmpScript = path.join(tmpdir(), `bump_version_${process.pid}.ps1`);
    fs.writeFileSync(tmpScript, '\ufeff' + buildWindowsPromptScript(currentVersion), 'utf8');

    const result = spawnSync(
        'powershell',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', tmpScript],
        { stdio: 'inherit' }
    );

    try { fs.unlinkSync(tmpScript); } catch { /* cleanup best-effort */ }

    if (result.error || result.status === null)
        throw new Error('PowerShell prompt failed');

    if (result.status === 2) return 'minor';
    if (result.status === 3) return 'major';
    return 'patch';
}

function promptBumpTypeUnix(currentVersion) {
    return new Promise((resolve, reject) => {
        const patch = bumpVersion(currentVersion, 'patch');
        const minor = bumpVersion(currentVersion, 'minor');
        const major = bumpVersion(currentVersion, 'major');

        let ttyInput;
        let ttyOutput;
        try {
            ttyInput = fs.createReadStream('/dev/tty');
            ttyOutput = fs.createWriteStream('/dev/tty');
        } catch {
            reject(new Error('No TTY available'));
            return;
        }

        const rl = readline.createInterface({ input: ttyInput, output: ttyOutput });

        ttyOutput.write(`[bump-version] Current version: v${currentVersion}\n`);
        ttyOutput.write(`  1) patch  v${currentVersion} -> v${patch}\n`);
        ttyOutput.write(`  2) minor  v${currentVersion} -> v${minor}\n`);
        ttyOutput.write(`  3) major  v${currentVersion} -> v${major}\n`);

        rl.question('Select bump type [1-3] (default: 1): ', (answer) => {
            rl.close();
            ttyInput.destroy();
            const choice = answer.trim() || '1';
            if (choice === '2') resolve('minor');
            else if (choice === '3') resolve('major');
            else resolve('patch');
        });

        ttyInput.on('error', reject);
    });
}

function promptBumpType(currentVersion) {
    if (process.platform === 'win32')
        return Promise.resolve(promptBumpTypeWindows(currentVersion));
    return promptBumpTypeUnix(currentVersion);
}

async function main() {
    const currentVersion = getCurrentVersion();

    let bumpType;
    try {
        bumpType = await promptBumpType(currentVersion);
    } catch {
        bumpType = settings.bumpType || 'patch';
    }

    const newVersion = bumpVersion(currentVersion, bumpType);
    console.log(`[bump-version] ${currentVersion} -> ${newVersion}`);

    updateMainJs(path.join(projectRoot, 'packs', 'BP', 'scripts', 'main.js'), newVersion);
    updateManifest(path.join(projectRoot, 'packs', 'BP', 'manifest.json'), newVersion);

    console.log(`[bump-version] Updated to v${newVersion}`);
}

main().catch(err => {
    console.error('[bump-version] Error:', err.message);
    process.exit(1);
});
