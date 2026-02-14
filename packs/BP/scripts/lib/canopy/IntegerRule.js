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

export class IntegerRule extends Rule {
    valueRange;

    constructor(options) {
        options.defaultValue = options.defaultValue || 0;
        super({ ...options });
        this.valueRange = this.#parseValueRange(options.valueRange);
    }

    getType() {
        return 'integer';
    }

    getValueRange() {
        return this.valueRange;
    }
    
    isInDomain(value) {
        return Math.floor(value) === value;
    }

    getAllowedValues() {
        return this.valueRange;
    }

    isInRange(value) {
        return this.valueRange.other?.includes(value) || (value >= this.valueRange?.range.min && value <= this.valueRange.range.max);
    }

    #parseValueRange(valueRange) {
        if (!valueRange)
            throw new Error(`[${extension.name}] valueRange must be defined.`);
        if (valueRange.range) {
            valueRange.range.min = parseFloat(valueRange.range.min);
            valueRange.range.max = parseFloat(valueRange.range.max);
        }
        if (valueRange.other)
            valueRange.other.map((value) => parseFloat(value));
        return valueRange;
    }
}