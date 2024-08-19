import { Command, Rule } from 'lib/canopy/CanopyExtension';
import extension from 'config';
import 'setup';
import CanopyPlayerManager from 'classes/CanopyPlayerManager';
import { makeVector3 } from 'utils';

const commandPlayerRule = new Rule({
    identifier: 'commandPlayer',
    description: 'Enables player command.',
});
extension.addRule(commandPlayerRule);

const commandPlayerCommand = new Command({
    name: 'player',
    description: `Main ${extension.name} command. (Alias: p)`,
    usage: 'player <name> <action> [args...]',
    callback: playerCommand,
    args: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'action' },
        { type: 'string|number', name: 'arg1', },
        { type: 'string|number', name: 'arg2', },
        { type: 'string|number', name: 'arg3', },
    ],
    contingentRules: [ 'commandPlayer' ],
    helpEntries: [ 
        { usage: `player <name> join`, description: `Make a new player join at your location.` },
        { usage: `player <name> rejoin`, description: `Make a player rejoin at its last location.` },
        { usage: `player <name> tp`, description: `Make a player teleport to you.` },
        { usage: `player <name> leave`, description: `Make a player leave the game.` },
        { usage: `player <name> look [x y z]`, description: `Make a player look at you or another location.` }
    ]
})
extension.addCommand(commandPlayerCommand);

const commandPlayerAliasCommand = new Command({
    name: 'p',
    description: 'Main CanopyPlayer command.',
    usage: 'p <name> <action>',
    callback: playerCommand,
    args: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'action' },
        { type: 'string|number', name: 'arg1', },
        { type: 'string|number', name: 'arg2', },
        { type: 'string|number', name: 'arg3', },
    ],
    contingentRules: [ 'commandPlayer' ],
    helpHidden: true
})
extension.addCommand(commandPlayerAliasCommand);

function playerCommand(sender, args) {
    const { name, action, arg1, arg2, arg3 } = args;
    if (name === null || action === null) return commandPlayerCommand.sendUsage(sender);

    switch (action) {
        case 'join':
            joinAction(sender, name);
            break;
        case 'rejoin':
            rejoinAction(sender, name);
            break;
        case 'tp':
            tpAction(sender, name);
            break;
        case 'leave':
            leaveAction(sender, name);
            break;
        case 'look':
            lookAction(sender, name, arg1, arg2, arg3);
            break;
        default:
            sender.sendMessage(`§cInvalid action: ${action}`);
            break;
    }
}

function joinAction(sender, name) {
    if (CanopyPlayerManager.getPlayer(name) !== undefined) {
        sender.sendMessage(`§cPlayer ${name} is already online.`);
        return;
    }
    const simPlayer = CanopyPlayerManager.newPlayer(name);
    CanopyPlayerManager.spawnPlayer(simPlayer, sender.location, sender.getRotation(), 'survival');
}

function rejoinAction(sender, name) {
    throw new Error(`[CanopyPlayers] Method not implemented.`);
}

function tpAction(sender, name) {
    throw new Error(`[CanopyPlayers] Method not implemented.`);
}

function leaveAction(sender, name) {
    const simPlayer = CanopyPlayerManager.getPlayer(name);
    if (!CanopyPlayerManager.isOnline(name)) {
        sender.sendMessage(`§cPlayer ${name} not found.`);
        return;
    }
    CanopyPlayerManager.removePlayer(simPlayer);
}

function lookAction(sender, name, arg1, arg2, arg3) {
    if (!CanopyPlayerManager.isOnline(name)) {
        sender.sendMessage(`§cPlayer ${name} not found.`);
        return;
    }
    const simPlayer = CanopyPlayerManager.getPlayer(name);
    if (arg1 === 'me') {
        simPlayer.look(sender.getHeadLocation());
    } else if (arg1 === 'block') {
        const block = sender.getBlockFromViewDirection({ maxDistance: 16*64 })?.block;
        if (block === undefined) {
            sender.sendMessage(`§cNo block in view.`);
            return;
        }
        simPlayer.look({ x: block.x + 0.5, y: block.y + 0.5, z: block.z + 0.5 });
    } else if (arg1 !== null && arg2 !== null && arg3 !== null) {
        simPlayer.look(makeVector3(arg1, arg2, arg3));
    } else {
        sender.sendMessage(`§cInvalid action: ${arg1}, expected 'block', 'me', or coordinates.`);
    }
}
