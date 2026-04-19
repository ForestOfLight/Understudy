import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";

export class PrefixCommand extends Command {
    constructor() {
        super({
            name: 'simplayer:prefix',
            description: "Set a prefix for simplayer nametags. Use '-none' to clear.",
            mandatoryParameters: [{ name: 'prefix', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.prefixCommand(origin, ...args)
        });
    }

    prefixCommand(_origin, prefix) {
        if (prefix === '-none') {
            system.run(() => Understudies.setNametagPrefix(''));
            return { status: CustomCommandStatus.Success, message: '§7Simplayer prefix removed.' };
        } 
            system.run(() => Understudies.setNametagPrefix(prefix));
            return { status: CustomCommandStatus.Success, message: `§7Simplayer prefix set to "§r${prefix}§r§7".` };
        
    }
}

export const prefixCommand = new PrefixCommand();