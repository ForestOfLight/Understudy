import CanopyPlayer from 'classes/CanopyPlayer';

class CanopyPlayerManager {
    #nametagPrefix;

    constructor(prefix = false) {
        this.players = [];
        this.#nametagPrefix = prefix;
    }

    newPlayer(name) {
        const player = new CanopyPlayer(name);
        this.players.push(player);
        return player;
    }

    spawnPlayer(player, location, gameMode) {
        player.join(location, gameMode);
        if (this.#nametagPrefix) {
            player.simulatedPlayer.nameTag = `[${this.nametagPrefix}§r] ${player.name}`;
        }
    }

    removePlayer(player) {
        player.leave();
        this.players = this.players.filter(p => p !== player);
    }

    getPlayerById(id) {
        return this.players.find(p => p.id === id);
    }

    getPlayersCount() {
        return this.players.length;
    }

    setNametagPrefix(prefix) {
        this.#nametagPrefix = prefix;
        for (const player of this.players) {
            player.simulatedPlayer.nameTag = `[${this.nametagPrefix}§r] ${player.name}`;
        }
    }
}

export default CanopyPlayerManager;