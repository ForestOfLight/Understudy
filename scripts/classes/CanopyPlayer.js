class CanopyPlayer {
    #nextActions;
    #continuousActions;

    constructor(name) {
        this.name
        this.isConnected = false;
        this.simulatedPlayer = null;
        this.#nextActions = [];
        this.#continuousActions = [];
    }

    join(location, gameMode) {
        const actionData = { type: 'join', location: location, gameMode: gameMode };
        this.#nextActions.push(actionData);
        const playerInfo = { location: location, gameMode: gameMode };
        world.setDynamicProperty(`canopyplayers:${this.name}:playerinfo`, JSON.stringify(playerInfo));
    }

    leave() {
        const actionData = { type: 'leave' };
        this.#nextActions.push(actionData);
        const playerInfo = { location: this.simulatedPlayer.location, rotation: this.simulatedPlayer.headRotation, gameMode: this.simulatedPlayer.getGameMode() };
        world.setDynamicProperty(`canopyplayers:${this.name}:playerinfo`, JSON.stringify(playerInfo));
        // save inventory?
    }

    rejoin() {
        const playerInfo = JSON.parse(world.getDynamicProperty(`canopyplayers:${this.name}:playerinfo`));
        const actionData = { type: 'rejoin', location: playerInfo.location, rotation: playerInfo.rotation, gameMode: playerInfo.gameMode };
        this.#nextActions.push(actionData);
    }

    tp(location, rotation) {
        const actionData = { type: 'tp', location: location, rotation: rotation };
        this.#nextActions.push(actionData);
    }
}

export default CanopyPlayer;