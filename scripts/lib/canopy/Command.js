import { system } from "@minecraft/server";

class Command {
    #name;
    #description;
    #usage;
    #callback;
    #args;
    #contingentRules;
	#adminOnly;
	#helpEntries;
	#helpHidden;
	static #prefix = '';

	constructor({ name, description = '', usage, callback, args = [], contingentRules = [], adminOnly = false, helpEntries = [], helpHidden = false }) {
		this.#name = name;
        this.#description = description;
        this.#usage = usage;
        this.#callback = callback;
        this.#args = args;
        this.#contingentRules = contingentRules;
		this.#adminOnly = adminOnly;
		this.#helpEntries = helpEntries;
		this.#helpHidden = helpHidden;
	}

	getName() {
		return this.#name;
	}

	getDescription() {
		return this.#description;
	}

	getUsage() {
		return Command.#prefix + this.#usage;
	}

	getCallback() {
		return this.#callback;
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
	
	getHelpEntries() {
		return this.#helpEntries;
	}

	isHelpHidden() {
		return this.#helpHidden;
	}
	
	runCallback(sender, args) {
		this.#callback(sender, args);
	}
	
	sendUsage(sender) {
		sender.sendMessage(`§cUsage: ${Command.#prefix}${this.#usage}`);
	}

	static recievePrefix(scriptEventReceive) {
		if (scriptEventReceive.id !== 'canopyExtension:commandPrefix' || scriptEventReceive.sourceType !== 'Server') return;
		Command.#prefix = scriptEventReceive.message;
		system.afterEvents.scriptEventReceive.unsubscribe(Command.recievePrefix);
	}

	static getPrefix() {
		return Command.#prefix;
	}
}

system.afterEvents.scriptEventReceive.subscribe((event) => Command.recievePrefix(event), { namespaces: ['canopyExtension'] });

export default Command;