import { world, system } from "@minecraft/server";
import { GameRuleCertifier } from "./classes/GameRuleCertifier";
import Understudies from "./classes/Understudies";
import { simplayerRejoining } from "./rules/simplayerRejoining";

let firstJoin = false;
world.afterEvents.worldLoad.subscribe(() => {
    GameRuleCertifier.fixGameRules();
    const players = world.getAllPlayers();
    if (players[0]?.isValid)
        onScriptReload();
});

world.afterEvents.playerJoin.subscribe((event) => {
    const runner = system.runInterval(() => {
        const players = world.getPlayers({ name: event.playerName });
        if (world.getAllPlayers().length !== players.length) {
            system.clearRun(runner);
            return;
        }
        players.forEach(player => {
            if (!firstJoin && player?.isValid) {
                system.clearRun(runner);
                firstJoin = true;
                onValidWorld();
            }
        });
    });
});

function onValidWorld() {
    Understudies.onStartup();
    simplayerRejoining.onStartup();
}

function onScriptReload() {
    Understudies.onStartup();
    simplayerRejoining.onStartup();
}
