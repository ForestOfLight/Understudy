import { vi } from 'vitest'

export const dynamicPropertyStore = new Map()

let _nextRunId = 1
const _scheduled = new Map() // id → { callback, nextTick, interval: number | null }
let _currentTick = 0

export function advanceTicks(n = 1) {
    for (let i = 0; i < n; i++) {
        _currentTick++
        system.currentTick = _currentTick
        for (const [id, entry] of [..._scheduled.entries()]) {
            if (!_scheduled.has(id)) continue
            if (entry.nextTick <= _currentTick) {
                entry.callback()
                if (entry.interval !== null) {
                    if (_scheduled.has(id))
                        entry.nextTick = _currentTick + entry.interval
                } else {
                    _scheduled.delete(id)
                }
            }
        }
    }
}

export function resetScheduler() {
    _nextRunId = 1
    _scheduled.clear()
    _currentTick = 0
    system.currentTick = 0
}

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
        this.containerRules = void 0
        this.#slots = Array.from({ length: size }, (_, i) => items[i] ?? void 0)
    }

    get emptySlotsCount() { return this.#slots.filter(s => s === void 0).length }
    get weight() { return 0 }

    getItem = vi.fn(i => this.#slots[i] ?? void 0)
    setItem = vi.fn((i, item) => { this.#slots[i] = item ?? void 0 })
    getSlot = vi.fn(i => ({
        getItem: () => this.#slots[i] ?? void 0,
        setItem: (item) => { this.#slots[i] = item ?? void 0 },
    }))
    addItem = vi.fn(itemStack => {
        for (let i = 0; i < this.size; i++) {
            if (!this.#slots[i]) {
                this.#slots[i] = itemStack
                return void 0
            }
        }
        return itemStack
    })
    clearAll = vi.fn(() => { this.#slots = Array(this.size).fill(void 0) })
    contains = vi.fn(itemStack => this.#slots.some(s => s?.typeId === itemStack?.typeId))
    find = vi.fn(itemStack => {
        const i = this.#slots.findIndex(s => s?.typeId === itemStack?.typeId)
        return i === -1 ? void 0 : i
    })
    findLast = vi.fn(itemStack => {
        for (let i = this.size - 1; i >= 0; i--) {
            if (this.#slots[i]?.typeId === itemStack?.typeId) return i
        }
        return void 0
    })
    firstEmptySlot = vi.fn(() => {
        const i = this.#slots.findIndex(s => s === void 0)
        return i === -1 ? void 0 : i
    })
    firstItem = vi.fn(() => {
        const i = this.#slots.findIndex(slot => slot !== void 0)
        return i === -1 ? void 0 : i
    })
    swapItems = vi.fn((slotA, slotB, otherContainer) => {
        const target = otherContainer ?? this
        const a = this.#slots[slotA]
        const b = target.getItem(slotB)
        this.#slots[slotA] = b ?? void 0
        target.setItem(slotB, a)
    })
    moveItem = vi.fn((fromSlot, toSlot, toContainer) => {
        const item = this.#slots[fromSlot]
        this.#slots[fromSlot] = void 0
        toContainer.setItem(toSlot, item)
    })
    transferItem = vi.fn((fromSlot, toContainer) => {
        const item = this.#slots[fromSlot]
        if (!item) return void 0
        for (let i = 0; i < toContainer.size; i++) {
            if (!toContainer.getItem(i)) {
                this.#slots[fromSlot] = void 0
                toContainer.setItem(i, item)
                return item
            }
        }
        return void 0
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
    run: vi.fn(callback => {
        const id = _nextRunId++
        _scheduled.set(id, { callback, nextTick: _currentTick + 1, interval: null })
        return id
    }),
    runTimeout: vi.fn((callback, tickDelay = 0) => {
        const id = _nextRunId++
        _scheduled.set(id, { callback, nextTick: _currentTick + Math.max(tickDelay, 1), interval: null })
        return id
    }),
    runInterval: vi.fn((callback, tickInterval = 0) => {
        const id = _nextRunId++
        const interval = Math.max(tickInterval, 1)
        _scheduled.set(id, { callback, nextTick: _currentTick + interval, interval })
        return id
    }),
    clearRun: vi.fn(runId => {
        _scheduled.delete(runId)
    }),
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
        return dynamicPropertyStore.get(key)
    }),
    setDynamicProperty: vi.fn((key, value) => {
        if (value === void 0)
            dynamicPropertyStore.delete(key)
        else
            dynamicPropertyStore.set(key, JSON.stringify(value))
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
