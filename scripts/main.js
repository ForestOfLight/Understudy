import { CanopyExtension, Command, Rule } from 'lib/canopy/CanopyExtension';

const extension = new CanopyExtension({
    name: 'CanopyPlayers',
    description: 'Fakeplayers for Canopy',
    version: '0.0.1',
});

new Rule({
    identifier: 'commandPlayer',
    description: 'Allows the use of the player command.',
})

const playerCmd = new Command({
    name: 'player',
    description: 'Fakeplayer command',
    usage: 'player <name> <action>',
    callback: playerCommand,
    args: [
        { type: 'string', name: 'name' },
        { type: 'string', name: 'action' }
    ],
    // contingentRules: [ 'commandPlayer' ]
})
extension.addCommand(playerCmd);

function playerCommand(sender, args) {
    const { name, action } = args;
    if (name === null || action === null) return playerCmd.sendUsage(sender);
    sender.sendMessage(`§aPlayer command: ${name} ${action}`);
}
