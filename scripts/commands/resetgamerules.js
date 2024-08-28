import { Command } from 'lib/canopy/CanopyExtension';
import extension from 'config';
import { world } from '@minecraft/server';

const commandResetGamerulesCommand = new Command({
    name: 'resetgamerules',
    description: 'Resets randomtickspeed, dodaylightcycle, & domobspawning to their default values.',
    usage: `resetgamerules`,
    callback: resetGameRulesCommand,
    contingentRules: ['commandPlayer'],
});
extension.addCommand(commandResetGamerulesCommand);

function resetGameRulesCommand(sender) {
    if (world.gameRules.randomTickSpeed === 0)
        sender.runCommandAsync('gamerule randomtickspeed 1');
    if (world.gameRules.doDayLightCycle === false)
        sender.runCommandAsync('gamerule dodaylightcycle true');
    if (world.gameRules.doMobSpawning === false)
        sender.runCommandAsync('gamerule domobspawning true');
}