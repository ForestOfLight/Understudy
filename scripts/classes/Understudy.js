import extension from "../config";
import { Block, Entity, Player, world, system, DimensionTypes, TicksPerSecond, GameMode } from "@minecraft/server";
import { getLookAtRotation, isNumeric, portOldGameModeToNewUpdate } from "../utils";
import { UnderstudyInventory } from "./UnderstudyInventory";

const SAVE_INTERVAL = 600;

class Understudy {
    #lookTarget;

    constructor(name) {
        this.name = name;
        this.isConnected = false;
        this.simulatedPlayer = null;
        this.nextActions = [];
        this.continuousActions = [];
        this.#lookTarget = null;
        this.inventory = new UnderstudyInventory(this);
        this.createdTick = system.currentTick;
    }

    onConnectedTick() {
        this.savePlayerInfoOnInterval();
        if (this.#lookTarget === undefined)
            this.removeLookTarget();
        if (this.simulatedPlayer !== null)
            this.refreshHeldItem();
    }

    savePlayerInfoOnInterval() {
        if (extension.getRuleValue('noSimplayerSaving'))
            return;
        if ((system.currentTick - this.createdTick) % SAVE_INTERVAL === 0) {
            this.savePlayerInfo();
            return;
        }
        if (this.hasContinuousAction()) {
            if ((system.currentTick - this.createdTick) % (TicksPerSecond*5) === 0)
                this.savePlayerInfo();
            else
                this.inventory.saveWithoutNBT();
        }
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
            try {
               targetLocation = this.#lookTarget.getHeadLocation();
            } catch {
                return this.simulatedPlayer.headRotation;
            }
        else
            targetLocation = this.#lookTarget.location;
        return getLookAtRotation(this.simulatedPlayer.location, targetLocation);
    }

    getPlayerInfo() {
        if (extension.getRuleValue('noSimplayerSaving'))
            throw new Error(`[Understudy] Player ${this.name} has no player info saved due to 'noSimplayerSaving' rule being enabled`);
        let playerInfo;
        try {
            playerInfo = JSON.parse(world.getDynamicProperty(`${this.name}:playerinfo`));
        } catch (error) {
            if (error.name === 'SyntaxError') {
                throw new Error(`[Understudy] Player ${this.name} has no player info saved`);
            }
            throw error;
        }
        return playerInfo;
    }

    savePlayerInfo({ location, rotation, dimensionId, gameMode, projectileIds } = {}) {
        if (this.simulatedPlayer === null || !this.isConnected || extension.getRuleValue('noSimplayerSaving'))
            return;
        const dynamicInfo = {
            location: location || this.simulatedPlayer.location,
            rotation: rotation || this.getHeadRotation(),
            dimensionId: dimensionId || this.simulatedPlayer.dimension.id,
            gameMode: gameMode || this.simulatedPlayer.getGameMode(),
            projectileIds: projectileIds || this.getOwnedProjectileIds()
        };
        world.setDynamicProperty(`${this.name}:playerinfo`, JSON.stringify(dynamicInfo));
        this.inventory.save();
    }

    loadPlayerInfo() {
        if (extension.getRuleValue('noSimplayerSaving'))
            return void 0;
        let playerInfo;
        try {
            playerInfo = this.getPlayerInfo();
            this.claimProjectileIds(playerInfo.projectileIds);
            this.inventory.load();
            return playerInfo;
        } catch {
            return void 0;
        }
    }

    getOwnedProjectileIds() {
        let projectileIds = [];
        for (const dimension of DimensionTypes.getAll()) {
            const projectiles = world.getDimension(dimension.typeId).getEntities().filter(entity => {
                const projectileComponent = entity.getComponent('minecraft:projectile');
                return projectileComponent?.owner === this.simulatedPlayer;
            });
            projectileIds = projectileIds.concat(projectiles.map(projectile => projectile.id));
        }
        return projectileIds;
    }

    claimProjectileIds(projectileIds) {
        projectileIds?.forEach(projectileId => {
            const projectile = world.getEntity(projectileId);
            if (projectile?.getComponent('minecraft:projectile')) {
                projectile.getComponent('minecraft:projectile').owner = this.simulatedPlayer;
            }
        });
    }

    addContinuousAction(actionData) {
        if (!this.hasContinuousAction(actionData.type)) {
            this.continuousActions.push(actionData);
            return;
        }
        const action = this.continuousActions.find(action => action.type === actionData.type) || actionData;
        if (isNumeric(actionData.interval)) {
            action.interval = actionData.interval;
        } else {
            action.interval = undefined;
        }
    }

    hasContinuousAction(actionType) {
        if (!actionType) 
            return this.continuousActions.length > 0;
        return this.continuousActions.some(action => action.type === actionType);
    }

    removeContinuousAction(actionType) {
        this.continuousActions = this.continuousActions.filter(action => action.type !== actionType);
    }

    clearContinuousActions() {
        this.continuousActions = [];
    }

    join({ location, dimensionId, rotation = { x: 0, y: 0 }, gameMode = GameMode.Survival }) {
        const updatedGameMode = portOldGameModeToNewUpdate(gameMode);
        const actionData = {
            type: 'join', 
            location: location, 
            rotation: rotation, 
            dimensionId: dimensionId, 
            gameMode: updatedGameMode
        };
        this.nextActions.push(actionData);
    }

    leave() {
        this.savePlayerInfo();
        if (this.simulatedPlayer === null)
            throw new Error(`[Understudy] Player ${this.name} is not connected`);
        const actionData = { type: 'leave' };
        this.nextActions.push(actionData);
    }

    rejoin() {
        const playerInfo = this.getPlayerInfo();
        this.join({
            location: playerInfo.location,
            rotation: playerInfo.rotation,
            dimensionId: playerInfo.dimensionId,
            gameMode: playerInfo.gameMode
        });
    }

    tp({ location, dimensionId, rotation }) {
        const actionData = { 
            type: 'tp',
            location,
            dimensionId,
            rotation 
        };
        this.nextActions.push(actionData);
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

    variableTimingAction(actionType, isContinuous, interval) {
        if (!isContinuous && this.hasContinuousAction(actionType))
            this.removeContinuousAction(actionType);

        const actionData = { type: actionType };
        if (interval)
            actionData.interval = interval;
        if (isContinuous)
            this.addContinuousAction(actionData);
        else
            this.nextActions.push(actionData);
    }

    selectSlot(slotNumber) {
        const actionData = { type: 'select', slot: slotNumber };
        this.nextActions.push(actionData);
    }

    sprint(shouldSprint) {
        const actionData = { type: 'sprint', shouldSprint: shouldSprint };
        this.nextActions.push(actionData);
    }

    sneak(shouldSneak) {
        const actionData = { type: 'sneak', shouldSneak: shouldSneak };
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

    printInventory(recipientPlayer) {
        const actionData = { type: 'printInventory', recipientPlayer: recipientPlayer };
        this.nextActions.push(actionData);
    }

    swapHeldItemWithPlayer(player) {
        const actionData = { type: 'swapHeldItem', player: player };
        this.nextActions.push(actionData);
    }

    refreshHeldItem() {
        this.simulatedPlayer.selectedSlotIndex = this.simulatedPlayer.selectedSlotIndex;
    }
}

export default Understudy;