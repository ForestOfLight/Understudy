import { world, system } from '@minecraft/server';
import Command from './Command';
import Rule from './Rule';

class CanopyExtension {
    name;
    description;
    version;
    commands = {};

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
    }

    isValidVersion(version) {
        if (/^\d+\.\d+\.\d+$/.test(version))
            return true;
        return false;
    }

    handleIncomingCallbacks() {
        system.afterEvents.scriptEventReceive.subscribe((event) => {
            if (event.id !== 'canopyExtension:commandCallback' || event.sourceType !== 'Server') return;
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
            this.commands[commandName].runCallback(sender, args);
        }, { namespaces: ['canopyExtension'] });
    }

    addCommand(command) {
        if (!(command instanceof Command)) {
            throw new Error('Command must be an instance of Command.');
        }
        this.commands[command.getName()] = command;
        this.registerCommand(command);
    }

    registerCommand(command) {
        const commandData = {
            name: command.getName(),
            description: command.getDescription(),
            usage: command.getUsage(),
            args: command.getArgs(),
            contingentRules: command.getContingentRules(),
            adminOnly: command.isAdminOnly(),
            extensionName: this.name
        };
		// console.warn(`[${this.name}] Attempting command registration: ${JSON.stringify(commandData)}`);
        world.getDimension('overworld').runCommandAsync(`scriptevent canopyExtension:registerCommand ${this.name} ${JSON.stringify(commandData)}`);
    }
}

export { CanopyExtension, Command, Rule };