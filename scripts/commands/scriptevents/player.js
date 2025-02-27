import extension from "../../config";
import { system } from "@minecraft/server";
import { ArgumentParser } from "../../lib/canopy/ArgumentParser";
import { playerCommand } from "../player";

system.afterEvents.scriptEventReceive.subscribe((event) => {
    if (event.id !== 'understudy:player') return;
    const completeCommandString = "player " + event.message;
    const sender = getSource(event);
    if (sender === null)
        return;
    const { args } = ArgumentParser.parseCommandString(completeCommandString);
    for (const key in args) {
        if (args[key] === undefined)
            args[key] = null;
    }
    playerCommand(sender, args);
}, { namespaces: [ 'understudy' ] });

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