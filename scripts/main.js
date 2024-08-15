import { CanopyExtension, Command, Rule } from 'lib/canopy/CanopyExtension';

const extension = new CanopyExtension({
    name: 'CanopyPlayers',
    description: 'Fakeplayers for Canopy',
    version: '0.0.1',
});

extension.addCommand(new Command({
    name: 'test',
    description: 'test command',
    callback: commandTest,
    args: [
        { type: 'string', name: 'message' },
    ]
}));

function commandTest(sender, args) {
    sender.sendMessage(`[CanopyPlayers] test ${sender.name} ${args.message}`);
}