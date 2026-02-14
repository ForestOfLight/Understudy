import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, system } from "@minecraft/server";
import { getLocationInfoFromSource } from "../utils";

export class JoinCommand extends Command {
    constructor() {
        super({
            name: 'simplayer:join',
            description: 'Make a new simplayer join at your location.',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin],
            callback: (origin, ...args) => this.joinCommand(origin, ...args)
        });
    }

    joinCommand(origin, playername) {
        if (Understudies.isOnline(playername))
            return { status: CustomCommandStatus.Failure, message: Understudies.getAlreadyOnlineMessage(playername) };
        system.run(() => {
            const understudy = Understudies.create(playername);
            understudy.join(getLocationInfoFromSource(origin.getSource()));
            Understudies.addNametagPrefix(understudy);
        });
    }
}

export const joinCommand = new JoinCommand();