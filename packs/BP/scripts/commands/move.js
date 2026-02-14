import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus, Entity, system } from "@minecraft/server";
import { Vector } from "../lib/Vector";

export const MOVE_OPTIONS = Object.freeze({
    FORWARD: 'forward',
    BACKWARD: 'backward',
    LEFT: 'left',
    RIGHT: 'right',
    BLOCK: 'block',
    ENTITY: 'entity',
    ME: 'me',
    TO: 'to',
    STOP: 'stop'
});

export class MoveCommand extends Command {
    constructor() {
        super({
            name: 'simplayer:move',
            description: 'Make a simplayer move in specified directions.',
            enums: [{ name: 'simplayer:moveOption', values: Object.values(MOVE_OPTIONS) }],
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            optionalParameters: [
                { name: 'simplayer:moveOption', type: CustomCommandParamType.Enum },
                { name: 'location', type: CustomCommandParamType.Location }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.moveCommand(origin, ...args)
        });
    }

    moveCommand(origin, playername, moveOption, location) {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        switch (moveOption) {
            case MOVE_OPTIONS.FORWARD:
            case MOVE_OPTIONS.BACKWARD:
            case MOVE_OPTIONS.LEFT:
            case MOVE_OPTIONS.RIGHT:
                return this.moveRelatively(understudy, moveOption);
            case MOVE_OPTIONS.BLOCK:
                return this.moveToBlock(origin, understudy);
            case MOVE_OPTIONS.ENTITY:
                return this.moveToEntity(origin, understudy);
            case MOVE_OPTIONS.ME:
                return this.moveToMe(origin, understudy);
            case MOVE_OPTIONS.TO:
                return this.moveToLocation(understudy, location);
            case MOVE_OPTIONS.STOP:
                return this.stopMoving(understudy);
            default:
                return { status: CustomCommandStatus.Failure, message: `§cInvalid move option: '${moveOption}'` };
        }
    }

    moveRelatively(understudy, direction) {
        system.run(() => understudy.moveRelative(direction));
    }

    moveToBlock(origin, understudy) {
        const source = origin.getSource();
        if (source instanceof Entity === false)
            return { status: CustomCommandStatus.Failure, message: '§cMoving to a block may only be used by entities.' };
        const block = source.getBlockFromViewDirection({ maxDistance: 16*64 })?.block;
        if (block === void 0)
            return { status: CustomCommandStatus.Failure, message: '§cNo block in view.' };
        system.run(() => understudy.moveLocation(block));
    }

    moveToEntity(origin, understudy) {
        const source = origin.getSource();
        if (source instanceof Entity === false)
            return { status: CustomCommandStatus.Failure, message: '§cMoving to an entity may only be used by entities.' };
        const entity = source.getEntitiesFromViewDirection({ maxDistance: 16*64 })[0]?.entity;
        if (entity === void 0)
            return { status: CustomCommandStatus.Failure, message: '§cNo entity in view.' };
        system.run(() => understudy.moveLocation(entity));
    }

    moveToMe(origin, understudy) {
        if (origin instanceof ServerCommandOrigin)
            return { status: CustomCommandStatus.Failure, message: '§cMoving to yourself cannot be used by the server.' };
        system.run(() => understudy.moveLocation(origin.getSource()));
    }

    moveToLocation(understudy, location) {
        system.run(() => understudy.moveLocation(Vector.from(location)));
    }

    stopMoving(understudy) {
        system.run(() => understudy.stopMoving());
    }
}

export const moveCommand = new MoveCommand();