import CanopyPlayer from 'classes/CanopyPlayer';
import { system } from '@minecraft/server';

class CanopyPlayerManager {
    static players = [];
    static #nametagPrefix = false;

    static newPlayer(name) {
        if (this.players.find(p => p.name === name)) {
            throw new Error(`[CanopyPlayers] Player with name ${name} already exists.`);
        }
        const player = new CanopyPlayer(name);
        this.players.push(player);
        return player;
    }

    static spawnPlayer(player, location, rotation, gameMode) {
        player.join(location, rotation, gameMode);
        if (this.#nametagPrefix) {
            player.simulatedPlayer.nameTag = `[${this.#nametagPrefix}§r] ${player.name}`;
        }
    }

    static removePlayer(player) {
        player.leave();
        const runner = system.runInterval(() => {
            if (player.simulatedPlayer === null) {
                system.clearRun(runner);
                const index = this.players.indexOf(player);
                this.players.splice(index, 1);
            }
        });
    }

    static lookAt(player, location) {
        player.look(location);
    }

    static getPlayer(name) {
        return this.players.find(p => p.name === name);
    }

    static getPlayersCount() {
        return this.players.length;
    }

    static setNametagPrefix(prefix) {
        if (prefix === false) {
            this.#nametagPrefix = false;
            for (const player of this.players) {
                player.simulatedPlayer.nameTag = player.name;
            }
        } else {
            this.#nametagPrefix = prefix;
            for (const player of this.players) {
                player.simulatedPlayer.nameTag = `[${this.#nametagPrefix}§r] ${player.name}`;
            }
        }
    }

    static isOnline(name) {
        return this.players.find(p => p.name === name) !== undefined;
    }
}

export default CanopyPlayerManager;