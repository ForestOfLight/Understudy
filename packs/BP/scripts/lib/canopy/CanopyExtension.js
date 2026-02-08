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
import IPC from '../../lib/ipc/ipc';
import { Ready, RegisterExtension, RegisterRule, RuleValueRequest, RuleValueSet, RuleValueResponse } from './extension.ipc';
import { Command } from './Command';
import { BlockCommandOrigin } from './BlockCommandOrigin';
import { EntityCommandOrigin } from './EntityCommandOrigin';
import { PlayerCommandOrigin } from './PlayerCommandOrigin';
import { ServerCommandOrigin } from './ServerCommandOrigin';
import { FeedbackMessageType } from './FeedbackMessageType';
import { Rule } from './Rule';
import { BooleanRule } from './BooleanRule';
import { IntegerRule } from './IntegerRule';
import { FloatRule } from './FloatRule';

class CanopyExtension {
    name;
    version;
    author;
    description;
    #rules = {};
    #isRegistrationReady = false;

    constructor({ name = 'Unnamed', version = '1.0.0', author = 'Unknown', description = { text: '' } }) {
        this.id = this.#makeID(name);
        this.name = name;
        this.version = version;
        this.author = author;
        this.description = description;

        this.#registerExtension();
        this.#handleRuleValueRequests();
        this.#handleRuleValueSetters();
    }

    addRule(rule) {
        if (!(rule instanceof Rule))
            throw new Error(`[${this.name}] Rule must be an instance of Rule.`);
        this.#rules[rule.getID()] = rule;
        if (this.#isRegistrationReady)
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
        IPC.once('canopyExtension:ready', Ready, () => {
            IPC.send('canopyExtension:registerExtension', RegisterExtension, {
                name: this.name,
                version: this.version,
                author: this.author,
                description: this.description
            });
        });
        IPC.once(`canopyExtension:${this.id}:ready`, Ready, () => {
            this.#isRegistrationReady = true;
            for (const rule of Object.values(this.#rules))
                this.#registerRule(rule);
        });
    }

    #registerRule(rule) {
        const ruleData = {
            identifier: rule.getID(),
            description: rule.getDescription(),
            defaultValue: String(rule.getDefaultValue()),
            contingentRules: rule.getContigentRuleIDs(),
            independentRules: rule.getIndependentRuleIDs(),
            type: rule.getType(),
            extensionName: this.name
        }
        if (rule instanceof IntegerRule || rule instanceof FloatRule)
            ruleData.valueRange = rule.getValueRange();
        IPC.send(`canopyExtension:${this.id}:registerRule`, RegisterRule, ruleData);
        rule.onModify(rule.getValue());
    }

    #handleRuleValueRequests() {
        IPC.handle(`canopyExtension:${this.id}:ruleValueRequest`, RuleValueRequest, RuleValueResponse, (data) => {
            const rule = this.#rules[data.ruleID];
            if (!rule)
                throw new Error(`[${this.name}] Rule ${data.ruleID} not found.`);
            const value = String(rule.getValue());
            return { value };
        });
    }

    #handleRuleValueSetters() {
        IPC.on(`canopyExtension:${this.id}:ruleValueSet`, RuleValueSet, (data) => {
            const rule = this.#rules[data.ruleID];
            if (!rule)
                throw new Error(`[${this.name}] Rule ${data.ruleID} not found.`);
            rule.setValue(rule.parseRuleValueString(data.value));
        });
    }
}

export {
    CanopyExtension,
    Command, BlockCommandOrigin, EntityCommandOrigin, PlayerCommandOrigin, ServerCommandOrigin, FeedbackMessageType,
    BooleanRule, IntegerRule, FloatRule
};