import { Block, Entity, Player, world } from "@minecraft/server";

class CanopyPlayer {
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
        const playerInfo = JSON.parse(world.getDynamicProperty(`${this.name}:playerinfo`));
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

    targetLocation(target) {
        let actionData = { type: 'look' };
        if (target instanceof Block) {
            actionData.blockPos = target?.location;
        } else if (target instanceof Entity) {
            actionData.entityId = target?.id;
        } else {
            actionData.location = target;
        }
        if (actionData.location === undefined && actionData.entityId === undefined && actionData.blockPos === undefined)
            throw new Error(`[CanopyPlayers] Invalid target provided for ${this.name}`);
        this.target = target;
        this.nextActions.push(actionData);
    }
}

export default CanopyPlayer;