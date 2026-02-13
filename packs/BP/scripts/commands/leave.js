import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";

export class LeaveCommand extends Command {
    constructor() {
        super({
            name: 'player:leave',
            description: 'Make a player leave the game.',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.leaveCommand(origin, ...args)
        });
    }

    leaveCommand(origin, playername) {
        const simPlayer = Understudies.get(playername);
        if (!simPlayer)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        system.run(() => {
            simPlayer.leave();
            Understudies.remove(simPlayer);
        });
    }
}

export const leaveCommand = new LeaveCommand();