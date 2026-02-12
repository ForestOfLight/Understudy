import UnderstudyManager from "../classes/UnderstudyManager";
import { BooleanRule } from '../lib/canopy/CanopyExtension';
import { system, world } from "@minecraft/server";

class SimplayerRejoining extends BooleanRule {
    simplayersToRejoinDP = 'simplayersToRejoin';

    constructor() {
        super({
            identifier: 'simplayerRejoining',
            description: 'Makes online SimPlayers rejoin when you leave and rejoin.',
            defaultValue: false,
            onEnableCallback: () => this.subscribeToEvent(),
            onDisableCallback: () => this.unsubscribeFromEvent()
        });
        this.onShutdownBound = this.onShutdown.bind(this);
    }

    subscribeToEvent() {
        system.beforeEvents.shutdown.subscribe(this.onShutdownBound);
    }

    unsubscribeFromEvent() {
        system.beforeEvents.shutdown.unsubscribe(this.onShutdownBound);
    }

    onGametestStartup() {
        if (!this.getValue())
            return;
        const simplayersToRejoinStr = world.getDynamicProperty(this.simplayersToRejoinDP);
        let playersToRejoin;
        try {
            const parsedPlayers = JSON.parse(simplayersToRejoinStr);
            if (Array.isArray(parsedPlayers))
                playersToRejoin = parsedPlayers;
        } catch (error) {
            console.error(`[SimplayerRejoining] Error parsing simplayersToRejoin:`, error);
        }
        if (playersToRejoin) {
            playersToRejoin.forEach(name => {
                const simPlayer = UnderstudyManager.newPlayer(name);
                system.runTimeout(() => {
                    UnderstudyManager.spawnPlayer(simPlayer);
                }, 5);
                try {
                    simPlayer.rejoin();
                } catch (error) {
                    console.error(`[SimplayerRejoining] Error rejoining player ${name}:`, error);
                }
            });
        }
    }

    onShutdown() {
        if (this.getValue())
            world.setDynamicProperty(this.simplayersToRejoinDP, JSON.stringify(UnderstudyManager.players.map(player => player.name)));
        else
            world.setDynamicProperty(this.simplayersToRejoinDP, JSON.stringify([]));
    }
}

export const simplayerRejoining = new SimplayerRejoining();