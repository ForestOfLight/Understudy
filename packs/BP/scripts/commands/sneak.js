import UnderstudyManager from "../classes/UnderstudyManager";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel } from "@minecraft/server";

export class SneakCommand extends Command {
    constructor() {
        super({
            name: 'player:sneak',
            description: 'Make a player start or stop sneaking.',
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
        if (!UnderstudyManager.isOnline(playername))
            return { status: CustomCommandStatus.Failure, message: `§cPlayer ${playername} is not online.` };
        const simPlayer = UnderstudyManager.getPlayer(playername);
        simPlayer.sneak(shouldSneak);
    }
}

export const sneakCommand = new SneakCommand();