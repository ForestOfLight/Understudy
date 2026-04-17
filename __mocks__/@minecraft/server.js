import { vi } from 'vitest'

export const dynamicPropertyStore = new Map()

export const ScriptEventSource = { Block: 'Block', Entity: 'Entity', NPCDialogue: 'NPCDialogue', Server: 'Server' }

export const CustomCommandSource = {}
export const CustomCommandStatus = {}
export const CommandPermissionLevel = {}
export const CustomCommandParamType = {}
export const Entity = class Entity {}
export const Player = class Player extends Entity {}
export const Block = class Block {}
export const GameMode = { Adventure: 'Adventure', Creative: 'Creative', Spectator: 'Spectator', Survival: 'Survival' }
export const EntityComponentTypes = {
    Inventory: 'minecraft:inventory',
    Equippable: 'minecraft:equippable',
    Projectile: 'minecraft:projectile',
}
export const Container = class Container {
    #slots

    constructor({ size = 27, items = {} } = {}) {
        this.size = size
        this.isValid = true
        this.containerRules = undefined
        this.#slots = Array.from({ length: size }, (_, i) => items[i] ?? undefined)
    }

    get emptySlotsCount() { return this.#slots.filter(s => s === undefined).length }
    get weight() { return 0 }

    getItem = vi.fn(i => this.#slots[i] ?? undefined)
    setItem = vi.fn((i, item) => { this.#slots[i] = item ?? undefined })
    getSlot = vi.fn(i => ({
        getItem: () => this.#slots[i] ?? undefined,
        setItem: (item) => { this.#slots[i] = item ?? undefined },
    }))
    addItem = vi.fn(itemStack => {
        for (let i = 0; i < this.size; i++) {
            if (!this.#slots[i]) {
                this.#slots[i] = itemStack
                return undefined
            }
        }
        return itemStack
    })
    clearAll = vi.fn(() => { this.#slots = Array(this.size).fill(undefined) })
    contains = vi.fn(itemStack => this.#slots.some(s => s?.typeId === itemStack?.typeId))
    find = vi.fn(itemStack => {
        const i = this.#slots.findIndex(s => s?.typeId === itemStack?.typeId)
        return i === -1 ? undefined : i
    })
    findLast = vi.fn(itemStack => {
        for (let i = this.size - 1; i >= 0; i--) {
            if (this.#slots[i]?.typeId === itemStack?.typeId) return i
        }
        return undefined
    })
    firstEmptySlot = vi.fn(() => {
        const i = this.#slots.findIndex(s => s === undefined)
        return i === -1 ? undefined : i
    })
    firstItem = vi.fn(() => {
        const i = this.#slots.findIndex(slot => slot !== undefined)
        return i === -1 ? undefined : i
    })
    swapItems = vi.fn((slotA, slotB, otherContainer) => {
        const target = otherContainer ?? this
        const a = this.#slots[slotA]
        const b = target.getItem(slotB)
        this.#slots[slotA] = b ?? undefined
        target.setItem(slotB, a)
    })
    moveItem = vi.fn((fromSlot, toSlot, toContainer) => {
        const item = this.#slots[fromSlot]
        this.#slots[fromSlot] = undefined
        toContainer.setItem(toSlot, item)
    })
    transferItem = vi.fn((fromSlot, toContainer) => {
        const item = this.#slots[fromSlot]
        if (!item) return undefined
        for (let i = 0; i < toContainer.size; i++) {
            if (!toContainer.getItem(i)) {
                this.#slots[fromSlot] = undefined
                toContainer.setItem(i, item)
                return item
            }
        }
        return undefined
    })
}
export const EquipmentSlot = { Body: 'Body', Chest: 'Chest', Feet: 'Feet', Head: 'Head', Legs: 'Legs', Mainhand: 'Mainhand', Offhand: 'Offhand' }
export const DimensionTypes = { getAll: vi.fn(() => [new DimensionType("minecraft:overworld"), new DimensionType('minecraft:nether'), new DimensionType('minecraft:the_end')]) }
export const DimensionType = class DimensionType { 
    typeId = 'minecraft:overworld' 

    constructor(typeId = void 0) {
        if (typeId) this.typeId = typeId
    }
}
export const TicksPerSecond = 20.0
export const BlockVolume = class BlockVolume {}
export const EntityItemComponent = class EntityItemComponent { static componentId = 'minecraft:item' }
export const StructureSaveMode = { Memory: 'Memory', World: 'World' }

export const system = {
    afterEvents: {
        scriptEventReceive: { subscribe: vi.fn() },
    },
    beforeEvents: {
        shutdown: { subscribe: vi.fn(), unsubscribe: vi.fn() },
        startup: { subscribe: vi.fn() },
    },
    runJob: vi.fn(),
    runTimeout: vi.fn(),
    runInterval: vi.fn(),
    clearRun: vi.fn(),
    run: vi.fn(callback => { callback() }),
    currentTick: 0,
}

export const world = {
    afterEvents: {
        playerJoin: { subscribe: vi.fn() },
        entityDie: { subscribe: vi.fn() },
        playerGameModeChange: { subscribe: vi.fn() },
        gameRuleChange: { subscribe: vi.fn() },
        worldLoad: { subscribe: vi.fn(cb => cb()) },
    },
    getDynamicProperty: vi.fn((key) => {
        return dynamicPropertyStore.get(key);
    }),
    setDynamicProperty: vi.fn((key, value) => {
        if (value === undefined)
            dynamicPropertyStore.delete(key);
        else
            dynamicPropertyStore.set(key, JSON.stringify(value));
    }),
    getDynamicPropertyIds: vi.fn(() => [...dynamicPropertyStore.keys()]),
    getDimension: vi.fn((() => {
        const dim = { runCommand: vi.fn(), fillBlocks: vi.fn(), getEntities: vi.fn(() => []), spawnItem: vi.fn() }
        return () => dim
    })()),
    getPlayers: vi.fn(() => []),
    getEntity: vi.fn(),
    sendMessage: vi.fn(),
    gameRules: {},
    structureManager: {
        get: vi.fn(),
        delete: vi.fn(() => true),
        place: vi.fn(),
        createFromWorld: vi.fn(),
    },
}
