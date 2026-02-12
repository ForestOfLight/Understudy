import { extension } from "../main";
import { Block, Entity, Player, world, system, DimensionTypes, TicksPerSecond, GameMode, EntityComponentTypes } from "@minecraft/server";
import { getLookAtRotation, isNumeric, portOldGameModeToNewUpdate } from "../utils";
import { UnderstudyInventory } from "./UnderstudyInventory";
import { Vector } from "../lib/Vector";

const SAVE_INTERVAL = 600;

class Understudy {
    #lookTarget;

    constructor(name) {
        this.name = name;
        this.isConnected = false;
        this.simulatedPlayer = null;
        this.nextActions = [];
        this.repeatingActions = [];
        this.#lookTarget = void 0;
        this.inventory = new UnderstudyInventory(this);
        this.createdTick = system.currentTick;
    }

    onConnectedTick() {
        this.savePlayerInfoOnInterval();
        if (this.getLookTarget() === void 0)
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
        if (this.hasRepeatingAction()) {
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
        this.#lookTarget = void 0;
    }

    getHeadRotation() {
        if (this.#lookTarget === void 0) 
            return this.simulatedPlayer.headRotation;
        let targetLocation;
        if (this.#lookTarget instanceof Entity)
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

    addRepeatingAction(actionData) {
        if (!this.hasRepeatingAction(actionData.type)) {
            this.repeatingActions.push(actionData);
            return;
        }
        const action = this.repeatingActions.find(action => action.type === actionData.type) || actionData;
        if (isNumeric(actionData.interval))
            action.interval = actionData.interval;
        else
            action.interval = void 0;
    }

    hasRepeatingAction(actionType) {
        if (!actionType) 
            return this.repeatingActions.length > 0;
        return this.repeatingActions.some(action => action.type === actionType);
    }

    removeRepeatingAction(actionType) {
        this.repeatingActions = this.repeatingActions.filter(action => action.type !== actionType);
    }

    clearRepeatingActions() {
        this.repeatingActions = [];
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

    tp({ location, dimensionId, rotation = { x: 0, y: 0 } }) {
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
        } else if (target instanceof Vector) {
            actionData.location = target;
        } else {
            actionData.rotation = target;
        }
        if (actionData.location === void 0 && actionData.entityId === void 0 && actionData.blockPos === void 0 && actionData.rotation === void 0)
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
    
    singleTimingAction(actionType, afterTicks = void 0) {
        const actionData = { type: actionType };
        if (afterTicks === void 0)
            this.nextActions.push(actionData);
        system.runTimeout(() => this.nextActions.push(actionData), afterTicks);
    }

    repeatingTimingAction(actionType, intervalTicks = void 0) {
        if (this.hasRepeatingAction(actionType))
            this.removeRepeatingAction(actionType);
        const actionData = { type: actionType };
        if (intervalTicks)
            actionData.interval = intervalTicks;
        this.addRepeatingAction(actionData);
    }

    selectSlot(slotNumber) {
        this.simulatedPlayer.selectedSlotIndex = slotNumber;
        this.savePlayerInfo();
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

    stopLooking() {
        const target = this.getLookTarget();
        if (target === void 0)
            return;
        this.removeLookTarget();
        if (target instanceof Player)
            this.lookLocation(Vector.from(target.getHeadLocation()));
        else if (target instanceof Block)
            this.lookLocation(Vector.from(target.location));
        else
            this.lookLocation(Vector.from(target));
    }

    stopMoving() {
        this.simulatedPlayer.stopMoving();
    }

    getInventory() {
        return this.simulatedPlayer.getComponent(EntityComponentTypes.Inventory)?.container;
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