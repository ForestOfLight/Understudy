import UnderstudyManager from "../classes/UnderstudyManager";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, system } from "@minecraft/server";

export class LeaveCommand extends Command {
    constructor() {
        super({
            name: 'player:leave',
            description: 'Make a player leave the game.',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.leaveCommand(origin, ...args)
        });
    }

    leaveCommand(origin, playername) {
        if (!UnderstudyManager.isOnline(playername)) {
            origin.sendMessage(`§cPlayer ${playername} is not online.`);
            return;
        }
        system.run(() => {
            const simPlayer = UnderstudyManager.getPlayer(playername);
            simPlayer.leave();
            UnderstudyManager.removePlayer(simPlayer);
        });
    }
}

export const leaveCommand = new LeaveCommand();