import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";

export class ClaimProjectilesCommand extends Command {
    constructor() {
        super({
            name: 'simplayer:claimprojectiles',
            description: 'Make a simplayer the owner of all nearby projectiles.',
            mandatoryParameters: [ { name: 'playername', type: CustomCommandParamType.String } ],
            optionalParameters: [ { name: 'radius', type: CustomCommandParamType.Float } ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.claimprojectilesCommand(origin, ...args)
        });
    }

    claimprojectilesCommand(origin, playername, radius = 25) {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        system.run(() => understudy.claimProjectiles(radius));
        return { status: CustomCommandStatus.Success };
    }
}

export const claimProjectilesCommand = new ClaimProjectilesCommand();