import UnderstudyManager from "../classes/UnderstudyManager";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, system, Entity } from "@minecraft/server";
import { Vector } from "../lib/Vector";

const LOOK_ACTIONS = Object.freeze({
    UP: 'up',
    DOWN: 'down',
    NORTH: 'north',
    SOUTH: 'south',
    EAST: 'east',
    WEST: 'west',
    BLOCK: 'block',
    ENTITY: 'entity',
    ME: 'me',
    AT: 'at'
});

export class LookCommand extends Command {
    constructor() {
        super({
            name: 'player:look',
            description: 'Make a player look in specified directions.',
            enums: [{ name: 'player:lookActions', values: Object.values(LOOK_ACTIONS) }],
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            optionalParameters: [
                { name: 'player:lookActions', type: CustomCommandParamType.Enum },
                { name: 'location', type: CustomCommandParamType.Location }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.lookCommand(origin, ...args)
        });
    }

    lookCommand(origin, playername, lookAction, location) {
        if (!UnderstudyManager.isOnline(playername)) {
            origin.sendMessage(`§cPlayer ${playername} is not online.`);
            return;
        }
        const simPlayer = UnderstudyManager.getPlayer(playername);
        switch (lookAction) {
            case LOOK_ACTIONS.UP:
            case LOOK_ACTIONS.DOWN:
            case LOOK_ACTIONS.NORTH:
            case LOOK_ACTIONS.SOUTH:
            case LOOK_ACTIONS.EAST:
            case LOOK_ACTIONS.WEST:
                this.lookAtCardinal(simPlayer, lookAction);
                break;
            case LOOK_ACTIONS.BLOCK:
                this.lookAtBlock(origin, simPlayer);
                break;
            case LOOK_ACTIONS.ENTITY:
                this.lookAtEntity(origin, simPlayer);
                break;
            case LOOK_ACTIONS.ME:
                this.lookAtMe(origin, simPlayer);
                break;
            case LOOK_ACTIONS.AT:
                this.lookAtLocation(simPlayer, location);
                break;
            default:
                throw new Error('§cInvalid look action: ' + lookAction);
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
        simPlayer.lookLocation(directions[direction]);
    }

    lookAtBlock(origin, simPlayer) {
        const source = origin.getSource();
        if (source instanceof Entity === false)
            throw new Error('§cBlock targeting may only be used by entities.');
        const block = source.getBlockFromViewDirection({ maxDistance: 16*64 })?.block;
        if (block === void 0)
            throw new Error(`§cNo block in view.`);
        simPlayer.lookLocation(block);
    }

    lookAtEntity(origin, simPlayer) {
        const source = origin.getSource();
        if (source instanceof Entity === false)
            throw new Error('§cEntity targeting may only be used by entities.');
        const entity = source.getEntitiesFromViewDirection({ maxDistance: 16*64 })[0]?.entity;
        if (entity === void 0)
            throw new Error(`§cNo entity in view.`);
        simPlayer.lookLocation(entity);
    }

    lookAtMe(origin, simPlayer) {
        if (origin instanceof ServerCommandOrigin)
            throw new Error('§cSelf-targeting cannot be used by the server.');
        simPlayer.lookLocation(origin.getSource());
    }

    lookAtLocation(simPlayer, location) {
        simPlayer.lookLocation(Vector.from(location));
    }
}

export const lookCommand = new LookCommand();