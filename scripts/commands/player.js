import extension from "../config";
import { Command } from "../lib/canopy/CanopyExtension";
import { Block, Player, world } from "@minecraft/server";
import UnderstudyManager from "../classes/UnderstudyManager";
import { makeVector3, isNumeric, PLAYER_EYE_HEIGHT, getLookAtLocation } from "../utils";

const commandPlayerCommand = new Command({
    name: 'player',
    description: `Main ${extension.name} command. (Alias: p)`,
    usage: 'player <name> <action> [args...]',
    callback: playerCommand,
    args: [
        { type: 'string|number', name: 'name' },
        { type: 'string|number', name: 'action' },
        { type: 'string|number', name: 'arg1' },
        { type: 'string|number', name: 'arg2' },
        { type: 'string|number', name: 'arg3' }
    ],
    helpEntries: [ 
        { usage: `player <name> join`, description: `Make a new player join at your location.` },
        { usage: `player <name> leave`, description: `Make a player leave the game.` },
        { usage: `player <name> rejoin`, description: `Make a player rejoin at its last location.` },
        // { usage: `player <name> respawn`, description: `Make a player respawn after dying.` },
        { usage: `player <name> tp`, description: `Make a player teleport to you.` },
        { usage: `player <name> look [up/down/north/south/east/west/block/entity/me/x y z/pitch yaw]`, description: `Make a player look in specified directions.` },
        { usage: `player <name> move [forward/back/left/right/block/entity/me/x y z]`, description: `Make a player move in specified directions.` },
        { usage: `player <name> <attack/interact/use/build/break/drop/dropstack/dropall/jump> [once/continuous/interval] [intervalDuration]`, description: `Make a player do an action with variable timing.` },
        { usage: `player <name> select [slotNumber]`, description: `Make a player select a slot.` },
        { usage: `player <name> <sprint/unsprint>`, description: `Make a player start or stop sprinting.` },
        { usage: `player <name> <sneak/unsneak>`, description: `Make a player start or stop sneaking.` },
        { usage: `player <name> claimprojectiles [radius]`, description: `Make a player the owner of all nearby projectiles.` },
        { usage: `player <name> inv`, description: `Print the inventory of a player.` },
        { usage: `player <name> swapheld`, description: `Swap the held item of a player with your held item.` },
        { usage: `player <name> stop`, description: `Stop all actions for a player.` },
        { usage: `player prefix <prefix>`, description: `Set a prefix player nametags.` }
    ]
});
extension.addCommand(commandPlayerCommand);

const commandPlayerAliasCommand = new Command({
    name: 'p',
    description: `Main ${extension.name} command.`,
    usage: 'p <name> <action>',
    callback: playerCommand,
    args: [
        { type: 'string|number', name: 'name' },
        { type: 'string|number', name: 'action' },
        { type: 'string|number', name: 'arg1', },
        { type: 'string|number', name: 'arg2', },
        { type: 'string|number', name: 'arg3', },
    ],
    helpHidden: true
});
extension.addCommand(commandPlayerAliasCommand);

function playerCommand(sender, args) {
    let { name, action, arg1, arg2, arg3 } = args;
    if (name === null || action === null) {
        commandPlayerCommand.sendUsage(sender);
        return;
    }
    name = isNumeric(name) ? name.toString() : name;
    action = isNumeric(action) ? action.toString() : action;

    if (name === 'prefix') {
        UnderstudyManager.setNametagPrefix(action);
        return;
    }

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
        // case 'respawn':
        //     respawnAction(sender, name);
        //     break;
        case 'tp':
            tpAction(sender, name);
            break;
        case 'look':
            lookAction(sender, name, arg1, arg2, arg3);
            break;
        case 'move':
            moveAction(sender, name, arg1, arg2, arg3);
            break;
        case 'attack':
        case 'interact':
        case 'use':
        case 'build':
        case 'break':
        case 'drop':
        case 'dropstack':
        case 'dropall':
        case 'jump':
            variableTimingAction(sender, action, name, arg1, arg2);
            break;
        case 'select':
            selectSlotAction(sender, name, arg1);
            break;
        case 'sprint':
            sprintAction(sender, name);
            break;
        case 'unsprint':
            unsprintAction(sender, name);
            break;
        case 'sneak':
            sneakAction(sender, name);
            break;
        case 'unsneak':
            unsneakAction(sender, name);
            break;
        case 'claimprojectiles':
            claimProjectilesAction(sender, name, arg1);
            break;
        case 'stop':
            stopAction(sender, name);
            break;
        case 'inv':
            printInventory(sender, name);
            break;
        case 'swapheld':
            swapHeld(sender, name);
            break;
        default:
            if (sender instanceof Player === false) return;
            sender.sendMessage(`§cInvalid action: ${action}`);
            break;
    }
}

function joinAction(sender, name) {
    if (UnderstudyManager.isOnline(name) || world.getPlayers({ name }).length > 0) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is already online.`);
        return;
    }
    const simPlayer = UnderstudyManager.newPlayer(name);
    if (sender instanceof Block)
        simPlayer.join({ x: sender.x + .5, y: sender.y + 1, z: sender.z + .5 }, sender.dimension.id);
    else
        simPlayer.join(sender.location, sender.dimension.id, sender.getRotation(), sender.getGameMode());
    UnderstudyManager.spawnPlayer(simPlayer);
}

function leaveAction(sender, name) {
    const simPlayer = UnderstudyManager.getPlayer(name);
    if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }
    simPlayer.leave();
    UnderstudyManager.removePlayer(simPlayer);
}

function rejoinAction(sender, name) {
    if (UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is already online.`);
        return;
    }
    const simPlayer = UnderstudyManager.newPlayer(name);
    UnderstudyManager.spawnPlayer(simPlayer);
    try {
        simPlayer.rejoin();
    } catch (error) {
        if (sender instanceof Block)
            simPlayer.join({ x: sender.x + .5, y: sender.y + 1, z: sender.z + .5 }, sender.dimension.id);
        else
            simPlayer.join(sender.location, sender.dimension.id, sender.getRotation(), sender.getGameMode());
    }
}

function respawnAction(sender, name) {
    const simPlayer = UnderstudyManager.getPlayer(name);
    if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }
    simPlayer.respawn();
}

function tpAction(sender, name) {
    const simPlayer = UnderstudyManager.getPlayer(name);
    if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }
    if (sender instanceof Player === false) 
        simPlayer.tp({ x: sender.x + .5, y: sender.y + 1, z: sender.z + .5 }, simPlayer.getHeadRotation(), sender.dimension.id);
    else
        simPlayer.tp(sender.location, sender.getRotation(), sender.dimension.id);
}

function lookAction(sender, name, arg1, arg2, arg3) {
    if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    if (arg1 === 'me') {
        simPlayer.lookLocation(sender);
    } else if (arg1 === 'block') {
        if (sender instanceof Player === false) return;
        const block = sender.getBlockFromViewDirection({ maxDistance: 16*64 })?.block;
        if (block === undefined) {
            sender.sendMessage(`§cNo block in view.`);
            return;
        }
        simPlayer.lookLocation(block);
    } else if (arg1 === 'entity') {
        if (sender instanceof Player === false) return;
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
            if (sender instanceof Player === false) return;
            sender.sendMessage(`§cInvalid coordinates: ${arg1}, ${arg2}, ${arg3}`);
            return;
        }
        simPlayer.lookLocation(makeVector3(arg1, arg2, arg3));
    } else if (arg1 !== null && arg2 !== null && arg3 === null) {
        if (!isNumeric(arg1) || !isNumeric(arg2)) {
            if (sender instanceof Player === false) return;
            sender.sendMessage(`§cInvalid pitch or yaw: ${arg1}, ${arg2}`);
            return;
        }
        simPlayer.lookLocation(getLookAtLocation(simPlayer.simulatedPlayer.location, { x: arg1, y: arg2 }));
    } else {
        if (sender instanceof Player === false) return;
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
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    if (arg1 === 'me') {
        simPlayer.moveLocation(sender);
    } else if (['forward', 'backward', 'left', 'right'].includes(arg1)) {
        simPlayer.moveRelative(arg1);
    } else if (arg1 === 'block') {
        if (sender instanceof Player === false) return;
        const block = sender.getBlockFromViewDirection({ maxDistance: 16*64 })?.block;
        if (block === undefined) {
            sender.sendMessage(`§cNo block in view.`);
            return;
        }
        simPlayer.moveLocation(block);
    } else if (arg1 === 'entity') {
        if (sender instanceof Player === false) return;
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

function variableTimingAction(sender, action, name, arg1, arg2) {
    if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    let isContinuous = false;
    if (['once', 'continuous', 'interval', null].includes(arg1)) {
        isContinuous = arg1 === 'continuous';
    } else {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cInvalid ${action} action: ${arg1}. Expected 'once', 'continuous' or 'interval'.`);
        return;
    }

    let intervalDuration = 0;
    if (arg1 === 'interval' && isNumeric(arg2)) {
        isContinuous = true;
        intervalDuration = arg2;
    } else if (arg2 !== null) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cInvalid interval duration: ${arg2}. Expected a number.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    simPlayer.variableTimingAction(action, isContinuous, intervalDuration);
}

function selectSlotAction(sender, name, arg1) {
    if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    if (!isNumeric(arg1) || arg1 < 0 || arg1 > 8) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cInvalid slot number: ${arg1}. Expected a number fom 0 to 8.`);
        return;
    }
    simPlayer.selectSlot(arg1);
}

function sprintAction(sender, name) {
    if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    simPlayer.sprint(true);
}

function unsprintAction(sender, name) {
    if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    simPlayer.sprint(false);
}

function sneakAction(sender, name) {
    if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }
    
    const simPlayer = UnderstudyManager.getPlayer(name);
    simPlayer.sneak(true);
}

function unsneakAction(sender, name) {
    if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }
    
    const simPlayer = UnderstudyManager.getPlayer(name);
    simPlayer.sneak(false);
}

function claimProjectilesAction(sender, name, arg1) {
    if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    let radius = 25;
    if (isNumeric(arg1))
        radius = arg1;
    const simPlayer = UnderstudyManager.getPlayer(name);
    simPlayer.claimProjectiles(radius);
}

function stopAction(sender, name) {
    if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    simPlayer.stopAll();
}

function printInventory(sender, name) {
    if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    simPlayer.printInventory(sender);
}

function swapHeld(sender, name) {
    if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    simPlayer.swapHeldItemWithPlayer(sender);
}

export { playerCommand };