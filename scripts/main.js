import { CanopyExtension, Command, Rule } from 'lib/canopy/CanopyExtension';

const extension = new CanopyExtension({
    name: 'CanopyPlayers',
    description: 'Fakeplayers for Canopy',
    version: '0.0.1',
});

const commandPlayerRule = new Rule({
    identifier: 'commandPlayer',
    description: 'Enables player command.',
});
extension.addRule(commandPlayerRule);

const commandPlayerCommand = new Command({
    name: 'player',
    description: 'Main CanopyPlayer command. (Alias: p)',
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

function playerCommand(sender, args) {
    const { name, action } = args;
    if (name === null || action === null) return commandPlayerCommand.sendUsage(sender);
    sender.sendMessage(`§a${sender.name} command: ${name} ${action}`);
}
