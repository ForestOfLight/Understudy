import { world } from "@minecraft/server";

class CanopyPlayer {
    constructor(name) {
        this.name = name;
        this.isConnected = false;
        this.simulatedPlayer = null;
        this.nextActions = [];
        this.continuousActions = [];
    }

    join(location, rotation, gameMode) {
        const actionData = { type: 'join', location: location, rotation: rotation, gameMode: gameMode };
        this.nextActions.push(actionData);
        const playerInfo = { location: location, gameMode: gameMode };
        world.setDynamicProperty(`${this.name}:playerinfo`, JSON.stringify(playerInfo));
    }

    leave() {
        const actionData = { type: 'leave' };
        this.nextActions.push(actionData);
        const playerInfo = { location: this.simulatedPlayer.location, rotation: this.simulatedPlayer.headRotation, gameMode: this.simulatedPlayer.getGameMode() };
        world.setDynamicProperty(`${this.name}:playerinfo`, JSON.stringify(playerInfo));
        // save inventory?
    }

    rejoin() {
        const playerInfo = JSON.parse(world.getDynamicProperty(`${this.name}:playerinfo`));
        const actionData = { type: 'join', location: playerInfo.location, rotation: playerInfo.rotation, gameMode: playerInfo.gameMode };
        this.nextActions.push(actionData);
    }

    tp(location, rotation) {
        const actionData = { type: 'tp', location: location, rotation: rotation };
        this.nextActions.push(actionData);
    }

    look(location) {
        if (location === undefined)
            throw new Error(`[CanopyPlayers] Invalid location for look action for player ${this.name}`);
        const actionData = { type: 'look', location: location };
        this.nextActions.push(actionData);
    }
}

export default CanopyPlayer;