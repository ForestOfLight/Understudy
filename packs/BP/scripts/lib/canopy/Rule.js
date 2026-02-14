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
import { extension } from 'main';
import { world } from '@minecraft/server';

export class Rule {
    #identifier;
    #description;
    #defaultValue;
    #contingentRules;
    #independentRules;

    constructor({ identifier, description, defaultValue = void 0, contingentRules = [], independentRules = [], onModifyCallback = () => {} }) {
        if (this.constructor === Rule) 
            throw new TypeError("Abstract class 'Rule' cannot be instantiated directly.");
        this.#identifier = identifier;
        this.#description = this.#parseDescription(description);
        this.#defaultValue = defaultValue;
        this.#contingentRules = contingentRules;
        this.#independentRules = independentRules;
        this.onModify = onModifyCallback;
    }

    getID() {
        return this.#identifier;
    }

    getDescription() {
        return this.#description;
    }

    getContigentRuleIDs() {
        return this.#contingentRules;
    }

    getIndependentRuleIDs() {
        return this.#independentRules;
    }

    getType() {
        throw new Error(`[${extension.name}] getType() must be implemented.`);
    }

    getDefaultValue() {
        return this.#defaultValue;
    }

    resetToDefaultValue() {
        this.setValue(this.#defaultValue);
    }

    getValue() {
        return this.parseRuleValueString(world.getDynamicProperty(this.#identifier));
    }

    setValue(value) {
        if (!this.isInDomain(value))
            throw new Error(`[${extension.name}] Incorrect value type for rule: ${this.getID()}`);
        if (!this.isInRange(value))
            throw new Error(`[${extension.name}] Value out of range for rule: ${this.getID()}`);
        world.setDynamicProperty(this.#identifier, value);
        this.onModify(value);
    }

    isInDomain() {
        throw new Error(`[${extension.name}] isInDomain() must be implemented.`);
    }

    isInRange() {
        throw new Error(`[${extension.name}] isInRange() must be implemented.`);
    }

    #parseDescription(description) {
        if (typeof description == 'string')
            return { text: description };
        return description;
    }
    
    parseRuleValueString(value) {
        if (value === 'undefined' || value === void 0) {
            this.resetToDefaultValue();
            return this.getDefaultValue();
        }
        try {
            return JSON.parse(value);
        } catch {
            if (value === 'NaN')
                return NaN;
            throw new Error(`[${extension.name}] Failed to parse value for DynamicProperty: ${value}.`);
        }
    }
}