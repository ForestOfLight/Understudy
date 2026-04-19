import { system, world } from "@minecraft/server";

export class GameRuleCertifier {
    static onGameRuleChange(event) {
        world.setDynamicProperty(`gamerule:${event.rule}`, event.value);
    }

    static fixGameRules() {
        GameRuleCertifier.setGameRules(GameRuleCertifier.getGameRules());
    }

    static setGameRules(newGameRules) {
        system.runTimeout(() => {
            const updatedGameRules = {};
            for (const gamerule in newGameRules) {
                if (world.gameRules[gamerule] !== newGameRules[gamerule]) {
                    world.gameRules[gamerule] = newGameRules[gamerule];
                    updatedGameRules[gamerule] = world.gameRules[gamerule];
                }
            }
            if (Object.keys(updatedGameRules).length > 0)
                console.info(`[Understudy] Gametest messed with gamerules. Rolling back these: ${Object.keys(updatedGameRules).map(rule => `${rule} = ${updatedGameRules[rule]}`).join(', ')}`);
        }, 2);
    }

    static getGameRules() {
        const gameRuleMap = {};
        for (const gamerule in world.gameRules) {
            const value = world.getDynamicProperty(`gamerule:${gamerule}`);
            if (value === undefined) 
                world.setDynamicProperty(`gamerule:${gamerule}`, world.gameRules[gamerule]);
            
            gameRuleMap[gamerule] = value || world.gameRules[gamerule];
        }
        return gameRuleMap;
    }
}

world.afterEvents.gameRuleChange.subscribe(GameRuleCertifier.onGameRuleChange);