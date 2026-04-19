import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";

export class SprintCommand extends Command {
    constructor() {
        super({
            name: 'simplayer:sprint',
            description: 'Make a simplayer start or stop sprinting.',
            mandatoryParameters: [
                { name: 'playername', type: CustomCommandParamType.String },
                { name: 'shouldSprint', type: CustomCommandParamType.Boolean }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.sprintCommand(origin, ...args)
        });
    }

    sprintCommand(_origin, playername, shouldSprint) {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        system.run(() => understudy.sprint(shouldSprint));
        return { status: CustomCommandStatus.Success };
    }
}

export const sprintCommand = new SprintCommand();