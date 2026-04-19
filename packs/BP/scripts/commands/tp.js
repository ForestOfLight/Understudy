import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { getLocationInfoFromSource } from "../utils";

export class TeleportCommand extends Command {
    constructor() {
        super({
            name: 'simplayer:tp',
            description: 'Make a simplayer teleport to you.',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin],
            callback: (origin, ...args) => this.teleportCommand(origin, ...args)
        });
    }

    teleportCommand(origin, playername) {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        system.run(() => this.#teleportToOrigin(origin, understudy));
        return { status: CustomCommandStatus.Success };
    }

    #teleportToOrigin(origin, understudy) {
        understudy.teleport(getLocationInfoFromSource(origin.getSource()));
    }
}

export const teleportCommand = new TeleportCommand();