import fs from 'fs';
import path from 'path';
import { execFileSync } from 'child_process';
import { fileURLToPath } from 'url';

const dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(dirname, '../..');
const buildDir = path.join(projectRoot, 'build');
const projectName = JSON.parse(fs.readFileSync(path.join(projectRoot, 'config.json'), 'utf8')).name;

function getPackVersion() {
    const content = fs.readFileSync(path.join(projectRoot, 'packs', 'BP', 'scripts', 'main.js'), 'utf8');
    const match = content.match(/version:\s*['"]([^'"]+)['"]/);
    return match ? match[1] : 'unknown';
}

function main() {
    fs.mkdirSync(buildDir, { recursive: true });

    const version = getPackVersion();
    const outputPath = path.join(buildDir, `${projectName}-v${version}.mcpack`);

    if (fs.existsSync(outputPath))
        fs.unlinkSync(outputPath);

    console.log(`[package-mcpack] Creating ${projectName}-v${version}.mcpack...`);
    const bpDir = path.join(process.cwd(), 'BP');
    execFileSync('zip', ['-r', outputPath, '.'], { cwd: bpDir, stdio: 'inherit' });
    console.log(`[package-mcpack] Saved to: ${outputPath}`);
}

try {
    main();
} catch (err) {
    console.error('[package-mcpack] Error:', err.message);
    process.exit(1);
}
