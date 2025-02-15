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
import { world } from '@minecraft/server';
import IPC from '../../lib/ipc/ipc';
import Command from './Command';
import Rule from './Rule';

class CanopyExtension {
    name;
    version;
    author;
    description;
    #commands = {};
    #rules = {};

    constructor({ name = 'Unnamed', version = '1.0.0', author = 'Unknown', description = { text: '' } }) {
        this.id = this.#makeID(name);
        this.name = name;
        this.version = version;
        this.author = author;
        this.description = description;

        this.#registerExtension();
        this.#handleCommandCallbacks();
        this.#handleRuleValueRequests();
        this.#handleRuleValueSetters();
    }
    
    addCommand(command) {
        if (!(command instanceof Command)) {
            throw new Error('Command must be an instance of Command.');
        }
        this.#commands[command.getName()] = command;
        this.#registerCommand(command);
    }

    addRule(rule) {
        if (!(rule instanceof Rule)) {
            throw new Error('Rule must be an instance of Rule.');
        }
        this.#rules[rule.getID()] = rule;
        this.#registerRule(rule);
    }

    getRuleValue(ruleID) {
        return this.#rules[ruleID].getValue();
    }

    #makeID(name) {
        if (typeof name !== 'string')
            throw new Error(`[${name}] Could not register extension. Extension name must be a string.`);
        const id = name.toLowerCase().replace(/[^a-z0-9 ]/g, '').replace(/ /g, '_');
        if (id.length === 0)
            throw new Error(`[${name}] Could not register extension. Extension name must contain at least one alphanumeric character.`);
        return id;
    }

    #registerExtension() {
        IPC.send('canopyExtension:registerExtension', {
            name: this.name,
            version: this.version,
            author: this.author,
            description: this.description
        });
        this.#setupCommandPrefix();
    }

    #registerCommand(command) {
        // console.warn(`[${this.name}] Registering command: ${command.getName()}`);
        IPC.send(`canopyExtension:${this.id}:registerCommand`, {
            name: command.getName(),
            description: command.getDescription(),
            usage: command.getUsage(),
            callback: false,
            args: command.getArgs(),
            contingentRules: command.getContingentRules(),
            adminOnly: command.isAdminOnly(),
            helpEntries: command.getHelpEntries(),
            helpHidden: command.isHelpHidden(),
            extensionName: this.name
        });
    }
    
    #handleCommandCallbacks() {
        IPC.on(`canopyExtension:${this.id}:commandCallbackRequest`, (cmdData) => {
            if (cmdData.senderName === undefined)
                return;
            const sender = world.getPlayers({ name: cmdData.senderName })[0];
            if (!sender)
                throw new Error(`Sender ${cmdData.senderName} of ${cmdData.commandName} not found.`);
            // console.warn(`[${this.name}] Received command callback from ${cmdData.senderName}: ${cmdData.commandName} ${JSON.stringify(cmdData.args)}`);
            this.#commands[cmdData.commandName].runCallback(sender, cmdData.args);
        });
    }

    #registerRule(rule) {
        // console.warn(`[${this.name}] Registering rule: ${rule.getID()}`);
        IPC.send(`canopyExtension:${this.id}:registerRule`, {
            identifier: rule.getID(),
            description: rule.getDescription(),
            contingentRules: rule.getContigentRules(),
            independentRules: rule.getIndependentRules(),
            extensionName: this.name
        });
    }

    #handleRuleValueRequests() {
        IPC.handle(`canopyExtension:${this.id}:ruleValueRequest`, (data) => {
            const rule = this.#rules[data.ruleID];
            if (!rule)
                throw new Error(`Rule ${data.ruleID} not found.`);
            const value = rule.getValue();
            // console.warn(`[${this.name}] Returning rule value for ${data.ruleID}: ${value} (${typeof value})`);
            return value;
        });
    }

    #handleRuleValueSetters() {
        IPC.on(`canopyExtension:${this.id}:ruleValueSet`, (data) => {
            const rule = this.#rules[data.ruleID];
            if (!rule)
                throw new Error(`Rule ${data.ruleID} not found.`);
            // console.warn(`[${this.name}] Setting rule value: ${data.ruleID} ${data.value}`);
            rule.setValue(data.value);
        });
    }

    #setupCommandPrefix() { // If this doesn't work, async it.
        const prefix = IPC.invoke(`canopyExtension:getCommandPrefix`).then(result => {
            Command.setPrefix(result);
        });
    }
}

export { CanopyExtension, Command, Rule };