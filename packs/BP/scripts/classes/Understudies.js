import Understudy from "./Understudy";
import { system, world } from "@minecraft/server";

class Understudies {
    static understudies = [];

    static onStartup() {
        this.subscribeToEvents();
        this.startProcessingPlayers();
    }

    static subscribeToEvents() {
        world.afterEvents.entityDie.subscribe((event) => {
            if (event.deadEntity.typeId === 'minecraft:player') {
                const understudy = this.get(event.deadEntity?.name);
                if (understudy !== void 0) {
                    understudy.leave();
                    this.remove(understudy);
                }
            }
        });

        world.afterEvents.playerGameModeChange.subscribe((event) => {
            const understudy = this.get(event.player?.name);
            if (understudy !== void 0)
                understudy.savePlayerInfo();
        });
    }

    static startProcessingPlayers() {
        system.runInterval(() => {
            for (const understudy of this.understudies) {
                if (understudy.isConnected)
                    understudy.onConnectedTick();
            }
        });
    }

    static create(name) {
        if (this.isOnline(name))
            throw new Error(`[Understudy] Player with name ${name} already exists.`);
        const player = new Understudy(name);
        this.understudies.push(player);
        return player;
    }

    static addNametagPrefix(player) {
        const prefix = world.getDynamicProperty('nametagPrefix');
        if (prefix)
            player.simulatedPlayer.nameTag = `[${prefix}§r] ${player.name}`;
    }

    static get(name) {
        return this.understudies.find(p => p.name === name);
    }

    static remove(player) {
        const runner = system.runInterval(() => {
            if (player.simulatedPlayer === null) {
                system.clearRun(runner);
                const index = this.understudies.indexOf(player);
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
            for (const player of this.understudies)
                player.simulatedPlayer.nameTag = player.name;
        } else {
            for (const player of this.understudies)
                player.simulatedPlayer.nameTag = `[${prefix}§r] ${player.name}`;
        }
    }

    static isOnline(name) {
        return this.get(name) !== void 0;
    }

    static getNotOnlineMessage(name) {
        return `§cUnderstudy '${name}' is not online.`;
    }

    static getAlreadyOnlineMessage(name) {
        return `§cUnderstudy '${name}' is already online.`;
    }
}

export default Understudies;