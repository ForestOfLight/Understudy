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

function getLookAtLocation(location, rotation) {
    const pitch = rotation.x;
    const yaw = rotation.y + 90;
    const xz = Math.cos(pitch * Math.PI / 180);
    const x = xz * Math.cos(yaw * Math.PI / 180);
    const y = Math.sin(-pitch * Math.PI / 180);
    const z = xz * Math.sin(yaw * Math.PI / 180);
    return { x: location.x + x, y: location.y + y + PLAYER_EYE_HEIGHT, z: location.z + z };
}

function isNumeric(value) {
    return !isNaN(parseFloat(value)) && isFinite(value);
}

export { PLAYER_EYE_HEIGHT, stringifyLocation, subtractVectors, makeVector3, getLookAtLocation, isNumeric };