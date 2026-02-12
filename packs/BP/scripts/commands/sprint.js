import UnderstudyManager from "../classes/UnderstudyManager";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";

export class SprintCommand extends Command {
    constructor() {
        super({
            name: 'player:sprint',
            description: 'Make a player start or stop sprinting.',
            mandatoryParameters: [
                { name: 'playername', type: CustomCommandParamType.String },
                { name: 'shouldSprint', type: CustomCommandParamType.Boolean }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.sprintCommand(origin, ...args)
        });
    }

    sprintCommand(origin, playername, shouldSprint) {
        const simPlayer = UnderstudyManager.getPlayer(playername);
        if (!simPlayer)
            return { status: CustomCommandStatus.Failure, message: `§cPlayer ${playername} is not online.` };
        simPlayer.sprint(shouldSprint);
    }
}

export const sprintCommand = new SprintCommand();