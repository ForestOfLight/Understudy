import { system } from "@minecraft/server";
import { REPEATABLE_ACTIONS } from "../commands/action";
import { swapSlots } from "../utils";

export class RepeatableAction {
    understudy;
    type;
    intervalTicks = 0;
    startTick;

    constructor(understudy, type, intervalTicks = 0) {
        this.understudy = understudy;
        this.type = type;
        this.intervalTicks = intervalTicks;
        this.startTick = system.currentTick;
    }

    start() {
        this.runner = system.runInterval(() => this.onTick(), this.intervalTicks);
    }

    onTick() {
        if (this.isActionTick())
            this.perform();
    }

    setInterval(newIntervalTicks) {
        this.intervalTicks = newIntervalTicks;
    }

    isActionTick() {
        return (system.currentTick - this.startTick) % this.intervalTicks === 0 || this.intervalTicks === 0;
    }

    perform() {
        const simulatedPlayer = this.understudy.simulatedPlayer;
        if (simulatedPlayer === null)
            throw new Error(`[Understudy] Failed to run a repeating action on nonexistant player '${this.understudy.name}': ${this.type}`);
        switch (this.type) {
            case REPEATABLE_ACTIONS.ATTACK:
                simulatedPlayer.attack();
                break;
            case REPEATABLE_ACTIONS.INTERACT:
                simulatedPlayer.interact();
                break;
            case REPEATABLE_ACTIONS.USE:
                simulatedPlayer.useItemInSlot(simulatedPlayer.selectedSlotIndex);
                break;
            case REPEATABLE_ACTIONS.BUILD:
                this.build();
                break;
            case REPEATABLE_ACTIONS.BREAK:
                this.break();
                break;
            case REPEATABLE_ACTIONS.DROP:
                this.drop();
                break;
            case REPEATABLE_ACTIONS.DROP_STACK:
                simulatedPlayer.dropSelectedItem();
                break;
            case REPEATABLE_ACTIONS.DROP_ALL:
                this.dropAll();
                break;
            case REPEATABLE_ACTIONS.JUMP:
                simulatedPlayer.jump();
                break;
            default:
                console.warn(`[Understudy] Invalid repeating action for ${this.understudy.name}: ${this.type}`);
                break;
        }
    }
    
    build() {
        const simulatedPlayer = this.understudy.simulatedPlayer;
        const selectedSlot = simulatedPlayer.selectedSlotIndex;
        swapSlots(simulatedPlayer, 0, selectedSlot);
        simulatedPlayer.startBuild();
        simulatedPlayer.stopBuild();
        swapSlots(simulatedPlayer, 0, selectedSlot);
        simulatedPlayer.selectedSlotIndex = selectedSlot;
    }
    
    break() {
        const simulatedPlayer = this.understudy.simulatedPlayer;
        const lookingAtLocation = simulatedPlayer.getBlockFromViewDirection({ maxDistance: 6 })?.block?.location;
        if (lookingAtLocation === undefined)
            return;
        simulatedPlayer.breakBlock(lookingAtLocation);
    }
    
    drop() {
        const invContainer = this.understudy.getInventory();
        if (!invContainer)
            return;
        const simulatedPlayer = this.understudy.simulatedPlayer;
        const itemStack = invContainer.getItem(simulatedPlayer.selectedSlotIndex);
        if (itemStack === undefined)
            return;
        const savedAmount = itemStack.amount;
        if (savedAmount > 1) {
            itemStack.amount = 1;
            invContainer.setItem(simulatedPlayer.selectedSlotIndex, itemStack);
            simulatedPlayer.dropSelectedItem();
            itemStack.amount = savedAmount - 1;
            invContainer.setItem(simulatedPlayer.selectedSlotIndex, itemStack);
        } else {
            simulatedPlayer.dropSelectedItem();
        }
    }
    
    dropAll() {
        const invContainer = this.understudy.getInventory();
        if (!invContainer)
            return;
        const simulatedPlayer = this.understudy.simulatedPlayer;
        const selectedSlot = simulatedPlayer.selectedSlotIndex;
        simulatedPlayer.selectedSlotIndex = 0;
        simulatedPlayer.dropSelectedItem();
        for (let i = 0; i < invContainer.size; i++) {
            invContainer.moveItem(i, simulatedPlayer.selectedSlotIndex, invContainer);
            simulatedPlayer.dropSelectedItem();
        }
        simulatedPlayer.selectedSlotIndex = selectedSlot;
    }
}