import { system, world, Block, Entity, Player, EntityComponentTypes } from "@minecraft/server";
import { spawnSimulatedPlayer } from "@minecraft/server-gametest";
import UnderstudyManager from "./UnderstudyManager";
import { getLookAtLocation, swapSlots } from "../utils";
import { simplayerRejoining } from "../rules/simplayerRejoining";

class GameTestManager {
    static #startupComplete = false;

    static startPlayers(savedGameRules) {
        if (this.#startupComplete)
            throw new Error(`[Understudy] GameTestManager has already been started`);
        this.subscribeToEvents();
        this.startPlayerLoop();
        this.setGameRules(savedGameRules);
        simplayerRejoining.onGametestStartup();
        this.#startupComplete = true;
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
                const player = UnderstudyManager.get(event.deadEntity?.name);
                if (player !== undefined) {
                    this.leaveAction(player);
                    UnderstudyManager.remove(player);
                }
            }
        });

        world.afterEvents.playerGameModeChange.subscribe((event) => {
            const player = UnderstudyManager.get(event.player?.name);
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
                if (player.repeatingActions.length > 0) {
                    this.runRepeatingActions(player);
                }
            }
        });
    }

    static runNextActions(player) {
        const actionData = player.nextActions.shift();
        const type = actionData.type;

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
                console.warn(`[Understudy] Invalid action for ${player.name}: ${type}`);
                break;
        }
    }

    static runRepeatingActions(player) {
        for (const actionData of player.repeatingActions) {
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
                    console.warn(`[Understudy] Invalid repeating action for ${player.name}: ${type}`);
                    break;
            }
        }
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
        player.simulatedPlayer.breakBlock(lookingAtLocation);
    }
    
    static dropAction(player) {
        const invContainer = player.getInventory();
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
        const invContainer = player.getInventory();
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
    
    static stopHeadRotation(player) {
        const target = player.getLookTarget();
        if (target === void 0) return;
        player.removeLookTarget();
        if (target instanceof Player)
            this.lookAction(player, { type: 'look', location: target.getHeadLocation() });
        else if (target instanceof Entity || target instanceof Block)
            this.lookAction(player, { type: 'look', location: target.location });
        else
            this.lookAction(player, { type: 'look', location: target });
    }
}

export default GameTestManager;