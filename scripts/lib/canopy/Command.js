class Command {
    #name;
    #description;
    #usage;
    #callback;
    #args;
    #contingentRules;

	constructor({ name, description = '', usage, callback, args = [], contingentRules = [] }) {
		this.#name = name;
        this.#description = description;
        this.#usage = usage;
        this.#callback = callback;
        this.#args = args;
        this.#contingentRules = contingentRules;
	}

	getName() {
		return this.#name;
	}

	getDescription() {
		return this.#description;
	}

	getUsage() {
		return this.#usage;
	}

	getArgs() {
		return this.#args;
	}

	getContingentRules() {
		return this.#contingentRules;
	}

	runCallback(sender, args) {
		this.#callback(sender, args);
	}
}

export default Command;