import extension from "../config";
import { system, world, Block, Entity, Player, EntityComponentTypes } from "@minecraft/server";
import * as gametest from "@minecraft/server-gametest";
import UnderstudyManager from "./UnderstudyManager";
import { getLookAtLocation, swapSlots } from "../utils";
import { Vector } from "../lib/Vector";

const TEST_MAX_TICKS = 630720000; // 1 year
const TEST_START_POSITION = { x: 1000000, z: 1000000 };
const LOADER_ENTITY_ID = 'understudy:loader';

class GameTestManager {
    static testName = 'players';
    static test = null;
    static #startupComplete = false;

    static startPlayers(savedGameRules) {
        if (this.#startupComplete)
            throw new Error(`[Understudy] GameTestManager has already been started`);
        gametest.register(extension.name, this.testName, (test) => {
            this.test = test;
            this.subscribeToEvents();
            this.startPlayerLoop();
        }).maxTicks(TEST_MAX_TICKS).structureName(`${extension.name}:${this.testName}`);
        this.placeGametestStructure();
        this.setGameRules(savedGameRules);
        this.#startupComplete = true;
    }

    static placeGametestStructure() {
        const dimension = world.getDimension('overworld');
        const onlinePlayer = world.getAllPlayers()[0];
        const loaderEntity = onlinePlayer.dimension.spawnEntity(LOADER_ENTITY_ID, { x: onlinePlayer.location.x, y: 100, z: onlinePlayer.location.z });
        loaderEntity.teleport({ x: TEST_START_POSITION.x, y: 0, z: TEST_START_POSITION.z }, { dimension: dimension });
        system.runTimeout(() => {
            const testStartPosition = dimension.getTopmostBlock(TEST_START_POSITION)?.location
            dimension.runCommand(`fill ${testStartPosition.x + 2} ${testStartPosition.y + 1} ${testStartPosition.z + 2} ${testStartPosition.x - 1} ${testStartPosition.y + 2} ${testStartPosition.z} minecraft:air`);
            dimension.runCommand(`execute positioned ${testStartPosition.x} ${testStartPosition.y} ${testStartPosition.z - 1} run gametest run ${extension.name}:${this.testName}`);
            dimension.getEntities({ type: LOADER_ENTITY_ID }).forEach(entity => entity.remove());
            // If this logic is still making the structures stack, you can try to subtract 1 from the y value of the fill command when testStartPosition.y === 319.
        }, 1);
    }

    static setGameRules(newGameRules) {
        system.runTimeout(() => {
            const updatedGameRules = {};
            for (const gamerule in newGameRules) {
                if (world.gameRules[gamerule] !== newGameRules[gamerule]) {
                    world.gameRules[gamerule] = newGameRules[gamerule];
                    updatedGameRules[gamerule] = world.gameRules[gamerule];
                }
            }
            if (Object.keys(updatedGameRules).length > 0)
                console.info(`[Understudy] Gametest messed with gamerules. Rolling back these: ${Object.keys(updatedGameRules).map(rule => `${rule} = ${updatedGameRules[rule]}`).join(', ')}`);
        }, 2);
    }

    static subscribeToEvents() {
        world.afterEvents.entityDie.subscribe((event) => {
            if (event.deadEntity.typeId === 'minecraft:player') {
                const player = UnderstudyManager.getPlayer(event.deadEntity?.name);
                if (player !== undefined) {
                    this.leaveAction(player);
                    UnderstudyManager.removePlayer(player);
                }
            }
        });

        world.afterEvents.playerGameModeChange.subscribe((event) => {
            const player = UnderstudyManager.getPlayer(event.player?.name);
            if (player !== undefined)
                player.savePlayerInfo();
        });
    }

    static startPlayerLoop() {
        system.runInterval(() => {
            if (!this.#startupComplete) return;
            for (const player of UnderstudyManager.players) {
                if (player.isConnected)
                    player.onConnectedTick();
                if (player.nextActions.length > 0) {
                    this.runNextActions(player);
                }
                if (player.continuousActions.length > 0) {
                    this.runContinuousActions(player);
                }
            }
        });
    }

    static runNextActions(player) {
        const actionData = player.nextActions.shift();
        const type = actionData.type;

        switch (type) {
            case 'join':
                this.joinAction(player, actionData);
                break;
            case 'leave':
                this.leaveAction(player, actionData);
                break;
            case 'tp':
                this.tpAction(player, actionData);
                break;
            case 'look':
                this.lookAction(player, actionData);
                break;
            case 'moveLocation':
                this.moveLocationAction(player, actionData);
                break;
            case 'moveRelative':
                this.moveRelativeAction(player, actionData);
                break;
            case 'attack':
                player.simulatedPlayer.attack();
                break;
            case 'interact':
                player.simulatedPlayer.interact();
                break;
            case 'use':
                player.simulatedPlayer.useItemInSlot(player.simulatedPlayer.selectedSlotIndex);
                break;
            case 'build':
                this.buildAction(player);
                break;
            case 'break':
                this.breakAction(player);
                break;
            case 'drop':
                this.dropAction(player);
                break;
            case 'dropstack':
                player.simulatedPlayer.dropSelectedItem();
                break;
            case 'dropall':
                this.dropAllAction(player);
                break;
            case 'jump':
                player.simulatedPlayer.jump();
                break;
            case 'select':
                this.selectSlotAction(player, actionData);
                break;
            case 'sprint':
                player.simulatedPlayer.isSprinting = actionData.shouldSprint;
                break;
            case 'sneak':
                player.simulatedPlayer.isSneaking = actionData.shouldSneak;
                break;
            case 'claimProjectiles':
                this.claimprojectilesAction(player, actionData);
                break;
            case 'stopAll':
                this.stopAllAction(player);
                break;
            case 'printInventory':
                this.printInventory(player, actionData);
                break;
            case 'swapHeldItem':
                this.swapHeldItemWithPlayer(player, actionData);
                break;
            default:
                console.warn(`[Understudy] Invalid action for ${player.name}: ${type}`);
                break;
        }
    }

    static runContinuousActions(player) {
        for (const actionData of player.continuousActions) {
            if (player.simulatedPlayer === null)
                return;
            const type = actionData.type
            if (actionData.interval !== void 0 && system.currentTick % actionData.interval !== 0)
                continue;

            switch (type) {
                case 'attack':
                    player.simulatedPlayer.attack();
                    break;
                case 'interact':
                    player.simulatedPlayer.interact();
                    break;
                case 'use':
                    player.simulatedPlayer.useItemInSlot(player.simulatedPlayer.selectedSlotIndex);
                    break;
                case 'build':
                    this.buildAction(player);
                    break;
                case 'break':
                    this.breakAction(player);
                    break;
                case 'drop':
                    this.dropAction(player);
                    break;
                case 'dropstack':
                    player.simulatedPlayer.dropSelectedItem();
                    break;
                case 'dropall':
                    this.dropAllAction(player);
                    break;
                case 'jump':
                    player.simulatedPlayer.jump();
                    break;
                default:
                    console.warn(`[Understudy] Invalid continuous action for ${player.name}: ${type}`);
                    break;
            }
        }
    }

    static joinAction(player, actionData) {
        player.simulatedPlayer = this.test.spawnSimulatedPlayer(this.getRelativeCoords(actionData.location), player.name, actionData.gameMode);
        this.tpAction(player, actionData);
        system.runTimeout(() => {
            player.loadPlayerInfo();
        });
        player.isConnected = true;
    }

    static leaveAction(player) {
        player.savePlayerInfo();
        this.test.removeSimulatedPlayer(player.simulatedPlayer);
        world.sendMessage(`§e${player.name} left the game`);
        player.removeLookTarget();
        player.simulatedPlayer = null;
        player.isConnected = false;
    }

    static tpAction(player, actionData) {
        player.simulatedPlayer.teleport(actionData.location, { dimension: world.getDimension(actionData.dimensionId) });
        player.simulatedPlayer.lookAtLocation(this.getRelativeCoords(getLookAtLocation(actionData.location, actionData.rotation)));
        player.savePlayerInfo();
    }

    static lookAction(player, actionData) {
        if (actionData.entityId !== undefined) {
            const target = world.getEntity(actionData.entityId);
            if (target === undefined)
                throw new Error(`[Understudy] Entity with ID ${actionData.entityId} not found`);
            player.simulatedPlayer.lookAtEntity(target);
        } else if (actionData.blockPos !== undefined) {
            player.simulatedPlayer.lookAtBlock(this.getRelativeCoords(actionData.blockPos));
        } else {
            player.simulatedPlayer.lookAtLocation(this.getRelativeCoords(actionData.location));
        }
    }

    static moveLocationAction(player, actionData) {
        if (actionData.entityId !== undefined) {
            const target = world.getEntity(actionData.entityId);
            if (target === undefined)
                throw new Error(`[Understudy] Entity with ID ${actionData.entityId} not found`);
            player.simulatedPlayer.navigateToEntity(target);
        } else if (actionData.blockPos !== undefined) {
            player.simulatedPlayer.navigateToBlock(this.getRelativeCoords(actionData.blockPos));
        } else {
            player.simulatedPlayer.navigateToLocation(this.getRelativeCoords(actionData.location));
        }
        system.runTimeout(() => {
            const simPlayerVelocity = player.simulatedPlayer.getVelocity();
            if (simPlayerVelocity.x === 0 && simPlayerVelocity.y === 0 && simPlayerVelocity.z === 0)
                world.sendMessage(`<${player.simulatedPlayer.name}> §7Could not path to location.`);
        }, 1);
    }

    static moveRelativeAction(player, actionData) {
        const direction = actionData.direction;
        if (direction === 'forward') player.simulatedPlayer.moveRelative(0, 1);
        else if (direction === 'backward') player.simulatedPlayer.moveRelative(0, -1);
        else if (direction === 'left') player.simulatedPlayer.moveRelative(1, 0);
        else if (direction === 'right') player.simulatedPlayer.moveRelative(-1, 0);
    }
    
    static buildAction(player) {
        const selectedSlot = player.simulatedPlayer.selectedSlotIndex;
        swapSlots(player.simulatedPlayer, 0, selectedSlot);
        player.simulatedPlayer.startBuild();
        player.simulatedPlayer.stopBuild();
        swapSlots(player.simulatedPlayer, 0, selectedSlot);
        player.simulatedPlayer.selectedSlotIndex = selectedSlot;
    }
    
    static breakAction(player) {
        const lookingAtLocation = player.simulatedPlayer.getBlockFromViewDirection({ maxDistance: 6 })?.block?.location;
        if (lookingAtLocation === undefined)
            return;
        player.simulatedPlayer.breakBlock(this.getRelativeCoords(lookingAtLocation));
    }
    
    static dropAction(player) {
        const invContainer = player.simulatedPlayer.getComponent('minecraft:inventory')?.container;
        if (!invContainer)
            return;
        const itemStack = invContainer.getItem(player.simulatedPlayer.selectedSlotIndex);
        if (itemStack === undefined)
            return;
        const savedAmount = itemStack.amount;
        if (savedAmount > 1) {
            itemStack.amount = 1;
            invContainer.setItem(player.simulatedPlayer.selectedSlotIndex, itemStack);
            player.simulatedPlayer.dropSelectedItem();
            itemStack.amount = savedAmount - 1;
            invContainer.setItem(player.simulatedPlayer.selectedSlotIndex, itemStack);
        } else {
            player.simulatedPlayer.dropSelectedItem();
        }
    }
    
    static dropAllAction(player) {
        const invContainer = player.simulatedPlayer.getComponent(EntityComponentTypes.Inventory)?.container;
        if (!invContainer)
            return;
        const selectedSlot = player.simulatedPlayer.selectedSlotIndex;
        player.simulatedPlayer.selectedSlotIndex = 0;
        player.simulatedPlayer.dropSelectedItem();
        for (let i = 0; i < invContainer.size; i++) {
            invContainer.moveItem(i, player.simulatedPlayer.selectedSlotIndex, invContainer);
            player.simulatedPlayer.dropSelectedItem();
        }
        player.simulatedPlayer.selectedSlotIndex = selectedSlot;
    }
    
    static selectSlotAction(player, actionData) {
        player.simulatedPlayer.selectedSlotIndex = actionData.slot;
        player.savePlayerInfo();
    }
    
    static claimprojectilesAction(player, actionData) {
        const projectiles = this.getProjectilesInRange(player.simulatedPlayer, actionData.radius);
        if (projectiles.length === 0)
            return world.sendMessage(`<${player.simulatedPlayer.name}> §7No projectiles found within ${actionData.radius} blocks.`);
        const numChanged = this.changeProjectileOwner(projectiles, player.simulatedPlayer);
        world.sendMessage(`<${player.simulatedPlayer.name}> §7Successfully became the owner of ${numChanged} projectiles.`);
        player.savePlayerInfo();
    }
    
    static getProjectilesInRange(player, radius) {
        const radiusProjectiles = new Array();
        const radiusEntities = player.dimension.getEntities({ location: player.location, maxDistance: radius });
        for (const entity of radiusEntities) {
            if (entity?.hasComponent('minecraft:projectile'))
                radiusProjectiles.push(entity);
        }
        return radiusProjectiles;
    }
    
    static changeProjectileOwner(projectiles, owner) {
        for (const projectile of projectiles) {
            if (!projectile)
                continue;
            projectile.getComponent('minecraft:projectile').owner = owner;
        }
        return projectiles.length;
    }
    
    static stopAllAction(player) {
        player.simulatedPlayer.stopMoving();
        player.simulatedPlayer.stopBuild();
        player.simulatedPlayer.stopInteracting();
        player.simulatedPlayer.stopBreakingBlock();
        player.simulatedPlayer.stopUsingItem();
        player.simulatedPlayer.stopSwimming();
        player.simulatedPlayer.stopGliding();
        player.simulatedPlayer.stopUsingItem();
        player.simulatedPlayer.isSprinting = false;
        player.simulatedPlayer.isSneaking = false;
        player.clearContinuousActions();
        this.stopHeadRotation(player);
    }
    
    static stopHeadRotation(player) {
        const target = player.getLookTarget();
        if (target === null) return;
        player.removeLookTarget();
        if (target instanceof Player)
            this.lookAction(player, { type: 'look', location: target.getHeadLocation() });
        else if (target instanceof Entity || target instanceof Block)
            this.lookAction(player, { type: 'look', location: target.location });
        else
            this.lookAction(player, { type: 'look', location: target });
    }

    static printInventory(player, actionData) {
        const invContainer = player.simulatedPlayer.getComponent('minecraft:inventory')?.container;
        const recipientPlayer = actionData.recipientPlayer;
        if (!invContainer) {
            recipientPlayer.sendMessage(`§cNo inventory found`);
            return;
        }
        
        if (invContainer.size === invContainer.emptySlotsCount)
            return recipientPlayer.sendMessage(`§7${player.name}'s inventory is empty.`);
            
        let message = { rawtext: [ { text: `${player.name}'s inventory:` } ] };
        for (let i = 0; i < invContainer.size; i++) {
            const itemStack = invContainer.getItem(i);
            if (itemStack !== undefined) {
                message.rawtext.push({ rawtext: [
                    { text: `\n§7- ${i < 10 ? '§a' : ''}${i}§7: ` },
                    { translate: itemStack.localizationKey },
                    { text: ` x${itemStack.amount}` }
                ]});
            }
        }
        recipientPlayer.sendMessage(message);
    }

    static swapHeldItemWithPlayer(player, actionData) {
        const targetPlayer = actionData.player;
        const playerInvContainer = player.simulatedPlayer.getComponent('minecraft:inventory')?.container;
        const targetInvContainer = targetPlayer.getComponent('minecraft:inventory')?.container;
        try {
            playerInvContainer.swapItems(player.simulatedPlayer.selectedSlotIndex, targetPlayer.selectedSlotIndex, targetInvContainer);
        } catch(error) {
            targetPlayer.sendMessage(`§cError while swapping items: ${error.name}`);
            console.warn(error);
        }
        player.refreshHeldItem();
        player.savePlayerInfo();
    }

    static getRelativeCoords(location) {
        location = new Vector(location.x, location.y, location.z);
        const testLocation = this.test.worldLocation(new Vector());
        return location.subtract(testLocation);
    }
}

export default GameTestManager;