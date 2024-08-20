import { Command, Rule } from 'lib/canopy/CanopyExtension';
import extension from 'config';
import 'setup';
import UnderstudyManager from 'classes/UnderstudyManager';
import { makeVector3, isNumeric } from 'utils';

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
        { type: 'string|number', name: 'name' },
        { type: 'string', name: 'action' },
        { type: 'string|number', name: 'arg1', },
        { type: 'string|number', name: 'arg2', },
        { type: 'string|number', name: 'arg3', },
    ],
    contingentRules: [ 'commandPlayer' ],
    helpEntries: [ 
        { usage: `player <name> join`, description: `Make a new player join at your location.` },
        { usage: `player <name> leave`, description: `Make a player leave the game.` },
        { usage: `player <name> rejoin`, description: `Make a player rejoin at its last location.` },
        { usage: `player <name> respawn`, description: `Make a player respawn after dying.` },
        { usage: `player <name> tp`, description: `Make a player teleport to you.` },
        { usage: `player <name> look [block/entity/me/x y z]`, description: `Make a player look at you or another location.` }
    ]
})
extension.addCommand(commandPlayerCommand);

const commandPlayerAliasCommand = new Command({
    name: 'p',
    description: `Main ${extension.name} command.`,
    usage: 'p <name> <action>',
    callback: playerCommand,
    args: [
        { type: 'string|number', name: 'name' },
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
    let { name, action, arg1, arg2, arg3 } = args;
    if (name === null || action === null) return commandPlayerCommand.sendUsage(sender);
    if (isNumeric(name)) name = name.toString();

    switch (action) {
        case 'join':
            joinAction(sender, name);
            break;
        case 'leave':
            leaveAction(sender, name);
            break;
        case 'rejoin':
            rejoinAction(sender, name);
            break;
        case 'respawn':
            respawnAction(sender, name);
            break;
        case 'tp':
            tpAction(sender, name);
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
    if (UnderstudyManager.isOnline(name)) {
        sender.sendMessage(`§cPlayer ${name} is already online.`);
        return;
    }
    const simPlayer = UnderstudyManager.newPlayer(name);
    UnderstudyManager.spawnPlayer(simPlayer);
    simPlayer.join(sender.location, sender.getRotation(), sender.dimension.id, sender.getGameMode());
}

function leaveAction(sender, name) {
    const simPlayer = UnderstudyManager.getPlayer(name);
    if (!UnderstudyManager.isOnline(name)) {
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }
    simPlayer.leave();
    UnderstudyManager.removePlayer(simPlayer);
}

function rejoinAction(sender, name) {
    if (UnderstudyManager.isOnline(name)) {
        sender.sendMessage(`§cPlayer ${name} is already online.`);
        return;
    }
    const simPlayer = UnderstudyManager.newPlayer(name);
    UnderstudyManager.spawnPlayer(simPlayer);
    try {
        simPlayer.rejoin();
    } catch (error) {
        simPlayer.join(sender.location, sender.getRotation(), sender.dimension.id, sender.getGameMode());
    }
}

function respawnAction(sender, name) {
    const simPlayer = UnderstudyManager.getPlayer(name);
    if (!UnderstudyManager.isOnline(name)) {
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }
    simPlayer.respawn();
}

function tpAction(sender, name) {
    const simPlayer = UnderstudyManager.getPlayer(name);
    if (!UnderstudyManager.isOnline(name)) {
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }
    simPlayer.tp(sender.location, sender.getRotation(), sender.dimension.id);
}

function lookAction(sender, name, arg1, arg2, arg3) {
    if (!UnderstudyManager.isOnline(name)) {
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    if (arg1 === 'me') {
        simPlayer.lookLocation(sender);
    } else if (arg1 === 'block') {
        const block = sender.getBlockFromViewDirection({ maxDistance: 16*64 })?.block;
        if (block === undefined) {
            sender.sendMessage(`§cNo block in view.`);
            return;
        }
        simPlayer.lookLocation(block);
    } else if (arg1 === 'entity') {
        const entity = sender.getEntitiesFromViewDirection({ maxDistance: 16*64 })[0]?.entity;
        if (entity === undefined) {
            sender.sendMessage(`§cNo entity in view.`);
            return;
        }
        simPlayer.lookLocation(entity);
    } else if (arg1 !== null && arg2 !== null && arg3 !== null) {
        if (isNaN(arg1) || isNaN(arg2) || isNaN(arg3)) {
            sender.sendMessage(`§cInvalid coordinates: ${arg1}, ${arg2}, ${arg3}`);
            return;
        }
        simPlayer.lookLocation(makeVector3(arg1, arg2, arg3));
    } else {
        sender.sendMessage(`§cInvalid target action: ${arg1}. Expected 'block', 'entity', 'me', or coordinates.`);
    }
}
