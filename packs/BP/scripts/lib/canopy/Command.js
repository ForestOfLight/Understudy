/**
 * @license
 * MIT License
 *
 * Copyright (c) 2024 ForestOfLight
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */
import { CustomCommandSource, CustomCommandStatus, Player, system } from "@minecraft/server";
import { extension } from "main";
import { BlockCommandOrigin } from "./BlockCommandOrigin";
import { EntityCommandOrigin } from "./EntityCommandOrigin";
import { ServerCommandOrigin } from "./ServerCommandOrigin";
import { PlayerCommandOrigin } from "./PlayerCommandOrigin";

export class Command {
    customCommand;

    constructor(customCommand) {
        this.customCommand = customCommand;
        this.setDefaultArgs();
        system.beforeEvents.startup.subscribe(this.setupForRegistry.bind(this));
    }

    setupForRegistry(startupEvent) {
        this.registerCommand(startupEvent.customCommandRegistry);
        system.beforeEvents.startup.unsubscribe(this.setupForRegistry.bind(this));
    }

    registerCommand(customCommandRegistry) {
        this.addPreCallback();
        this.registerEnums(customCommandRegistry);
        this.registerSingleCommand(customCommandRegistry);
        this.registerAliasCommands(customCommandRegistry);
    }

    setDefaultArgs() {
        if (this.customCommand.cheatsRequired === void 0)
            this.customCommand.cheatsRequired = false;
    }

    addPreCallback() {
        this.callback = (origin, ...args) => {
            const source = Command.resolveCommandOrigin(origin);
            const disabledContingentRules = this.#getDisabledContingentRules();
            this.#printDisabledContingentRules(disabledContingentRules, source);
            if (disabledContingentRules.length > 0)
                return;
            if (this.commandSourceIsNotAllowed(source))
                return { status: CustomCommandStatus.Failure, message: 'commands.generic.invalidsource' };
            return this.customCommand.callback(source, ...args);
        }
    }

    registerEnums(customCommandRegistry) {
        if (this.customCommand.enums) {
            for (const customEnum of this.customCommand.enums)
                customCommandRegistry.registerEnum(customEnum.name, customEnum.values);
        }
    }

    registerSingleCommand(customCommandRegistry, name = this.customCommand.name) {
        customCommandRegistry.registerCommand({
            name: name,
            description: this.customCommand.description,
            permissionLevel: this.customCommand.permissionLevel,
            mandatoryParameters: this.customCommand.mandatoryParameters,
            optionalParameters: this.customCommand.optionalParameters,
            cheatsRequired: this.customCommand.cheatsRequired
        }, this.callback);
    }

    registerAliasCommands(customCommandRegistry) {
        if (this.customCommand.aliases) {
            for (const alias of this.customCommand.aliases)
                this.registerSingleCommand(customCommandRegistry, alias);
        }
    }

    isCheatsRequired() {
        return this.customCommand.cheatsRequired;
    }

    static resolveCommandOrigin(origin) {
        switch (origin.sourceType) {
            case CustomCommandSource.Block:
                return new BlockCommandOrigin(origin);
            case CustomCommandSource.Entity:
                if (origin.sourceEntity instanceof Player)
                    return new PlayerCommandOrigin(origin);
                return new EntityCommandOrigin(origin);
            case CustomCommandSource.Server:
                return new ServerCommandOrigin(origin);
            default:
                throw new Error(`[${extension.name}] Unknown command source: ` + origin?.sourceType);
        }
    }

    #getDisabledContingentRules() {
        const disabledRules = new Array();
        for (const ruleID of this.customCommand.contingentRules || []) {
            const ruleValue = extension.getRuleValue(ruleID);
            if (!ruleValue)
                disabledRules.push(ruleID);
        }
        return disabledRules;
    }

    #printDisabledContingentRules(disabledContingentRules, source) {
        for (const ruleID of disabledContingentRules)
            source.sendMessage({ translate: 'rules.generic.blocked', with: [ruleID] });
    }

    commandSourceIsNotAllowed(source) {
        if (!this.customCommand.allowedSources)
            return false;
        return !this.customCommand.allowedSources.includes(source.constructor);
    }
}