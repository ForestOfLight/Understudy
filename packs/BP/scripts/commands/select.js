import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";

export class SelectCommand extends Command {
    constructor() {
        super({
            name: 'simplayer:select',
            description: 'Make a simplayer select a hotbar slot.',
            mandatoryParameters: [
                { name: 'playername', type: CustomCommandParamType.String },
                { name: 'slotNumber', type: CustomCommandParamType.Integer }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.selectCommand(origin, ...args)
        });
    }

    selectCommand(origin, playername, slotNumber) {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        if (slotNumber < 0 || slotNumber > 8)
            return { status: CustomCommandStatus.Failure, message: `§cInvalid slot number: ${slotNumber}. Expected a number from 0 to 8.` };
        system.run(() => understudy.selectSlot(slotNumber));
        return { status: CustomCommandStatus.Success };
    }
}

export const selectCommand = new SelectCommand();