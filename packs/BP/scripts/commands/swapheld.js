import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, EntityCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";

export class SwapHeldCommand extends Command {
    constructor() {
        super({
            name: 'simplayer:swapheld',
            description: 'Swap the held item of a simplayer with your held item.',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, EntityCommandOrigin],
            callback: (origin, ...args) => this.swapHeldCommand(origin, ...args)
        });
    }

    swapHeldCommand(origin, playername) {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        system.run(() => understudy.swapHeldItemWithPlayer(origin.getSource()));
        return { status: CustomCommandStatus.Success };
    }
}

export const swapHeldCommand = new SwapHeldCommand();