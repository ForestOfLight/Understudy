import Understudy from "./Understudy";
import { system, world } from "@minecraft/server";
import { broadcastActionBar } from "../utils";

class UnderstudyManager {
    static players = [];

    static newPlayer(name) {
        if (this.players.find(p => p.name === name)) {
            throw new Error(`[Understudy] Player with name ${name} already exists.`);
        }
        const player = new Understudy(name);
        this.players.push(player);
        return player;
    }

    static spawnPlayer(player) {
        system.runTimeout(() => {
            const prefix = world.getDynamicProperty('nametagPrefix');
            if (prefix) {
                player.simulatedPlayer.nameTag = `[${prefix}§r] ${player.name}`;
            }
        }, 1);
    }

    static removePlayer(player) {
        const runner = system.runInterval(() => {
            if (player.simulatedPlayer === null) {
                system.clearRun(runner);
                const index = this.players.indexOf(player);
                this.players.splice(index, 1);
            }
        });
    }

    static getPlayer(name) {
        return this.players.find(p => p.name === name);
    }

    static getPlayersCount() {
        return this.players.length;
    }

    static setNametagPrefix(prefix) {
        if (prefix === '#none') {
            world.setDynamicProperty('nametagPrefix', '');
            for (const player of this.players) {
                player.simulatedPlayer.nameTag = player.name;
            }
            broadcastActionBar('§7Understudy prefix removed.');
        } else {
            world.setDynamicProperty('nametagPrefix', prefix);
            for (const player of this.players) {
                player.simulatedPlayer.nameTag = `[${prefix}§r] ${player.name}`;
            }
            broadcastActionBar(`§7Understudy prefix set to "§r${prefix}§r§7".`);
        }
    }

    static isOnline(name) {
        return this.players.find(p => p.name === name) !== undefined;
    }
}

export default UnderstudyManager;