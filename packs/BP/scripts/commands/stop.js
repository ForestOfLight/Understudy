import UnderstudyManager from "../classes/UnderstudyManager";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";

export class StopCommand extends Command {
    constructor() {
        super({
            name: 'player:stop',
            description: 'Make a player stop doing all actions.',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.stopCommand(origin, ...args)
        });
    }

    stopCommand(origin, playername) {
        const understudy = UnderstudyManager.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: `§cPlayer ${playername} is not online.` };
        system.run(() => understudy.stopAll());
    }
}

export const stopCommand = new StopCommand();