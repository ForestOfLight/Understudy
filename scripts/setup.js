import { world, system } from '@minecraft/server';
import GameTestManager from 'classes/GameTestManager';

let firstJoin = false;

world.afterEvents.playerJoin.subscribe((event) => {
    let runner = system.runInterval(() => {
        const players = world.getPlayers({ name: event.playerName });
        players.forEach(player => {
            if (!firstJoin && player?.isValid()) {
                system.clearRun(runner);
                firstJoin = true;
                onValidWorld(player);
            }
        });
    });
});

function onValidWorld(player) {
    GameTestManager.startPlayers();
}

const players = world.getAllPlayers();
if (players[0]?.isValid()) {
    onScriptReload();
}

function onScriptReload() {
    GameTestManager.startPlayers();
}