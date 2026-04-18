import Understudy from "./Understudy";
import { system, world } from "@minecraft/server";

class Understudies {
    static understudies = [];

    static onStartup() {
        this.#subscribeToEvents();
        this.#startProcessingPlayers();
    }

    static #subscribeToEvents() {
        world.afterEvents.entityDie.subscribe(Understudies.onEntityDie.bind(this));
        world.afterEvents.playerGameModeChange.subscribe(Understudies.onPlayerGameModeChange.bind(this));
    }

    static #startProcessingPlayers() {
        system.runInterval(() => {
            for (const understudy of this.understudies) {
                if (understudy.isConnected())
                    understudy.onConnectedTick();
            }
        });
    }

    static onEntityDie(event) {
        if (event.deadEntity.typeId !== 'minecraft:player')
            return;
        const understudy = this.get(event.deadEntity?.name);
        if (understudy !== void 0) {
            understudy.leave();
            this.remove(understudy);
        }
    }

    static onPlayerGameModeChange(event) {
        const understudy = this.get(event.player?.name);
        if (understudy !== void 0)
            understudy.savePlayerInfo();
    }

    static create(name) {
        if (this.isOnline(name))
            throw new Error(`[Understudy] Player with name ${name} already exists.`);
        const understudy = new Understudy(name);
        this.understudies.push(understudy);
        return understudy;
    }

    static addNametagPrefix(understudy) {
        const prefix = world.getDynamicProperty('nametagPrefix');
        if (prefix)
            understudy.simulatedPlayer.nameTag = `[${prefix}§r] ${understudy.name}`;
    }

    static get(name) {
        return this.understudies.find(p => p.name === name);
    }

    static remove(understudy) {
        const runner = system.runInterval(() => {
            if (!understudy.isConnected()) {
                system.clearRun(runner);
                const index = this.understudies.indexOf(understudy);
                this.understudies.splice(index, 1);
            }
        });
    }

    static length() {
        return this.understudies.length;
    }

    static setNametagPrefix(prefix) {
        world.setDynamicProperty('nametagPrefix', prefix);
        if (prefix === '') {
            for (const understudy of this.understudies)
                understudy.simulatedPlayer.nameTag = understudy.name;
        } else {
            for (const understudy of this.understudies)
                understudy.simulatedPlayer.nameTag = `[${prefix}§r] ${understudy.name}`;
        }
    }

    static isOnline(name) {
        return this.get(name) !== void 0;
    }

    static getNotOnlineMessage(name) {
        return `§cSimplayer '${name}' is not online.`;
    }

    static getAlreadyOnlineMessage(name) {
        return `§cSimplayer '${name}' is already online.`;
    }
}

export default Understudies;