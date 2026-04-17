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
export const EquipmentSlot = { Body: 'Body', Chest: 'Chest', Feet: 'Feet', Head: 'Head', Legs: 'Legs', Mainhand: 'Mainhand', Offhand: 'Offhand' }
export const DimensionTypes = { getAll: vi.fn(() => []) }
export const TicksPerSecond = 20
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
    run: vi.fn(),
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
    getDynamicProperty: vi.fn((key) => dynamicPropertyStore.get(key)),
    setDynamicProperty: vi.fn((key, value) => {
        if (value === undefined) {
            dynamicPropertyStore.delete(key);
        } else {
            dynamicPropertyStore.set(key, value);
        }
    }),
    getDynamicPropertyIds: vi.fn(() => [...dynamicPropertyStore.keys()]),
    getDimension: vi.fn(() => ({
        runCommand: vi.fn(),
        fillBlocks: vi.fn(),
        getEntities: vi.fn(() => []),
        spawnItem: vi.fn(),
    })),
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
