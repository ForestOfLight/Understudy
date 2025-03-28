import { world, system } from "@minecraft/server";
import GameTestManager from "./classes/GameTestManager";

let firstJoin = false;
let savedGameRules;
world.afterEvents.worldLoad.subscribe(() => {
    savedGameRules = getGameRules();
    const players = world.getAllPlayers();
    if (players[0]?.isValid) {
        onScriptReload();
    }
});

world.afterEvents.playerJoin.subscribe((event) => {
    let runner = system.runInterval(() => {
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

world.afterEvents.gameRuleChange.subscribe((event) => {
    world.setDynamicProperty(`gamerule:${event.rule}`, event.value);
});

function onValidWorld() {
    GameTestManager.startPlayers(savedGameRules);
}

function onScriptReload() {
    GameTestManager.startPlayers(savedGameRules);
}

function getGameRules() {
    const gameRuleMap = {};
    for (const gamerule in world.gameRules) {
        const value = world.getDynamicProperty(`gamerule:${gamerule}`);
        if (value === undefined) {
            world.setDynamicProperty(`gamerule:${gamerule}`, world.gameRules[gamerule]);
        }
        gameRuleMap[gamerule] = value || world.gameRules[gamerule];
    }
    return gameRuleMap;
}
