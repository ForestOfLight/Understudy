import extension from 'config';
import { CanopyPlayerManager } from 'classes/CanopyPlayerManager';
import * as gametest from '@minecraft/server-gametest';
import { system, world } from '@minecraft/server';

class GameTestManager {
    testName = 'players';
    test = null;

    static startPlayers() {
        gametest.register(extension.name, this.testName, (test) => {
            this.test = test;
            this.startPlayerLoop();
        }).structureName(`${extension.name}:${this.testName}`);
        world.getDimension('overworld').runCommandAsync(`execute positioned 0 100 0 run gametest run ${extension.name}:${this.testName}`);
        console.warn(`[CanopyPlayers] Started ${extension.name}:${this.testName} test.`);
    }

    static startPlayerLoop() {
        system.runInterval(() => {
            for (const player of CanopyPlayerManager.players) {
                if (player.nextAction.length > 0) {
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
        player.simulatedPlayer = this.test.spawnSimulatedPlayer(actionData.location, player.name, actionData.gameMode);
        player.isConnected = true;
    }

    static leaveAction(player) {
        player.simulatedPlayer.disconnect();
        this.test.removeSimulatedPlayer(player.simulatedPlayer);
        player.isConnected = false;
    }

    static tpAction(player, actionData) {
        player.simulatedPlayer.teleport(actionData.location, actionData.rotation);
    }
}

export default GameTestManager;