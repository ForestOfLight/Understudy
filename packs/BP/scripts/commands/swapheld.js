import UnderstudyManager from "../classes/UnderstudyManager";
import { Command, PlayerCommandOrigin, EntityCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";

export class SwapHeldCommand extends Command {
    constructor() {
        super({
            name: 'player:swapheld',
            description: 'Swap the held item of a player with your held item.',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, EntityCommandOrigin],
            callback: (origin, ...args) => this.swapHeldCommand(origin, ...args)
        });
    }

    swapHeldCommand(origin, playername) {
        const simPlayer = UnderstudyManager.getPlayer(playername);
        if (!simPlayer)
            return { status: CustomCommandStatus.Failure, message: `§cPlayer ${playername} is not online.` };
        simPlayer.swapHeldItemWithPlayer(origin.getSource());
    }
}

export const swapHeldCommand = new SwapHeldCommand();