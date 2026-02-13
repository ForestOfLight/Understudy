import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, Entity, system } from "@minecraft/server";
import { Vector } from "../lib/Vector";

const LOOK_OPTIONS = Object.freeze({
    UP: 'up',
    DOWN: 'down',
    NORTH: 'north',
    SOUTH: 'south',
    EAST: 'east',
    WEST: 'west',
    BLOCK: 'block',
    ENTITY: 'entity',
    ME: 'me',
    AT: 'at',
    STOP: 'stop'
});

export class LookCommand extends Command {
    constructor() {
        super({
            name: 'player:look',
            description: 'Make a player look in specified directions.',
            enums: [{ name: 'player:lookOption', values: Object.values(LOOK_OPTIONS) }],
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            optionalParameters: [
                { name: 'player:lookOption', type: CustomCommandParamType.Enum },
                { name: 'location', type: CustomCommandParamType.Location }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.lookCommand(origin, ...args)
        });
    }

    lookCommand(origin, playername, lookOption, location) {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        switch (lookOption) {
            case LOOK_OPTIONS.UP:
            case LOOK_OPTIONS.DOWN:
            case LOOK_OPTIONS.NORTH:
            case LOOK_OPTIONS.SOUTH:
            case LOOK_OPTIONS.EAST:
            case LOOK_OPTIONS.WEST:
                this.lookAtCardinal(understudy, lookOption);
                break;
            case LOOK_OPTIONS.BLOCK:
                this.lookAtBlock(origin, understudy);
                break;
            case LOOK_OPTIONS.ENTITY:
                this.lookAtEntity(origin, understudy);
                break;
            case LOOK_OPTIONS.ME:
                this.lookAtMe(origin, understudy);
                break;
            case LOOK_OPTIONS.AT:
                this.lookAtLocation(understudy, location);
                break;
            case LOOK_OPTIONS.STOP:
                this.stopLooking(understudy);
                break;
            default:
                return { status: CustomCommandStatus.Failure, message: `§cInvalid look option: '${lookOption}'` };
        }
    }

    lookAtCardinal(simPlayer, direction) {
        const directions = {
            'up': { x: -90, y: 0 },
            'down': { x: 90, y: 0 },
            'north': { x: 0, y: 180 },
            'south': { x: 0, y: 0 },
            'east': { x: 0, y: -90 },
            'west': { x: 0, y: 90 }
        };
        system.run(() => simPlayer.look(directions[direction]));
    }

    lookAtBlock(origin, simPlayer) {
        const source = origin.getSource();
        if (source instanceof Entity === false)
            return { status: CustomCommandStatus.Failure, message: '§cBlock targeting may only be used by entities.' };
        const block = source.getBlockFromViewDirection({ maxDistance: 16*64 })?.block;
        if (block === void 0)
            return { status: CustomCommandStatus.Failure, message: '§cNo block in view.' };
        system.run(() => simPlayer.look(block));
    }

    lookAtEntity(origin, simPlayer) {
        const source = origin.getSource();
        if (source instanceof Entity === false)
            return { status: CustomCommandStatus.Failure, message: '§cEntity targeting may only be used by entities.' };
        const entity = source.getEntitiesFromViewDirection({ maxDistance: 16*64 })[0]?.entity;
        if (entity === void 0)
            return { status: CustomCommandStatus.Failure, message: '§cNo entity in view.' };
        system.run(() => simPlayer.look(entity));
    }

    lookAtMe(origin, simPlayer) {
        if (origin instanceof ServerCommandOrigin)
            return { status: CustomCommandStatus.Failure, message: '§cSelf-targeting cannot be used by the server.' };
        system.run(() => simPlayer.look(origin.getSource()));
    }

    lookAtLocation(simPlayer, location) {
        system.run(() => simPlayer.look(Vector.from(location)));
    }

    stopLooking(simPlayer) {
        system.run(() => simPlayer.stopLooking());
    }
}

export const lookCommand = new LookCommand();