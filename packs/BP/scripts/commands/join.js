import UnderstudyManager from "../classes/UnderstudyManager";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, system } from "@minecraft/server";
import { getLocationInfoFromSource } from "../utils";

export class JoinCommand extends Command {
    constructor() {
        super({
            name: 'player:join',
            description: 'Make a new player join at your location.',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin],
            callback: (origin, ...args) => this.joinCommand(origin, ...args)
        });
    }

    joinCommand(origin, playername) {
        if (UnderstudyManager.isOnline(playername))
            return { status: CustomCommandStatus.Failure, message: `§cPlayer ${playername} is already online.` };
        system.run(() => {
            const simPlayer = UnderstudyManager.newPlayer(playername);
            simPlayer.join(getLocationInfoFromSource(origin.getSource()));
            UnderstudyManager.spawnPlayer(simPlayer);
        });
    }
}

export const joinCommand = new JoinCommand();