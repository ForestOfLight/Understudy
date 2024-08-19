import extension from 'config';
import CanopyPlayerManager from 'classes/CanopyPlayerManager';
import * as gametest from '@minecraft/server-gametest';
import { system, world } from '@minecraft/server';
import { subtractVectors, getLookAtLocation, stringifyLocation } from 'utils';

const TEST_MAX_TICKS = 72000;
const TEST_START_POSITION = { x: -22, z: 29 };
const LOADER_ENTITY_ID = 'canopyplayers:loader';

class GameTestManager {
    static testName = 'players';
    static test = null;
    static #startupComplete = false;

    static startPlayers() {
        gametest.register(extension.name, this.testName, (test) => {
            this.test = test;
            this.startPlayerLoop();
        }).maxTicks(TEST_MAX_TICKS).structureName(`${extension.name}:${this.testName}`);
        this.placeGametestStructure();
        this.#startupComplete = true;
    }

    static placeGametestStructure() {
        const dimension = world.getDimension('overworld');
        const onlinePlayer = world.getAllPlayers()[0];
        const loaderEntity = onlinePlayer.dimension.spawnEntity(LOADER_ENTITY_ID, onlinePlayer.location);
        loaderEntity.teleport({ x: TEST_START_POSITION.x, y: 0, z: TEST_START_POSITION.z }, { dimension: dimension });
        system.runTimeout(() => {
            const testStartPosition = dimension.getTopmostBlock(TEST_START_POSITION)?.location
            dimension.runCommandAsync(`fill ${testStartPosition.x + 2} ${testStartPosition.y + 1} ${testStartPosition.z + 2} ${testStartPosition.x - 1} ${testStartPosition.y + 2} ${testStartPosition.z} minecraft:air`);
            dimension.runCommandAsync(`execute positioned ${testStartPosition.x} ${testStartPosition.y} ${testStartPosition.z - 1} run gametest run ${extension.name}:${this.testName}`);
            dimension.getEntities({ type: LOADER_ENTITY_ID }).forEach(entity => entity.remove());
            // If this logic is still making the structures stack, you can try to subtract 1 from the y value of the fill command when testStartPosition.y is 319.
        }, 1);
    }

    static startPlayerLoop() {
        system.runInterval(() => {
            if (!this.#startupComplete) return;
            for (const player of CanopyPlayerManager.players) {
                if (player.nextActions.length > 0) {
                    console.warn(`[CanopyPlayers] Running next actions for ${player.name}: ${JSON.stringify(player.nextActions)}`);
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
            case 'respawn':
                this.respawnAction(player, actionData);
                break;
            case 'tp':
                this.tpAction(player, actionData);
                break;
            case 'look':
                this.targetAction(player, actionData);
                break;
            default:
                player.sendMessage(`§cInvalid action for ${player.name}: ${action}`);
                break;
        }
    }

    static runContinuousActions(player) {
        const actionData = player.continuousActions.shift();
        const type = actionData.type

        switch (type) {}
    }

    static joinAction(player, actionData) {
        player.simulatedPlayer = this.test.spawnSimulatedPlayer(this.getRelativeCoords(actionData.location), player.name, actionData.gameMode);
        this.tpAction(player, actionData);
        player.isConnected = true;
    }

    static leaveAction(player) {
        this.test.removeSimulatedPlayer(player.simulatedPlayer);
        world.sendMessage(`§e${player.name} left the game`);
        player.simulatedPlayer = null;
        player.isConnected = false;
    }

    static respawnAction(player, actionData) {
        player.simulatedPlayer.respawn();
        this.tpAction(player, actionData);
    }

    static tpAction(player, actionData) {
        player.simulatedPlayer.teleport(actionData.location, { rotation: actionData.rotation, dimension: world.getDimension(actionData.dimensionId) });
        player.simulatedPlayer.lookAtLocation(this.getRelativeCoords(getLookAtLocation(actionData.location, actionData.rotation)));
    }

    static targetAction(player, actionData) {
        if (actionData.entityId !== undefined) {
            const target = world.getEntity(actionData.entityId);
            if (target === undefined)
                throw new Error(`[CanopyPlayers] Entity with ID ${actionData.entityId} not found`);
            player.simulatedPlayer.lookAtEntity(target);
        } else if (actionData.blockPos !== undefined) {
            player.simulatedPlayer.lookAtBlock(this.getRelativeCoords(actionData.blockPos));
        } else {
            player.simulatedPlayer.lookAtLocation(this.getRelativeCoords(actionData.location));
        }
    }

    static getRelativeCoords(location) {
        return subtractVectors(location, this.test.worldLocation({ x: 0, y: 0, z: 0 }));
    }
}

export default GameTestManager;