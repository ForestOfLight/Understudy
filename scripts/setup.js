import { world, system } from '@minecraft/server';
import GameTestManager from 'classes/GameTestManager';

const savedGameRules = getGameRules();
let firstJoin = false;

world.afterEvents.playerJoin.subscribe((event) => {
    let runner = system.runInterval(() => {
        const players = world.getPlayers({ name: event.playerName });
        players.forEach(player => {
            if (!firstJoin && player?.isValid()) {
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

const players = world.getAllPlayers();
if (players[0]?.isValid()) {
    onScriptReload();
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
