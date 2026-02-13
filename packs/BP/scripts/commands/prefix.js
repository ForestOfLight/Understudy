import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";

export class PrefixCommand extends Command {
    constructor() {
        super({
            name: 'player:prefix',
            description: "Set a for prefix player nametags. Use '-none' to clear.",
            mandatoryParameters: [{ name: 'prefix', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.sprintCommand(origin, ...args)
        });
    }

    sprintCommand(origin, prefix) {
        if (prefix === '-none') {
            system.run(() => Understudies.setNametagPrefix(''));
            return { status: CustomCommandStatus.Success, message: '§7Understudy prefix removed.' };
        } else {
            system.run(() => Understudies.setNametagPrefix(prefix));
            return { status: CustomCommandStatus.Success, message: `§7Understudy prefix set to "§r${prefix}§r§7".` };
        }
    }
}

export const prefixCommand = new PrefixCommand();