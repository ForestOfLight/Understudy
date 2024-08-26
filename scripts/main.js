import { Command, Rule } from 'lib/canopy/CanopyExtension';
import extension from 'config';
import 'setup';
import UnderstudyManager from 'classes/UnderstudyManager';
import { makeVector3, isNumeric, PLAYER_EYE_HEIGHT, getLookAtLocation } from 'utils';

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
        { usage: `player <name> look [up/down/north/south/east/west/block/entity/me/x y z/pitch yaw]`, description: `Make a player look in specified directions.` },
        { usage: `player <name> move [forward/back/left/right/block/entity/me/x y z]`, description: `Make a player move in specified directions.` },
        { usage: `player <name> drop`, description: `Make a player drop the item their selected item.` },
        { usage: `player <name> claimprojectiles`, description: `Make a player claim all projectiles within a 25 block radius.` },
        { usage: `player <name> stop`, description: `Stop all actions for a player.` },
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
        case 'move':
            moveAction(sender, name, arg1, arg2, arg3);
            break;
        case 'drop':
            dropAction(sender, name);
            break;
        case 'claimprojectiles':
            claimProjectilesAction(sender, name);
            break;
        case 'stop':
            stopAction(sender, name);
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
    } else if (['up', 'down', 'north', 'south', 'east', 'west'].includes(arg1)) {
        simPlayer.lookLocation(processLookCardinals(simPlayer.simulatedPlayer, arg1));
    } else if (arg1 !== null && arg2 !== null && arg3 !== null) {
        if (!isNumeric(arg1) || !isNumeric(arg2) || !isNumeric(arg3)) {
            sender.sendMessage(`§cInvalid coordinates: ${arg1}, ${arg2}, ${arg3}`);
            return;
        }
        simPlayer.lookLocation(makeVector3(arg1, arg2, arg3));
    } else if (arg1 !== null && arg2 !== null && arg3 === null) {
        if (!isNumeric(arg1) || !isNumeric(arg2)) {
            sender.sendMessage(`§cInvalid pitch or yaw: ${arg1}, ${arg2}`);
            return;
        }
        simPlayer.lookLocation(getLookAtLocation(simPlayer.simulatedPlayer.location, { x: arg1, y: arg2 }));
    } else {
        sender.sendMessage(`§cInvalid target action: ${arg1}. Expected 'up', 'down', 'north', 'south', 'east', 'west', 'block', 'entity', 'me', coordinates, or pitch and yaw.`);
    }
}

function processLookCardinals(simulatedPlayer, direction) {
    const directions = {
        'up': { x: 0, y: 1, z: 0 },
        'down': { x: 0, y: -1, z: 0 },
        'north': { x: 0, y: 0, z: -1 },
        'south': { x: 0, y: 0, z: 1 },
        'east': { x: 1, y: 0, z: 0 },
        'west': { x: -1, y: 0, z: 0 }
    };
    if (!directions[direction]) {
        throw new Error(`[Understudy] Invalid look direction: ${direction}`);
    }
    return {x: simulatedPlayer.location.x + directions[direction].x, y: simulatedPlayer.location.y + directions[direction].y + PLAYER_EYE_HEIGHT, z: simulatedPlayer.location.z + directions[direction].z};
}

function moveAction(sender, name, arg1, arg2, arg3) {
    if (!UnderstudyManager.isOnline(name)) {
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    if (arg1 === 'me') {
        simPlayer.moveLocation(sender);
    } else if (['forward', 'back', 'left', 'right'].includes(arg1)) {
        simPlayer.moveRelative(arg1);
    } else if (arg1 === 'block') {
        const block = sender.getBlockFromViewDirection({ maxDistance: 16*64 })?.block;
        if (block === undefined) {
            sender.sendMessage(`§cNo block in view.`);
            return;
        }
        simPlayer.moveLocation(block);
    } else if (arg1 === 'entity') {
        const entity = sender.getEntitiesFromViewDirection({ maxDistance: 16*64 })[0]?.entity;
        if (entity === undefined) {
            sender.sendMessage(`§cNo entity in view.`);
            return;
        }
        simPlayer.moveLocation(entity);
    } else if (arg1 !== null && arg2 !== null && arg3 !== null && isNumeric(arg1) && isNumeric(arg2) && isNumeric(arg3)) {
        simPlayer.moveLocation(makeVector3(arg1, arg2, arg3));
    } else {
        sender.sendMessage(`§cInvalid move action: ${[arg1, arg2, arg3].join(', ')}. Expected 'forward', 'back', 'left', 'right', 'block', 'entity', 'me', or coordinates.`);
    }
}

function dropAction(sender, name) {
    if (!UnderstudyManager.isOnline(name)) {
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    simPlayer.dropSelected();
}

function claimProjectilesAction(sender, name) {
    if (!UnderstudyManager.isOnline(name)) {
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    simPlayer.claimProjectiles();
}

function stopAction(sender, name) {
    if (!UnderstudyManager.isOnline(name)) {
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    simPlayer.stopAll();
}
