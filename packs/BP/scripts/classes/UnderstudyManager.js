import Understudy from "./Understudy";
import { system, world } from "@minecraft/server";

class UnderstudyManager {
    static players = [];

    static create(name) {
        if (this.players.find(p => p.name === name)) {
            throw new Error(`[Understudy] Player with name ${name} already exists.`);
        }
        const player = new Understudy(name);
        this.players.push(player);
        return player;
    }

    static addNametagPrefix(player) {
        const prefix = world.getDynamicProperty('nametagPrefix');
        if (prefix)
            player.simulatedPlayer.nameTag = `[${prefix}§r] ${player.name}`;
    }

    static get(name) {
        return this.players.find(p => p.name === name);
    }

    static remove(player) {
        const runner = system.runInterval(() => {
            if (player.simulatedPlayer === null) {
                system.clearRun(runner);
                const index = this.players.indexOf(player);
                this.players.splice(index, 1);
            }
        });
    }

    static length() {
        return this.players.length;
    }

    static setNametagPrefix(prefix) {
        world.setDynamicProperty('nametagPrefix', prefix);
        if (prefix === '') {
            for (const player of this.players)
                player.simulatedPlayer.nameTag = player.name;
        } else {
            for (const player of this.players)
                player.simulatedPlayer.nameTag = `[${prefix}§r] ${player.name}`;
        }
    }

    static isOnline(name) {
        return this.get(name) !== void 0;
    }
}

export default UnderstudyManager;