import UnderstudyManager from "../classes/UnderstudyManager";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, system } from "@minecraft/server";
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
        if (UnderstudyManager.isOnline(playername))
            return { status: CustomCommandStatus.Failure, message: `§cPlayer ${playername} is already online.` };
        system.run(() => {
            const simPlayer = UnderstudyManager.newPlayer(playername);
            UnderstudyManager.spawnPlayer(simPlayer);
            try {
                simPlayer.rejoin();
            } catch (error) {
                console.warn(`[Understudy] Error while rejoing. Joining instead. Error: ${String(error)}`)
                simPlayer.join(getLocationInfoFromSource(origin.getSource()));
            }
        });
    }
}

export const rejoinCommand = new RejoinCommand();