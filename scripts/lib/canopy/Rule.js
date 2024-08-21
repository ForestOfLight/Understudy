import { world } from '@minecraft/server';

const rules = {};
class Rule {
    #identifier;
    #description;
    #contingentRules;
    #independentRules;

    constructor({ identifier, description, contingentRules = [], independentRules = [] }) {
        this.#identifier = identifier;
        this.#description = description;
        this.#contingentRules = contingentRules;
        this.#independentRules = independentRules;
        rules[identifier] = this;
    }

    getID() {
        return this.#identifier;
    }

    getDescription() {
        return this.#description;
    }

    getContigentRules() {
        return this.#contingentRules;
    }

    getIndependentRules() {
        return this.#independentRules;
    }

    getValue() {
        return world.getDynamicProperty(this.#identifier);
    }

    static getRule(identifier) {
        return rules[identifier];
    }

    static getValue(identifier) {
        this.getRule(identifier).getValue();
    }

    setValue(value) {
        world.setDynamicProperty(this.#identifier, value);
    }
}

export default Rule;