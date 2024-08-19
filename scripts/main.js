import { Command, Rule } from 'lib/canopy/CanopyExtension';
import extension from 'config';
import GameTestManager from 'classes/GameTestManager';
import CanopyPlayerManager from 'classes/CanopyPlayerManager';
import { stringifyLocation } from 'utils';

const commandPlayerRule = new Rule({
    identifier: 'commandPlayer',
    description: 'Enables player command.',
});
extension.addRule(commandPlayerRule);

const commandPlayerCommand = new Command({
    name: 'player',
    description: `Main ${extension.name} command. (Alias: p)`,
    usage: 'player <name> <action>',
    callback: playerCommand,
    args: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'action' }
    ],
    contingentRules: [ 'commandPlayer' ],
    helpEntries: [ 
        { usage: `player <name> join`, description: `Make a new player join at your location.` },
        { usage: `player <name> rejoin`, description: `Make a player rejoin at its last location.` },
        { usage: `player <name> tp`, description: `Make a player teleport to you.` },
        { usage: `player <name> leave`, description: `Make a player leave the game.` }
    ]
})
extension.addCommand(commandPlayerCommand);

const commandPlayerAliasCommand = new Command({
    name: 'p',
    description: 'Main CanopyPlayer command.',
    usage: 'p <name> <action>',
    callback: playerCommand,
    args: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'action' }
    ],
    contingentRules: [ 'commandPlayer' ],
    helpHidden: true
})
extension.addCommand(commandPlayerAliasCommand);

GameTestManager.startPlayers();

function playerCommand(sender, args) {
    const { name, action } = args;
    if (name === null || action === null) return commandPlayerCommand.sendUsage(sender);

    if (action === 'join')
        joinAction(sender, name);
    else if (action === 'rejoin')
        rejoinAction(sender, name);
    else if (action === 'tp')
        tpAction(sender, name);
    else if (action === 'leave')
        leaveAction(sender, name);
    else
        sender.sendMessage(`§cInvalid action: ${action}`);
}

function joinAction(sender, name) { 
    console.warn(`[CanopyPlayers] ${name} joining at ${stringifyLocation(sender.location)}`);
    CanopyPlayerManager.newPlayer(name);
    CanopyPlayerManager.spawnPlayer(name, sender.location, 'survival');
}

function rejoinAction(sender, name) {
    throw new Error(`[CanopyPlayers] Method not implemented.`);
}

function tpAction(sender, name) {
    throw new Error(`[CanopyPlayers] Method not implemented.`);
}

function leaveAction(sender, name) {
    throw new Error(`[CanopyPlayers] Method not implemented.`);
}
