import { world, system } from '@minecraft/server';
import Command from './Command';
import Rule from './Rule';

class CanopyExtension {
    name;
    description;
    version;
    #commands = {};
    #rules = {};

    constructor({ name = 'Unnamed', description = '', version = '1.0.0' }) {
        if (name.includes(' ')) {
            throw new Error('Extension name cannot contain spaces.');
        }
        this.name = name;
        this.description = description;
        if (!this.isValidVersion(version)) {
            throw new Error('Version must be in format #.#.#');
        }
        this.version = version;

        this.handleIncomingCallbacks();
        this.handleRuleValueRequests();
        this.handleRuleValueSetters();
    }

    isValidVersion(version) {
        if (/^\d+\.\d+\.\d+$/.test(version))
            return true;
        return false;
    }
    
    addCommand(command) {
        if (!(command instanceof Command)) {
            throw new Error('Command must be an instance of Command.');
        }
        this.#commands[command.getName()] = command;
        this.registerCommand(command);
    }
    
    registerCommand(command) {
        const commandData = {
            name: command.getName(),
            description: command.getDescription(),
            usage: command.getUsage(),
            callback: false,
            args: command.getArgs(),
            contingentRules: command.getContingentRules(),
            adminOnly: command.isAdminOnly(),
            helpEntries: command.getHelpEntries(),
            helpHidden: command.isHelpHidden(),
            extensionName: this.name
        };
		// console.warn(`[${this.name}] Attempting command registration: ${JSON.stringify(commandData)}`);
        world.getDimension('overworld').runCommandAsync(`scriptevent canopyExtension:registerCommand ${this.name} ${JSON.stringify(commandData)}`);
    }
    
    handleIncomingCallbacks() {
        system.afterEvents.scriptEventReceive.subscribe((event) => {
            if (event.id !== 'canopyExtension:commandCallbackRequest' || event.sourceType !== 'Server') return;
            const splitMessage = event.message.split(' ');
            const extensionName = splitMessage[0];
            if (extensionName !== this.name) return;
            const senderName = splitMessage[1];
            const sender = world.getPlayers({ name: senderName })[0];
            const commandName = splitMessage[2];
            if (!sender) {
                throw new Error(`Sender ${senderName} of ${commandName} not found.`);
            }
            const args = JSON.parse(event.message.slice(extensionName.length + senderName.length + commandName.length + 3));
            // console.warn(`[${this.name}] Received command callback: ${commandName} ${JSON.stringify(args)}`);
            this.#commands[commandName].runCallback(sender, args);
        }, { namespaces: ['canopyExtension'] });
    }

    addRule(rule) {
        if (!(rule instanceof Rule)) {
            throw new Error('Rule must be an instance of Rule.');
        }
        this.#rules[rule.getID()] = rule;
        this.registerRule(rule);
    }

    registerRule(rule) {
        const ruleData = {
            identifier: rule.getID(),
            description: rule.getDescription(),
            contingentRules: rule.getContigentRules(),
            independentRules: rule.getIndependentRules(),
            extensionName: this.name
        };
        // console.warn(`[${this.name}] Attempting rule registration: ${JSON.stringify(ruleData)}`);
        world.getDimension('overworld').runCommandAsync(`scriptevent canopyExtension:registerRule ${this.name} ${JSON.stringify(ruleData)}`);
    }

    handleRuleValueRequests() {
        system.afterEvents.scriptEventReceive.subscribe((event) => {
            if (event.id !== 'canopyExtension:ruleValueRequest' || event.sourceType !== 'Server') return;
            const splitMessage = event.message.split(' ');
            const extensionName = splitMessage[0];
            if (extensionName !== this.name) return;
            const ruleID = splitMessage[1];
            const rule = this.#rules[ruleID];
            if (!rule) {
                throw new Error(`Rule ${ruleID} not found.`);
            }
            let value = rule.getValue();
            // console.warn(`[${this.name}] Sending rule value: ${ruleID} ${value}`);
            world.getDimension('overworld').runCommandAsync(`scriptevent canopyExtension:ruleValueResponse ${this.name} ${ruleID} ${value}`);
        }, { namespaces: ['canopyExtension'] });
    }

    handleRuleValueSetters() {
        system.afterEvents.scriptEventReceive.subscribe((event) => {
            if (event.id !== 'canopyExtension:ruleValueSet' || event.sourceType !== 'Server') return;
            const splitMessage = event.message.split(' ');
            const extensionName = splitMessage[0];
            if (extensionName !== this.name) return;
            const ruleID = splitMessage[1];
            const rule = this.#rules[ruleID];
            if (!rule) {
                throw new Error(`Rule ${ruleID} not found.`);
            }
            const value = splitMessage[2];
            // console.warn(`[${this.name}] Setting rule value: ${ruleID} ${value}`);
            rule.setValue(value);
        }, { namespaces: ['canopyExtension'] });
    }
}

export { CanopyExtension, Command, Rule };