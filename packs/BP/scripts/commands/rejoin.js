import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { getLocationInfoFromSource } from "../utils";

export class RejoinCommand extends Command {
    constructor() {
        super({
            name: 'player:rejoin',
            description: 'Make a player rejoin at its last location.',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.rejoinCommand(origin, ...args)
        });
    }

    rejoinCommand(origin, playername) {
        if (Understudies.isOnline(playername))
            return { status: CustomCommandStatus.Failure, message: Understudies.getAlreadyOnlineMessage(playername) };
        system.run(() => {
            const simPlayer = Understudies.create(playername);
            try {
                simPlayer.rejoin();
            } catch (error) {
                console.warn(`[Understudy] Error while rejoing. Joining instead. Error: ${String(error)}`)
                simPlayer.join(getLocationInfoFromSource(origin.getSource()));
            }
            Understudies.addNametagPrefix(simPlayer);
        });
    }
}

export const rejoinCommand = new RejoinCommand();