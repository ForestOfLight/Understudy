import { Block, Entity, Player, world, EquipmentSlot, system, DimensionTypes } from "@minecraft/server";
import { getLookAtRotation, isNumeric } from "../utils";
import SRCItemDatabase from "../lib/SRCItemDatabase/ItemDatabase.js";

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
        const tableName = 'bot_' + this.name.substr(0, 8);
        this.itemDatabase = new SRCItemDatabase(tableName);
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
        if (this.simulatedPlayer === null || !this.isConnected)
            return;
        const dynamicInfo = {
            location: location || this.simulatedPlayer.location,
            rotation: rotation || this.getHeadRotation(),
            dimensionId: dimensionId || this.simulatedPlayer.dimension.id,
            gameMode: gameMode || this.simulatedPlayer.getGameMode(),
            projectileIds: projectileIds || this.getOwnedProjectileIds()
        };
        world.setDynamicProperty(`${this.name}:playerinfo`, JSON.stringify(dynamicInfo));
        this.saveItems();
    }

    loadPlayerInfo() {
        const playerInfo = this.getPlayerInfo();
        this.claimProjectileIds(playerInfo.projectileIds);
        this.loadItems();
        return playerInfo;
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

    saveItems() {
        if (this.simulatedPlayer !== null) {
            const inventoryContainer = this.simulatedPlayer.getComponent('minecraft:inventory')?.container;
            if (inventoryContainer !== undefined) {
                for (let i = 0; i < inventoryContainer.size; i++) {
                    const key = `inventory_${i}`;
                    const itemStack = inventoryContainer.getItem(i);
                    if (itemStack !== undefined)
                        this.itemDatabase.set(key, itemStack);
                    else if (this.itemDatabase.has(key))
                        this.itemDatabase.delete(key);
                }
            }
            const equippable = this.simulatedPlayer.getComponent('minecraft:equippable');
            if (equippable !== undefined) {
                for (const equipmentSlot in EquipmentSlot) {
                    const key = `equ_${equipmentSlot}`;
                    const itemStack = equippable.getEquipment(equipmentSlot);
                    if (itemStack !== undefined)
                        this.itemDatabase.set(key, itemStack);
                    else if (this.itemDatabase.has(key))
                        this.itemDatabase.delete(key);
                }
            }
        }
    }

    loadItems() {
        if (this.simulatedPlayer !== null) {
            const inventoryContainer = this.simulatedPlayer.getComponent('minecraft:inventory')?.container;
            if (inventoryContainer !== undefined) {
                for (let i = 0; i < inventoryContainer.size; i++) {
                    const key = `inventory_${i}`;
                    const itemStack = this.itemDatabase.get(key);
                    inventoryContainer.setItem(i, itemStack);
                }
            }
            const equippable = this.simulatedPlayer.getComponent('minecraft:equippable');
            if (equippable !== undefined) {
                for (const equipmentSlot in EquipmentSlot) {
                    const key = `equ_${equipmentSlot}`;
                    const itemStack = this.itemDatabase.get(key);
                    equippable.setEquipment(equipmentSlot, itemStack);
                }
            }
        }
    }

    onTick() {
        if (system.currentTick % SAVE_INTERVAL === 0)
            this.savePlayerInfo();
        if (this.#lookTarget === undefined)
            this.removeLookTarget();
        if (this.simulatedPlayer !== null) {
            this.simulatedPlayer.selectedSlotIndex = this.simulatedPlayer.selectedSlotIndex;
        }
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
        return this.continuousActions.some(action => action.type === actionType);
    }

    removeContinuousAction(actionType) {
        this.continuousActions = this.continuousActions.filter(action => action.type !== actionType);
    }

    clearContinuousActions() {
        this.continuousActions = [];
    }

    join({ location, dimensionId, rotation = { x: 0, y: 0 }, gameMode = "survival" }) {
        const actionData = {
            type: 'join', 
            location: location, 
            rotation: rotation, 
            dimensionId: dimensionId, 
            gameMode: gameMode 
        };
        this.nextActions.push(actionData);
        this.loadPlayerInfo();
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
        system.runTimeout(() => {
            this.loadPlayerInfo();
        }, 1);
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
}

export default Understudy;