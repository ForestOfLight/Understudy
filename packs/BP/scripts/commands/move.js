import UnderstudyManager from "../classes/UnderstudyManager";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, Entity, system } from "@minecraft/server";
import { Vector } from "../lib/Vector";

const MOVE_ACTIONS = Object.freeze({
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
            name: 'player:move',
            description: 'Make a player move in specified directions.',
            enums: [{ name: 'player:moveActions', values: Object.values(MOVE_ACTIONS) }],
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            optionalParameters: [
                { name: 'player:moveActions', type: CustomCommandParamType.Enum },
                { name: 'location', type: CustomCommandParamType.Location }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.moveCommand(origin, ...args)
        });
    }

    moveCommand(origin, playername, moveAction, location) {
        if (!UnderstudyManager.isOnline(playername)) {
            origin.sendMessage(`§cPlayer ${playername} is not online.`);
            return;
        }
        const simPlayer = UnderstudyManager.getPlayer(playername);
        switch (moveAction) {
            case MOVE_ACTIONS.FORWARD:
            case MOVE_ACTIONS.BACKWARD:
            case MOVE_ACTIONS.LEFT:
            case MOVE_ACTIONS.RIGHT:
                this.moveRelatively(simPlayer, moveAction);
                break;
            case MOVE_ACTIONS.BLOCK:
                this.moveToBlock(origin, simPlayer);
                break;
            case MOVE_ACTIONS.ENTITY:
                this.moveToEntity(origin, simPlayer);
                break;
            case MOVE_ACTIONS.ME:
                this.moveToMe(origin, simPlayer);
                break;
            case MOVE_ACTIONS.TO:
                this.moveToLocation(simPlayer, location);
                break;
            case MOVE_ACTIONS.STOP:
                this.stopMoving(simPlayer);
                break;
            default:
                throw new Error(`§cInvalid move action: ${moveAction}`);
        }
    }

    moveRelatively(simPlayer, direction) {
        simPlayer.moveRelative(direction);
    }

    moveToBlock(origin, simPlayer) {
        const source = origin.getSource();
        if (source instanceof Entity === false)
            throw new Error('§cMoving to a block may only be used by entities.');
        const block = source.getBlockFromViewDirection({ maxDistance: 16*64 })?.block;
        if (block === void 0)
            throw new Error(`§cNo block in view.`);
        simPlayer.moveLocation(block);
    }

    moveToEntity(origin, simPlayer) {
        const source = origin.getSource();
        if (source instanceof Entity === false)
            throw new Error('§cMoving to an entity may only be used by entities.');
        const entity = source.getEntitiesFromViewDirection({ maxDistance: 16*64 })[0]?.entity;
        if (entity === void 0)
            throw new Error(`§cNo entity in view.`);
        simPlayer.moveLocation(entity);
    }

    moveToMe(origin, simPlayer) {
        if (origin instanceof ServerCommandOrigin)
            throw new Error('§cMoving to yourself cannot be used by the server.');
        simPlayer.moveLocation(origin.getSource());
    }

    moveToLocation(simPlayer, location) {
        simPlayer.moveLocation(Vector.from(location));
    }

    stopMoving(simPlayer) {
        system.run(() => simPlayer.stopMoving());
    }
}

export const moveCommand = new MoveCommand();