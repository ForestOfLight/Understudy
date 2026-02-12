import UnderstudyManager from "../classes/UnderstudyManager";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";

export class ClaimProjectilesCommand extends Command {
    constructor() {
        super({
            name: 'player:claimprojectiles',
            description: 'Make a player the owner of all nearby projectiles.',
            mandatoryParameters: [ { name: 'playername', type: CustomCommandParamType.String } ],
            optionalParameters: [ { name: 'radius', type: CustomCommandParamType.Float } ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.claimprojectilesCommand(origin, ...args)
        });
    }

    claimprojectilesCommand(origin, playername, radius = 25) {
        const simPlayer = UnderstudyManager.getPlayer(playername);
        if (!simPlayer)
            return { status: CustomCommandStatus.Failure, message: `§cPlayer ${playername} is not online.` };
        simPlayer.claimProjectiles(radius);
    }
}

export const claimProjectilesCommand = new ClaimProjectilesCommand();