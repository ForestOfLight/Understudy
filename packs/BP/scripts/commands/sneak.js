import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";

export class SneakCommand extends Command {
    constructor() {
        super({
            name: 'simplayer:sneak',
            description: 'Make a simplayer start or stop sneaking.',
            mandatoryParameters: [
                { name: 'playername', type: CustomCommandParamType.String },
                { name: 'shouldSneak', type: CustomCommandParamType.Boolean }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.sprintCommand(origin, ...args)
        });
    }

    sprintCommand(origin, playername, shouldSneak) {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        system.run(() => understudy.sneak(shouldSneak));
    }
}

export const sneakCommand = new SneakCommand();