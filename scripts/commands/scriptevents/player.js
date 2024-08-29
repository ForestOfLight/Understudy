import { system } from '@minecraft/server';
import extension from 'config';
import ArgumentParser from 'lib/canopy/ArgumentParser';
import { playerCommand } from 'commands/player';

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== 'understudy:player') return;
    const sender = getSource(event);
    if (sender === null)
        return;
    if (!extension.getRuleValue('commandPlayer'))
        return sender.sendMessage('§cThe commandPlayer rule is disabled.');
    const [ name, action, arg1, arg2, arg3 ]= ArgumentParser.parseArgs(event.message);
    const args = { name, action, arg1, arg2, arg3 };
    for (const key in args) {
        if (args[key] === undefined) {
            args[key] = null;
        }
    }
    playerCommand(sender, args);
});

function getSource(event) {
    switch (event.sourceType) {
        case 'Server':
            return null;
        case 'Entity':
            return event.sourceEntity;
        case 'Block':
            return event.sourceBlock;
        case 'NPCDialogue':
            return event.initiator;
        default:
            return null;
    }
}