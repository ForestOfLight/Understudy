import { Block, Entity, world } from "@minecraft/server";

class Understudy {
    constructor(name) {
        this.name = name;
        this.isConnected = false;
        this.simulatedPlayer = null;
        this.nextActions = [];
        this.continuousActions = [];
        this.target = null;
    }

    join(location, rotation, dimensionId, gameMode) {
        const actionData = { 
            type: 'join', 
            location: location, 
            rotation: rotation, 
            dimensionId: dimensionId, 
            gameMode: gameMode 
        };
        this.nextActions.push(actionData);
        const playerInfo = { 
            location: location, 
            rotation: rotation, 
            dimensionId: dimensionId, 
            gameMode: gameMode
        };
        world.setDynamicProperty(`${this.name}:playerinfo`, JSON.stringify(playerInfo));
    }

    leave() {
        const actionData = { type: 'leave' };
        this.nextActions.push(actionData);
        const playerInfo = { 
            location: this.simulatedPlayer.location, 
            rotation: this.simulatedPlayer.headRotation, 
            dimensionId: this.simulatedPlayer.dimension.id, 
            gameMode: this.simulatedPlayer.getGameMode() 
        };
        world.setDynamicProperty(`${this.name}:playerinfo`, JSON.stringify(playerInfo));
        // save inventory?
    }

    rejoin() {
        let playerInfo;
        try {
            playerInfo = JSON.parse(world.getDynamicProperty(`${this.name}:playerinfo`));
        } catch (error) {
            if (error.name === 'SyntaxError') {
                throw new Error(`[Understudy] Player ${this.name} has no player info saved`);
            }
            throw error;
        }
        const actionData = { 
            type: 'join', 
            location: playerInfo.location, 
            rotation: playerInfo.rotation, 
            dimensionId: playerInfo.dimensionId, 
            gameMode: playerInfo.gameMode 
        };
        this.nextActions.push(actionData);
    }

    respawn() {
        const playerInfo = JSON.parse(world.getDynamicProperty(`${this.name}:playerinfo`));
        const actionData = { 
            type: 'respawn',
            location: playerInfo.location,
            rotation: playerInfo.rotation,
            dimensionId: playerInfo.dimensionId
        };
        this.nextActions.push(actionData);
    }

    tp(location, rotation, dimensionId) {
        const actionData = { 
            type: 'tp', 
            location, 
            dimensionId, 
            rotation 
        };
        this.nextActions.push(actionData);
    }

    lookLocation(target) {
        let actionData = { type: 'look' };
        if (target instanceof Block) {
            actionData.blockPos = target?.location;
        } else if (target instanceof Entity) {
            actionData.entityId = target?.id;
        } else {
            actionData.location = target;
        }
        if (actionData.location === undefined && actionData.entityId === undefined && actionData.blockPos === undefined)
            throw new Error(`[Understudy] Invalid target provided for ${this.name}`);
        this.target = target;
        this.nextActions.push(actionData);
    }

    moveLocation(location) {
        const actionData = { type: 'moveLocation', location: location };
        this.nextActions.push(actionData);
    }

    moveRelative(direction) {
        const actionData = { type: 'moveRelative', direction: direction };
        this.nextActions.push(actionData);
    }
}

export default Understudy;