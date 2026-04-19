import Understudies from "../classes/Understudies";
import { Command, PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin } from "../lib/canopy/CanopyExtension";
import { CustomCommandParamType, CommandPermissionLevel, CustomCommandStatus } from "@minecraft/server";

export class InventoryCommand extends Command {
    constructor() {
        super({
            name: 'simplayer:inventory',
            description: 'Print the inventory of a simplayer.',
            mandatoryParameters: [{ name: 'playername', type: CustomCommandParamType.String }],
            permissionLevel: CommandPermissionLevel.Any,
            allowedSources: [PlayerCommandOrigin, BlockCommandOrigin, EntityCommandOrigin, ServerCommandOrigin],
            callback: (origin, ...args) => this.inventoryCommand(origin, ...args)
        });
    }

    inventoryCommand(origin, playername) {
        const understudy = Understudies.get(playername);
        if (!understudy)
            return { status: CustomCommandStatus.Failure, message: Understudies.getNotOnlineMessage(playername) };
        return { status: CustomCommandStatus.Success, message: this.#getInventoryMessage(understudy) };
    }

    #getInventoryMessage(understudy) {
        const playerInventory = understudy.getInventory();
        if (!playerInventory)
            return `§cNo inventory found`;
        if (playerInventory.size === playerInventory.emptySlotsCount)
            return `§7${understudy.name}'s inventory is empty.`;
        return this.#getFormattedInventoryMessage(understudy, playerInventory);
    }

    #getFormattedInventoryMessage(understudy, playerInventory) {
        let message = `${understudy.name}'s inventory:`;
        for (let i = 0; i < playerInventory.size; i++) {
            const itemStack = playerInventory.getItem(i);
            if (itemStack !== void 0) {
                const colorCode = i < 10 ? '§a' : '';
                message += `\n§7- ${colorCode}${i}§7: ${itemStack.typeId} x${itemStack.amount}`;
            }
        }
        return message;
    }
}

export const inventoryCommand = new InventoryCommand();