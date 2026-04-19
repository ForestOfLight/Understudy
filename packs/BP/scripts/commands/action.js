import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";

export const REPEATABLE_ACTIONS = Object.freeze({
    ATTACK: 'attack',
    INTERACT: 'interact',
    USE: 'use',
    BUILD: 'build',
    BREAK: 'break',
    DROP: 'drop',
    DROP_STACK: 'dropstack',
    DROP_ALL: 'dropall',
    JUMP: 'jump'
});

export const TIMING_OPTIONS = Object.freeze({
    ONCE: 'once',
    CONTINUOUS: 'continuous',
    INTERVAL: 'interval',
    AFTER: 'after',
    STOP: 'stop'
});

export class ActionCommand extends Command {
    constructor() {
        super({
            name: 'simplayer:action',
            description: 'Make a simplayer do actions with variable timing.',
            enums: [
                { name: 'simplayer:action', values: Object.values(REPEATABLE_ACTIONS) },
                { name: 'simplayer:timingOption', values: Object.values(TIMING_OPTIONS) }
            ],
            mandatoryParameters: [
                { name: 'playername', type: CustomCommandParamType.String },
                { name: 'simplayer:action', type: CustomCommandParamType.Enum }
            ],
            optionalParameters: [
                { name: 'simplayer:timingOption', type: CustomCommandParamType.Enum },
                { name: 'ticks', type: CustomCommandParamType.Integer }
            ],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.actionCommand(origin, ...args)
        });
    }

    actionCommand(origin, playername, action, timingOption = TIMING_OPTIONS.ONCE, ticks) {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        if (!Object.values(REPEATABLE_ACTIONS).includes(action))
            return { status: CustomCommandStatus.Failure, message: `§cInvalid action: '${action}'` };
        const actions = understudy.actions;

        switch (timingOption) {
            case TIMING_OPTIONS.ONCE:
                actions.once(action);
                break;
            case TIMING_OPTIONS.AFTER:
                return this.#singleAfterAction(actions, action, timingOption, ticks);
            case TIMING_OPTIONS.CONTINUOUS:
                actions.repeat(action);
                break;
            case TIMING_OPTIONS.INTERVAL:
                return this.#intervalAction(actions, action, timingOption, ticks);
            case TIMING_OPTIONS.STOP:
                actions.remove(action);
                break;
            default:
                return { status: CustomCommandStatus.Failure, message: `§cInvalid ${action} timing: ${timingOption}.` };
        }
        return { status: CustomCommandStatus.Success };
    }

    #singleAfterAction(actions, action, timingOption, ticks) {
        if (ticks === void 0)
            return { status: CustomCommandStatus.Failure, message: `§cInvalid '${timingOption}' tick duration: ${ticks}. Expected an integer.` };
        actions.once(action, ticks);
        return { status: CustomCommandStatus.Success };
    }

    #intervalAction(actions, action, timingOption, ticks) {
        if (ticks === void 0)
            return { status: CustomCommandStatus.Failure, message: `§cInvalid '${timingOption}' tick duration: ${ticks}. Expected an integer.` };
        actions.repeat(action, ticks);
        return { status: CustomCommandStatus.Success };
    }
}

export const actionCommand = new ActionCommand();