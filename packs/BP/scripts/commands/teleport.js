import UnderstudyManager from "../classes/UnderstudyManager";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";
import { getLocationInfoFromSource } from "../utils";

export class TeleportCommand extends Command {
    constructor() {
        super({
            name: 'player:teleport',
            description: 'Make a player teleport to you.',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin],
            callback: (origin, ...args) => this.teleportCommand(origin, ...args)
        });
    }

    teleportCommand(origin, playername) {
        const simPlayer = UnderstudyManager.getPlayer(playername);
        if (!simPlayer)
            return { status: CustomCommandStatus.Failure, message: `§cPlayer ${playername} is not online.` };
        simPlayer.tp(getLocationInfoFromSource(origin.getSource()));
    }
}

export const teleportCommand = new TeleportCommand();