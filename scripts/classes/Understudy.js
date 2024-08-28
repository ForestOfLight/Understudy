import { Block, Entity, Player, world } from "@minecraft/server";
import { getLookAtRotation } from "utils";

class Understudy {
    #lookTarget;

    constructor(name) {
        this.name = name;
        this.isConnected = false;
        this.simulatedPlayer = null;
        this.nextActions = [];
        this.continuousActions = [];
        this.#lookTarget = null;
    }

    getLookTarget() {
        return this.#lookTarget;
    }

    removeLookTarget() {
        this.#lookTarget = null;
    }

    getHeadRotation() {
        if (this.#lookTarget === null) 
            return this.simulatedPlayer.headRotation;
        let targetLocation;
        if (this.#lookTarget instanceof Player)
            targetLocation = this.#lookTarget.getHeadLocation();
        else
            targetLocation = this.#lookTarget.location;
        return getLookAtRotation(this.simulatedPlayer.location, targetLocation);
    }

    savePlayerInfo({ location, rotation, dimensionId, gameMode } = {}) {
        // save inventory?
        const playerInfo = { 
            location: location || this.simulatedPlayer.location, 
            rotation: rotation || this.getHeadRotation(), 
            dimensionId: dimensionId || this.simulatedPlayer.dimension.id, 
            gameMode: gameMode || this.simulatedPlayer.getGameMode() 
        };
        world.setDynamicProperty(`${this.name}:playerinfo`, JSON.stringify(playerInfo));
    }

    onTick() {
        if (this.#lookTarget === undefined)
            this.removeLookTarget();
    }

    hasContinuousAction(actionType) {
        return this.continuousActions.some(action => action.type === actionType);
    }

    removeContinuousAction(actionType) {
        this.continuousActions = this.continuousActions.filter(action => action.type !== actionType);
    }

    clearContinuousActions() {
        this.continuousActions = [];
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
        this.savePlayerInfo(actionData);
    }

    leave() {
        this.savePlayerInfo();
        const actionData = { type: 'leave' };
        this.nextActions.push(actionData);
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
        this.savePlayerInfo(actionData);
    }

    lookLocation(target) {
        const actionData = { type: 'look' };
        if (target instanceof Block) {
            actionData.blockPos = target?.location;
            this.#lookTarget = target;
        } else if (target instanceof Entity) {
            actionData.entityId = target?.id;
            this.#lookTarget = target;
        } else {
            actionData.location = target;
        }
        if (actionData.location === undefined && actionData.entityId === undefined && actionData.blockPos === undefined)
            throw new Error(`[Understudy] Invalid target provided for ${this.name}`);
        this.nextActions.push(actionData);
    }

    moveLocation(target) {
        const actionData = { type: 'moveLocation' };
        if (target instanceof Block) {
            actionData.blockPos = target?.location;
        } else if (target instanceof Entity) {
            actionData.entityId = target?.id;
        } else {
            actionData.location = target;
        }
        if (actionData.location === undefined && actionData.entityId === undefined && actionData.blockPos === undefined)
            throw new Error(`[Understudy] Invalid target provided for ${this.name}`);
        this.nextActions.push(actionData);
    }

    moveRelative(direction) {
        const actionData = { type: 'moveRelative', direction: direction };
        this.nextActions.push(actionData);
    }

    dropSelected() {
        const actionData = { type: 'dropSelected' };
        this.nextActions.push(actionData);
    }

    jump(isContinuous) {
        if (!isContinuous && this.hasContinuousAction('jump'))
            this.removeContinuousAction('jump');

        const actionData = { type: 'jump' };
        if (isContinuous)
            this.continuousActions.push(actionData);
        else
            this.nextActions.push(actionData);
    }

    sprint(shouldSprint) {
        const actionData = { type: 'sprint', shouldSprint: shouldSprint };
        this.nextActions.push(actionData);
    }

    claimProjectiles(radius) {
        const actionData = { type: 'claimProjectiles', radius: radius };
        this.nextActions.push(actionData);
    }

    stopAll() {
        const actionData = { type: 'stopAll' };
        this.nextActions.push(actionData);
        this.savePlayerInfo();
    }
}

export default Understudy;