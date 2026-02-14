import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";

export class LeaveCommand extends Command {
    constructor() {
        super({
            name: 'simplayer:leave',
            description: 'Make a simplayer leave the game.',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.leaveCommand(origin, ...args)
        });
    }

    leaveCommand(origin, playername) {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        system.run(() => {
            understudy.leave();
            Understudies.remove(understudy);
        });
    }
}

export const leaveCommand = new LeaveCommand();