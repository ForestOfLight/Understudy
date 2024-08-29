import { world } from '@minecraft/server';

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

    setValue(value) {
        world.setDynamicProperty(this.#identifier, value);
    }
}

export default Rule;