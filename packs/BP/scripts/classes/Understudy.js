import { Block, Entity, Player, world, system, DimensionTypes, GameMode, EntityComponentTypes } from "@minecraft/server";
import { spawnSimulatedPlayer } from "@minecraft/server-gametest";
import { getLookAtLocation, getLookAtRotation, isNumeric, portOldGameModeToNewUpdate } from "../utils";
import { Vector } from "../lib/Vector";
import { MOVE_OPTIONS } from "../commands/move";
import { RepeatableAction } from "./RepeatableAction";
import { PlayerInfoSaver } from "./PlayerInfoSaver";

class Understudy {
    name;
    isConnected = false;
    simulatedPlayer = null;
    createdTick;
    singleActions = [];
    repeatingActions = [];
    #lookTarget;
    playerInfoSaver;

    constructor(name) {
        this.name = name;
        this.createdTick = system.currentTick;
        this.playerInfoSaver = new PlayerInfoSaver(this);
    }

    onConnectedTick() {
        this.playerInfoSaver.onConnectedTick();
        if (!this.getLookTarget()?.isValid)
            this.removeLookTarget();
        if (this.simulatedPlayer !== null)
            this.refreshHeldItem();
        for (const singleAction of this.singleActions)
            singleAction.perform();
        this.singleActions.length = 0;
        for (const repeatingAction of this.repeatingActions)
            repeatingAction.onTick();
    }

    savePlayerInfo() {
        this.playerInfoSaver.save();
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

    addRepeatingAction(repeatingAction) {
        if (this.hasRepeatingAction(repeatingAction.type)) {
            const existingRepeatingAction = this.getRepeatingAction(type) || repeatingAction;
            existingRepeatingAction.setInterval(repeatingAction.intervalTicks);
            return;
        }
        this.repeatingActions.push(repeatingAction);
    }

    getRepeatingAction(type) {
        return this.repeatingActions.find(action => action.type === type);
    }

    hasRepeatingAction(type) {
        if (!type) 
            return this.repeatingActions.length > 0;
        return this.repeatingActions.some(action => action.type === type);
    }

    removeRepeatingAction(type) {
        this.repeatingActions = this.repeatingActions.filter(action => action.type !== type);
    }

    clearRepeatingActions() {
        this.repeatingActions.length = 0;
    }

    singleRepeatableAction(type, afterTicks = void 0) {
        const repeatableAction = new RepeatableAction(this, type);
        if (afterTicks === void 0)
            this.singleActions.push(repeatableAction);
        else
            system.runTimeout(() => this.singleActions.push(repeatableAction), afterTicks);
    }

    repeatingAction(type, intervalTicks = 0) {
        if (this.hasRepeatingAction(type))
            this.removeRepeatingAction(type);
        const repeatingAction = new RepeatableAction(this, type, intervalTicks);
        this.addRepeatingAction(repeatingAction);
    }

    join({ location, dimension, rotation = { x: 0, y: 0 }, gameMode = GameMode.Survival }) {
        const updatedGameMode = portOldGameModeToNewUpdate(gameMode);
        const dimensionLocation = location;
        dimensionLocation.dimension = dimension;
        this.simulatedPlayer = spawnSimulatedPlayer(dimensionLocation, this.name, updatedGameMode);
        this.teleport({ location, rotation, dimension });
        system.run(() => this.playerInfoSaver.load());
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
        const playerInfo = this.playerInfoSaver.get();
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