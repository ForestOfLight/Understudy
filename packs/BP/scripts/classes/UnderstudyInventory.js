import { EntityComponentTypes, EquipmentSlot, world } from "@minecraft/server";
import SRCItemDatabase from "../lib/SRCItemDatabase/ItemDatabase.js";

export class UnderstudyInventory {
    constructor(understudy) {
        this.understudy = understudy;
        const tableName = 'bot_' + understudy.name.substr(0, 8);
        this.itemDatabase = new SRCItemDatabase(tableName);
        this.inventoryDP = `${tableName}_inventory`;
        this.equippableDP = `${tableName}_equippable`;
        this.inventoryDBKey = 'inv';
        this.equippableDBKey = 'equ';
    }

    save() {
        this.saveInventoryItems({ saveNBT: true });
        this.saveEquippableItems({ saveNBT: true });
    }

    saveWithoutNBT() {
        this.saveInventoryItems({ saveNBT: false });
        this.saveEquippableItems({ saveNBT: false });
    }

    saveInventoryItems({ saveNBT = true } = {}) {
        const inventoryItems = {};
        const inventoryContainer = this.understudy.simulatedPlayer.getComponent(EntityComponentTypes.Inventory)?.container;
        if (inventoryContainer !== void 0) {
            for (let i = 0; i < inventoryContainer.size; i++) {
                const itemStack = inventoryContainer.getItem(i);
                if (!itemStack)
                    inventoryItems[i] = void 0;
                else
                    inventoryItems[i] = itemStack;
            }
            this.saveItemsWithoutNBT(this.inventoryDP, inventoryItems);
            if (saveNBT)
                this.saveItemsWithNBT(this.inventoryDBKey, inventoryItems);
        }
    }

    saveEquippableItems({ saveNBT = true } = {}) {
        const equippableItems = {};
        const equippable = this.understudy.simulatedPlayer.getComponent(EntityComponentTypes.Equippable);
        if (equippable !== undefined) {
            for (const equipmentSlot in EquipmentSlot) {
                const itemStack = equippable.getEquipment(equipmentSlot);
                if (itemStack !== undefined)
                    equippableItems[equipmentSlot] = itemStack;
            }
            this.saveItemsWithoutNBT(this.equippableDP, equippableItems);
            if (saveNBT)
                this.saveItemsWithNBT(this.equippableDBKey, equippableItems);
        }
    }

    saveItemsWithoutNBT(dynamicProperty, itemStacks) {
        const items = {};
        for (let [key, itemStack] of Object.entries(itemStacks)) {
            if (itemStack) {
                items[key] = { typeId: itemStack.typeId, amount: itemStack.amount };
            }
        }
        const itemsWithoutNBT = JSON.stringify(items);
        world.setDynamicProperty(dynamicProperty, itemsWithoutNBT);
    }

    saveItemsWithNBT(DBKey, itemStacks) {
        const itemsWithNBT = Object.values(itemStacks).filter(item => item !== void 0);
        this.itemDatabase.setItems(DBKey, itemsWithNBT);
    }

    load() {
        this.loadInventoryItems();
        this.loadEquippableItems();
    }

    loadInventoryItems() {
        const inventoryContainer = this.understudy.simulatedPlayer.getComponent(EntityComponentTypes.Inventory)?.container;
        if (inventoryContainer === void 0)
            return;
        const itemsWithoutNBTStr = world.getDynamicProperty(this.inventoryDP);
        if (itemsWithoutNBTStr === undefined)
            return;
        const itemsWithoutNBT = JSON.parse(itemsWithoutNBTStr);
        const itemsWithNBT = this.itemDatabase.getItems(this.inventoryDBKey);
        for (let i = 0; i < inventoryContainer.size; i++) {
            const itemWithoutNBT = itemsWithoutNBT[i];
            let itemStack = void 0;
            if (itemWithoutNBT !== void 0) {
                itemStack = itemsWithNBT.find(item => item.typeId === itemWithoutNBT.typeId && item.amount === itemWithoutNBT.amount);
                itemsWithNBT.splice(itemsWithNBT.indexOf(itemStack), 1);
                // Items not found in both databases will be removed from the inventory. This is intentional to discourage item duplication.
            }
            inventoryContainer.setItem(i, itemStack);
        }
    }

    loadEquippableItems() {
        const equippable = this.understudy.simulatedPlayer.getComponent(EntityComponentTypes.Equippable);
        if (equippable === undefined)
            return;
        const itemsWithoutNBTStr = world.getDynamicProperty(this.equippableDP);
        if (itemsWithoutNBTStr === undefined)
            return;
        const itemsWithoutNBT = JSON.parse(itemsWithoutNBTStr);
        const itemsWithNBT = this.itemDatabase.getItems(this.equippableDBKey);
        for (const equipmentSlot in EquipmentSlot) {
            const itemWithoutNBT = itemsWithoutNBT[equipmentSlot];
            let itemStack = void 0;
            if (itemWithoutNBT !== null && itemWithoutNBT !== void 0)
                itemStack = itemsWithNBT.find(item => item.typeId === itemWithoutNBT.typeId && item.amount === itemWithoutNBT.amount);
            equippable.setEquipment(equipmentSlot, itemStack);
        }
    }
}