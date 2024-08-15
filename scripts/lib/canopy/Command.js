import { system } from "@minecraft/server";

class Command {
    #name;
    #description;
    #usage;
    #callback;
    #args;
    #contingentRules;
	#adminOnly;
	static prefix = '';

	constructor({ name, description = '', usage, callback, args = [], contingentRules = [], adminOnly = false, extensionName = false }) {
		this.#name = name;
        this.#description = description;
        this.#usage = usage;
        this.#callback = callback;
        this.#args = args;
        this.#contingentRules = contingentRules;
		this.#adminOnly = adminOnly;
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

	isAdminOnly() {
		return this.#adminOnly;
	}

	runCallback(sender, args) {
		this.#callback(sender, args);
	}

	getUsage() {
		return Command.prefix + this.#usage;
	}

	sendUsage(sender) {
		sender.sendMessage(`§cUsage: ${Command.prefix}${this.#usage}`);
	}
}

system.afterEvents.scriptEventReceive.subscribe((event) => {
	if (event.id !== 'canopyExtension:commandPrefix' || event.sourceType !== 'Server') return;
	Command.prefix = event.message;
});

export default Command;