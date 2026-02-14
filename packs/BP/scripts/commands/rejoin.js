import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { getLocationInfoFromSource } from "../utils";

export class RejoinCommand extends Command {
    constructor() {
        super({
            name: 'simplayer:rejoin',
            description: 'Make a simplayer rejoin at its last location.',
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
            const understudy = Understudies.create(playername);
            try {
                understudy.rejoin();
            } catch (error) {
                console.warn(`[Understudy] Error while rejoing. Joining instead. Error: ${String(error)}`)
                understudy.join(getLocationInfoFromSource(origin.getSource()));
            }
            Understudies.addNametagPrefix(understudy);
        });
    }
}

export const rejoinCommand = new RejoinCommand();