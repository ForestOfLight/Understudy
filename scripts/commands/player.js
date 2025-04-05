import extension from "../config";
import { Command } from "../lib/canopy/CanopyExtension";
import { Block, Player } from "@minecraft/server";
import UnderstudyManager from "../classes/UnderstudyManager";
import { isNumeric, PLAYER_EYE_HEIGHT, getLookAtLocation } from "../utils";
import { Vector } from "../lib/Vector";

const commandPlayerCommand = new Command({
    name: 'player',
    description: { text: `Main ${extension.name} command. (Alias: p)` },
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
        { usage: `player <name> join`, description: { text: `Make a new player join at your location.` } },
        { usage: `player <name> leave`, description: { text: `Make a player leave the game.` } },
        { usage: `player <name> rejoin`, description: { text: `Make a player rejoin at its last location.` } },
        { usage: `player <name> tp`, description: { text: `Make a player teleport to you.` } },
        { usage: `player <name> look [up/down/north/south/east/west/block/entity/me/x y z/pitch yaw]`, description: { text: `Make a player look in specified directions.` } },
        { usage: `player <name> move [forward/backward/left/right/block/entity/me/x y z]`, description: { text: `Make a player move in specified directions.` } },
        { usage: `player <name> <attack/interact/use/build/break/drop/dropstack/dropall/jump> [once/continuous/interval] [intervalDuration]`, description: { text: `Make a player do an action with variable timing.` } },
        { usage: `player <name> select [slotNumber]`, description: { text: `Make a player select a slot.` } },
        { usage: `player <name> <sprint/unsprint>`, description: { text: `Make a player start or stop sprinting.` } },
        { usage: `player <name> <sneak/unsneak>`, description: { text: `Make a player start or stop sneaking.` } },
        { usage: `player <name> claimprojectiles [radius]`, description: { text: `Make a player the owner of all nearby projectiles.` } },
        { usage: `player <name> inv`, description: { text: `Print the inventory of a player.` } },
        { usage: `player <name> swapheld`, description: { text: `Swap the held item of a player with your held item.` } },
        { usage: `player <name> stop`, description: { text: `Stop all actions for a player.` } },
        { usage: `player prefix <prefix>`, description: { text: `Set a prefix player nametags.` } }
    ]
});
extension.addCommand(commandPlayerCommand);

const commandPlayerAliasCommand = new Command({
    name: 'p',
    description: { text: `Main ${extension.name} command.` },
    usage: 'p <name> <action>',
    callback: playerCommand,
    args: [
        { type: 'string|number', name: 'name' },
        { type: 'string|number', name: 'action' },
        { type: 'string|number', name: 'arg1' },
        { type: 'string|number', name: 'arg2' },
        { type: 'string|number', name: 'arg3' }
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

    if (['join', 'rejoin'].includes(action)) {
        if (UnderstudyManager.isOnline(name)) {
            if (sender instanceof Player === false) return;
            sender.sendMessage(`§cPlayer ${name} is already online.`);
            return;
        }
    } else if (!UnderstudyManager.isOnline(name)) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cPlayer ${name} is not online.`);
        return;
    }

    const simPlayer = UnderstudyManager.getPlayer(name);
    switch (action) {
        case 'join':
            joinAction(sender, name);
            break;
        case 'leave':
            leaveAction(simPlayer);
            break;
        case 'rejoin':
            rejoinAction(sender, name);
            break;
        case 'tp':
            tpAction(sender, simPlayer);
            break;
        case 'look':
            lookAction(sender, simPlayer, arg1, arg2, arg3);
            break;
        case 'move':
            moveAction(sender, simPlayer, arg1, arg2, arg3);
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
            variableTimingAction(sender, simPlayer, action, arg1, arg2);
            break;
        case 'select':
            selectSlotAction(sender, simPlayer, arg1);
            break;
        case 'sprint':
            simPlayer.sprint(true);
            break;
        case 'unsprint':
            simPlayer.sprint(false);
            break;
        case 'sneak':
            simPlayer.sneak(true);
            break;
        case 'unsneak':
            simPlayer.sneak(false);
            break;
        case 'claimprojectiles':
            claimProjectilesAction(simPlayer, arg1);
            break;
        case 'stop':
            simPlayer.stopAll();
            break;
        case 'inv':
            simPlayer.printInventory(sender);
            break;
        case 'swapheld':
            simPlayer.swapHeldItemWithPlayer(sender);
            break;
        default:
            if (sender instanceof Player === false) return;
            sender.sendMessage(`§cInvalid action: ${action}`);
            break;
    }
}

function getLocationInfoFromSource(source) {
    if (source instanceof Block)
        return { location: { x: source.x + .5, y: source.y + 1, z: source.z + .5 }, rotation: { x: 0, y: 0 }, dimensionId: source.dimension.id };
    else if (source instanceof Player)
        return { location: source.location, dimensionId: source.dimension.id, rotation: source.getRotation(), gameMode: source.getGameMode() };
}

function joinAction(sender, name) {
    const simPlayer = UnderstudyManager.newPlayer(name);
    simPlayer.join(getLocationInfoFromSource(sender));
    UnderstudyManager.spawnPlayer(simPlayer);
}

function leaveAction(simPlayer) {
    simPlayer.leave();
    UnderstudyManager.removePlayer(simPlayer);
}

function rejoinAction(sender, name) {
    const simPlayer = UnderstudyManager.newPlayer(name);
    UnderstudyManager.spawnPlayer(simPlayer);
    try {
        simPlayer.rejoin();
    } catch (error) {
        simPlayer.join(getLocationInfoFromSource(sender));
    }
}

function tpAction(sender, simPlayer) {
    simPlayer.tp(getLocationInfoFromSource(sender));
}

function lookAction(sender, simPlayer, arg1, arg2, arg3) {
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
        simPlayer.lookLocation(new Vector(arg1, arg2, arg3));
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
    if (!directions[direction])
        throw new Error(`[Understudy] Invalid look direction: ${direction}`);
    return {
        x: simulatedPlayer.location.x + directions[direction].x, 
        y: simulatedPlayer.location.y + directions[direction].y + PLAYER_EYE_HEIGHT, 
        z: simulatedPlayer.location.z + directions[direction].z 
    };
}

function moveAction(sender, simPlayer, arg1, arg2, arg3) {
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
        simPlayer.moveLocation(new Vector(arg1, arg2, arg3));
    } else {
        sender.sendMessage(`§cInvalid move action: ${[arg1, arg2, arg3].join(', ')}. Expected 'forward', 'backward', 'left', 'right', 'block', 'entity', 'me', or coordinates.`);
    }
}

function variableTimingAction(sender, simPlayer, action, arg1, arg2) {
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

    simPlayer.variableTimingAction(action, isContinuous, intervalDuration);
}

function selectSlotAction(sender, simPlayer, arg1) {
    if (!isNumeric(arg1) || arg1 < 0 || arg1 > 8) {
        if (sender instanceof Player === false) return;
        sender.sendMessage(`§cInvalid slot number: ${arg1}. Expected a number fom 0 to 8.`);
        return;
    }
    simPlayer.selectSlot(arg1);
}

function claimProjectilesAction(simPlayer, arg1) {
    let radius = 25;
    if (isNumeric(arg1))
        radius = arg1;
    simPlayer.claimProjectiles(radius);
}

export { playerCommand };