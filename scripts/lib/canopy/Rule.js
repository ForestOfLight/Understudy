import { world } from '@minecraft/server';

class Rule {
    #identifier;
    #description;
    #contingentRules;
    #independentRules;

    constructor({ identifier, description, contingentRules, independentRules }) {
        this.#identifier = identifier;
        this.#description = description;
        this.#contingentRules = [];
        this.#independentRules = [];
    }

    getName() {
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
}

export default Rule;