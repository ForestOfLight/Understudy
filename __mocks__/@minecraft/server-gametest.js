import { vi } from 'vitest'
import { EntityComponentTypes } from '@minecraft/server'

export function makeContainer({ size = 3, items = {}, swapItems = false, moveItem = false } = {}) {
    return {
        size,
        getItem: vi.fn(i => items[i]),
        setItem: vi.fn(),
        ...(swapItems && { swapItems: vi.fn() }),
        ...(moveItem && { moveItem: vi.fn() }),
    }
}

export function makeEquippable(items = {}) {
    return {
        getEquipment: vi.fn(slot => items[slot]),
        setEquipment: vi.fn(),
    }
}

export function makeSimulatedPlayer(overrides = {}) {
    const container = overrides.container ?? makeContainer({ swapItems: true, moveItem: true })
    const equippable = overrides.equippable ?? makeEquippable()
    delete overrides.container
    delete overrides.equippable
    return {
        teleport: vi.fn(),
        remove: vi.fn(),
        selectedSlotIndex: 0,
        location: { x: 0, y: 64, z: 0 },
        dimension: { id: 'minecraft:overworld', getEntities: vi.fn(() => []) },
        getGameMode: vi.fn(() => 'Survival'),
        getComponent: vi.fn(type => {
            if (type === EntityComponentTypes.Inventory) return { container }
            if (type === EntityComponentTypes.Equippable) return equippable
            return undefined
        }),
        navigateToLocation: vi.fn(), navigateToEntity: vi.fn(), navigateToBlock: vi.fn(),
        moveRelative: vi.fn(), stopMoving: vi.fn(),
        lookAtBlock: vi.fn(), lookAtEntity: vi.fn(), lookAtLocation: vi.fn(), setRotation: vi.fn(),
        stopBuild: vi.fn(), stopInteracting: vi.fn(), stopBreakingBlock: vi.fn(),
        stopUsingItem: vi.fn(), stopSwimming: vi.fn(), stopGliding: vi.fn(),
        headRotation: { x: 0, y: 0 },
        isSprinting: false,
        isSneaking: false,
        attack: vi.fn(),
        interact: vi.fn(),
        useItemInSlot: vi.fn(),
        dropSelectedItem: vi.fn(),
        jump: vi.fn(),
        startBuild: vi.fn(),
        breakBlock: vi.fn(),
        getBlockFromViewDirection: vi.fn(() => undefined),
        ...overrides,
    }
}

export const spawnSimulatedPlayer = vi.fn((...args) => makeSimulatedPlayer(...args))
