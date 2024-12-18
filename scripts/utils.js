import { world, ItemStack } from "@minecraft/server";

const PLAYER_EYE_HEIGHT = 1.62001002;

function stringifyLocation(location, precision = 2) {
    return '[' + location.x.toFixed(precision) + ' ' + location.y.toFixed(precision) + ' ' + location.z.toFixed(precision) + ']';
}

function subtractVectors(a, b) {
    return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function makeVector3(x, y, z) {
    if (Number(x) === x && Number(y) === y && Number(z) === z)
        return { x: x, y: y, z: z };
    else
        throw new Error(`Invalid vector coordinates: ${x}, ${y}, ${z}`);
}

function getLookAtLocation(baseLocation, targetRotation) {
    const extraDistance = 1000;
    const pitch = targetRotation.x;
    const yaw = targetRotation.y + 90;
    const xz = Math.cos(pitch * Math.PI / 180);
    const x = xz * Math.cos(yaw * Math.PI / 180) * extraDistance;
    const y = Math.sin(-pitch * Math.PI / 180) * extraDistance;
    const z = xz * Math.sin(yaw * Math.PI / 180) * extraDistance;
    return { x: baseLocation.x + x, y: baseLocation.y + y + PLAYER_EYE_HEIGHT, z: baseLocation.z + z };
}

function getLookAtRotation(baseLocation, targetLocation) {
    const x = targetLocation.x - baseLocation.x;
    const y = targetLocation.y - baseLocation.y - PLAYER_EYE_HEIGHT;
    const z = targetLocation.z - baseLocation.z;
    const yaw = Math.atan2(z, x) * 180 / Math.PI - 90;
    const xz = Math.sqrt(x * x + z * z);
    const pitch = -Math.atan2(y, xz) * 180 / Math.PI;
    return { x: pitch, y: yaw };
}

function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

function swapSlots(player, slotNumber1, slotNumber2) {
    const invContainer = player?.getComponent('minecraft:inventory')?.container;
    if (!invContainer)
        throw new Error('[Understudy] Player does not have an inventory container.');
    const slot1 = invContainer.getItem(slotNumber1);
    const slot2 = invContainer.getItem(slotNumber2);
    invContainer.setItem(slotNumber1, slot2);
    invContainer.setItem(slotNumber2, slot1);
}

function broadcastActionBar(message, sender) {
    let players;
    if (sender) players = world.getPlayers({ excludeNames: [sender.name] });
    else players = world.getAllPlayers();
    players.forEach(player => player?.onScreenDisplay.setActionBar(message));
}

export { 
    PLAYER_EYE_HEIGHT, stringifyLocation, subtractVectors, makeVector3, getLookAtLocation, isNumeric, getLookAtRotation, swapSlots, broadcastActionBar
};