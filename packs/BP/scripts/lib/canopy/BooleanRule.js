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
import { Rule } from './Rule';

export class BooleanRule extends Rule {
    constructor(options) {
        options.defaultValue = options.defaultValue || false;
        options.onModifyCallback = (value) => this.onModifyBool(value);
        super({ ...options });
        this.onEnable = options.onEnableCallback || (() => {});
        this.onDisable = options.onDisableCallback || (() => {});
    }

    getType() {
        return 'boolean';
    }

    onModifyBool(newValue) {
        if (newValue === true)
            this.onEnable();
        else if (newValue === false)
            this.onDisable();
        else
            throw new Error(`[${extension.name}] Unexpected modification value encountered for rule ${this.getID()}: ${newValue}`);
    }
    
    isInDomain(value) {
        return value === true || value === false;
    }

    isInRange(value) {
        return this.isInDomain(value);
    }
}