import UnderstudyManager from "../classes/UnderstudyManager";
import extension from "../config";
import { Rule } from '../lib/canopy/CanopyExtension';
import { system, world } from "@minecraft/server";

class SimplayerRejoining extends Rule {
    simplayersToRejoinDP = 'simplayersToRejoin';
    constructor() {
        super({
            identifier: 'simplayerRejoining',
            description: { text: 'Makes online SimPlayers rejoin when you leave and rejoin.' }
        });
        this.subscribeToEvents();
    }

    subscribeToEvents() {
        system.beforeEvents.shutdown.subscribe(this.onShutdown.bind(this));
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

const simplayerRejoining = new SimplayerRejoining();
extension.addRule(simplayerRejoining);

export { simplayerRejoining };