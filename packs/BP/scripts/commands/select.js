import UnderstudyManager from "../classes/UnderstudyManager";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";

export class SelectCommand extends Command {
    constructor() {
        super({
            name: 'player:select',
            description: 'Make a player select a hotbar slot.',
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
        const simPlayer = UnderstudyManager.getPlayer(playername);
        if (!simPlayer)
            return { status: CustomCommandStatus.Failure, message: `§cPlayer ${playername} is not online.` };
        if (slotNumber < 0 || slotNumber > 8)
            return { status: CustomCommandStatus.Failure, message: `§cInvalid slot number: ${slotNumber}. Expected a number fom 0 to 8.` };
        system.run(() => simPlayer.selectSlot(slotNumber));
    }
}

export const selectCommand = new SelectCommand();