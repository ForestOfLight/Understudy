import { UnderstudyNotConnectedError } from "../errors/UnderstudyNotConnectedError";
import Understudy from "./Understudy";
import { system, world } from "@minecraft/server";

class Understudies {
    static understudies = [];

    static onStartup() {
        Understudies.#subscribeToEvents();
        Understudies.#startProcessingPlayers();
    }

    static #subscribeToEvents() {
        world.afterEvents.entityDie.subscribe(Understudies.onEntityDie.bind(Understudies));
        world.afterEvents.playerGameModeChange.subscribe(Understudies.onPlayerGameModeChange.bind(Understudies));
    }

    static #startProcessingPlayers() {
        system.runInterval(() => {
            for (const understudy of Understudies.understudies) {
                if (understudy.isConnected())
                    understudy.onConnectedTick();
            }
        });
    }

    static onEntityDie(event) {
        if (event.deadEntity.typeId !== 'minecraft:player')
            return;
        const understudy = Understudies.get(event.deadEntity?.name);
        if (understudy !== void 0) {
            understudy.leave();
            Understudies.remove(understudy);
        }
    }

    static onPlayerGameModeChange(event) {
        const understudy = Understudies.get(event.player?.name);
        if (understudy !== void 0)
            understudy.savePlayerInfo();
    }

    static create(name) {
        if (Understudies.isOnline(name))
            throw new Error(`[Understudy] Player with name ${name} already exists.`);
        const understudy = new Understudy(name);
        Understudies.understudies.push(understudy);
        return understudy;
    }

    static addNametagPrefix(understudy) {
        const prefix = world.getDynamicProperty('nametagPrefix');
        if (prefix)
            understudy.simulatedPlayer.nameTag = `[${prefix}§r] ${understudy.name}`;
    }

    static get(name) {
        return Understudies.understudies.find(p => p.name === name);
    }

    static remove(understudy) {
        try {
            understudy.leave();
        } catch(error) {
            if (!(error instanceof UnderstudyNotConnectedError))
                throw error;
        }
        const runner = system.runInterval(() => {
            if (!understudy.isConnected()) {
                system.clearRun(runner);
                const index = Understudies.understudies.indexOf(understudy);
                Understudies.understudies.splice(index, 1);
            }
        });
    }

    static removeAll() {
        for (const understudy of [...Understudies.understudies])
            Understudies.remove(understudy);
    }


    static length() {
        return Understudies.understudies.length;
    }

    static setNametagPrefix(prefix) {
        world.setDynamicProperty('nametagPrefix', prefix);
        if (prefix === '') {
            for (const understudy of Understudies.understudies)
                understudy.simulatedPlayer.nameTag = understudy.name;
        } else {
            for (const understudy of Understudies.understudies)
                understudy.simulatedPlayer.nameTag = `[${prefix}§r] ${understudy.name}`;
        }
    }

    static isOnline(name) {
        return Understudies.get(name) !== void 0;
    }

    static getNotOnlineMessage(name) {
        return `§cSimplayer '${name}' is not online.`;
    }

    static getAlreadyOnlineMessage(name) {
        return `§cSimplayer '${name}' is already online.`;
    }
}

export default Understudies;