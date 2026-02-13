import { extension } from "../main";
import { Block, Entity, Player, world, system, DimensionTypes, TicksPerSecond, GameMode, EntityComponentTypes } from "@minecraft/server";
import { spawnSimulatedPlayer } from "@minecraft/server-gametest";
import { getLookAtLocation, getLookAtRotation, isNumeric, portOldGameModeToNewUpdate } from "../utils";
import { UnderstudyInventory } from "./UnderstudyInventory";
import { Vector } from "../lib/Vector";
import { MOVE_OPTIONS } from "../commands/move";

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
        if (!this.getLookTarget()?.isValid)
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
        if (!this.#lookTarget?.isValid)
            this.removeLookTarget();
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

    savePlayerInfo({ location, rotation, dimension, gameMode, projectileIds } = {}) {
        if (this.simulatedPlayer === null || !this.isConnected || extension.getRuleValue('noSimplayerSaving'))
            return;
        const dynamicInfo = {
            location: location || this.simulatedPlayer.location,
            rotation: rotation || this.getHeadRotation(),
            dimensionId: dimension?.id || this.simulatedPlayer.dimension.id,
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

    join({ location, dimension, rotation = { x: 0, y: 0 }, gameMode = GameMode.Survival }) {
        const updatedGameMode = portOldGameModeToNewUpdate(gameMode);
        const dimensionLocation = location;
        dimensionLocation.dimension = dimension;
        this.simulatedPlayer = spawnSimulatedPlayer(dimensionLocation, this.name, updatedGameMode);
        this.teleport({ location, rotation, dimension });
        system.run(() => this.loadPlayerInfo());
        this.isConnected = true;
    }

    leave() {
        this.savePlayerInfo();
        if (this.simulatedPlayer === null)
            throw new Error(`[Understudy] Player ${this.name} is not connected`);
        this.savePlayerInfo();
        this.simulatedPlayer.remove();
        this.simulatedPlayer = null;
        this.removeLookTarget();
        this.isConnected = false;
        world.sendMessage(`§e${this.name} left the game`);
    }

    rejoin() {
        const playerInfo = this.getPlayerInfo();
        this.join({
            location: playerInfo.location,
            rotation: playerInfo.rotation,
            dimension: world.getDimension(playerInfo.dimensionId),
            gameMode: playerInfo.gameMode
        });
    }

    teleport({ location, dimension, rotation = { x: 0, y: 0 } }) {
        const teleportOptions = {
            dimension: dimension,
            facingLocation: getLookAtLocation(location, rotation),
            rotation: rotation
        };
        this.simulatedPlayer.teleport(location, teleportOptions);
        this.savePlayerInfo();
    }

    look(target) {
        if (target instanceof Block) {
            this.simulatedPlayer.lookAtBlock(target);
            this.#lookTarget = target;
        } else if (target instanceof Entity) {
            this.simulatedPlayer.lookAtEntity(target);
            this.#lookTarget = target;
        } else if (target instanceof Vector) {
            this.simulatedPlayer.lookAtLocation(target);
        } else {
            const rotation = target;
            this.simulatedPlayer.lookAtLocation(getLookAtLocation(this.simulatedPlayer.location, rotation));
            this.simulatedPlayer.setRotation(rotation);
        }
    }

    stopLooking() {
        const target = this.getLookTarget();
        if (target === void 0)
            return;
        this.removeLookTarget();
        if (target instanceof Player)
            this.look(Vector.from(target.getHeadLocation()));
        else if (target instanceof Block)
            this.look(Vector.from(target.location));
        else
            this.look(Vector.from(target));
    }

    moveLocation(target) {
        if (target instanceof Block)
            this.simulatedPlayer.navigateToBlock(target);
        else if (target instanceof Entity)
            this.simulatedPlayer.navigateToEntity(target);
        else
            this.simulatedPlayer.navigateToLocation(target);
    }

    moveRelative(direction) {
        const relativeDirectionMap = {
            [MOVE_OPTIONS.FORWARD]: [0, 1],
            [MOVE_OPTIONS.BACKWARD]: [0, -1],
            [MOVE_OPTIONS.LEFT]: [1, 0],
            [MOVE_OPTIONS.RIGHT]: [-1, 0]
        };
        const relativeDirection = relativeDirectionMap[direction];
        if (!relativeDirection)
            throw new Error(`[Understudy] Invalid relative movement direction: ${direction}`);
        this.simulatedPlayer.moveRelative(...relativeDirection);
    }

    stopMoving() {
        this.simulatedPlayer.stopMoving();
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
        this.simulatedPlayer.isSprinting = shouldSprint;
    }

    sneak(shouldSneak) {
        this.simulatedPlayer.isSneaking = shouldSneak;
    }

    claimProjectiles(radius) {
        const projectileComponents = this.getProjectileComponentsInRange(this.simulatedPlayer, radius);
        if (projectileComponents.length === 0)
            return world.sendMessage(`<${this.simulatedPlayer.name}> §7No projectiles found within ${radius} blocks.`);
        const numChanged = this.changeProjectileOwner(projectileComponents, this.simulatedPlayer);
        world.sendMessage(`<${this.simulatedPlayer.name}> §7Successfully became the owner of ${numChanged} projectiles.`);
        this.savePlayerInfo();
    }

    getProjectileComponentsInRange(player, radius) {
        const projectileComponents = [];
        const radiusEntities = player.dimension.getEntities({ location: player.location, maxDistance: radius });
        for (const entity of radiusEntities) {
            const projectileComponent = entity?.getComponent(EntityComponentTypes.Projectile);
            if (projectileComponent)
                projectileComponents.push(projectileComponent);
        }
        return projectileComponents;
    }

    changeProjectileOwner(projectileComponents, newOwner) {
        for (const projectileComponent of projectileComponents) {
            if (!projectileComponent?.isValid)
                continue;
            projectileComponent.owner = newOwner;
        }
        return projectileComponents.length;
    }

    stopAll() {
        this.clearRepeatingActions();
        this.stopMoving();
        this.simulatedPlayer.stopBuild();
        this.simulatedPlayer.stopInteracting();
        this.simulatedPlayer.stopBreakingBlock();
        this.simulatedPlayer.stopUsingItem();
        this.simulatedPlayer.stopSwimming();
        this.simulatedPlayer.stopGliding();
        this.simulatedPlayer.stopUsingItem();
        this.sprint(false);
        this.sneak(false);
        this.stopHeadRotationInPlace();
        this.savePlayerInfo();
    }

    stopHeadRotationInPlace() {
        const target = this.getLookTarget();
        if (target === void 0)
            return;
        this.removeLookTarget();
        if (target instanceof Player)
            this.look(Vector.from(target.getHeadLocation()));
        else
            this.look(Vector.from(target));
    }

    getInventory() {
        return this.simulatedPlayer.getComponent(EntityComponentTypes.Inventory)?.container;
    }

    swapHeldItemWithPlayer(targetPlayer) {
        const playerInvContainer = this.getInventory();
        const targetInvContainer = targetPlayer.getComponent(EntityComponentTypes.Inventory)?.container;
        try {
            playerInvContainer.swapItems(this.simulatedPlayer.selectedSlotIndex, targetPlayer.selectedSlotIndex, targetInvContainer);
        } catch(error) {
            targetPlayer.sendMessage(`§cError while swapping items: ${error.name}`);
            console.warn(error);
        }
        this.refreshHeldItem();
        this.savePlayerInfo();
    }

    refreshHeldItem() {
        this.simulatedPlayer.selectedSlotIndex = this.simulatedPlayer.selectedSlotIndex;
    }
}

export default Understudy;