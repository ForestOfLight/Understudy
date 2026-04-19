import { vi } from 'vitest'
import { EntityComponentTypes } from '@minecraft/server'
import { Container, Player } from './server'

export function makeEquippable(items = {}) {
    return {
        getEquipment: vi.fn(slot => items[slot]),
        setEquipment: vi.fn(),
    }
}

export class SimulatedPlayer extends Player {
    #container = new Container()
    #equippable = makeEquippable()

    headRotation = { x: 0, y: 0 }

    navigateToLocation = vi.fn()
    navigateToEntity = vi.fn()
    navigateToBlock = vi.fn()
    moveRelative = vi.fn()
    stopMoving = vi.fn()
    lookAtBlock = vi.fn()
    lookAtEntity = vi.fn()
    lookAtLocation = vi.fn()
    stopBuild = vi.fn()
    stopInteracting = vi.fn()
    stopBreakingBlock = vi.fn()
    stopUsingItem = vi.fn()
    stopSwimming = vi.fn()
    stopGliding = vi.fn()
    attack = vi.fn()
    interact = vi.fn()
    useItemInSlot = vi.fn()
    dropSelectedItem = vi.fn()
    jump = vi.fn()
    startBuild = vi.fn()
    breakBlock = vi.fn()
    getComponent = vi.fn((type) => {
        if (type === EntityComponentTypes.Inventory) return { container: this.#container }
        if (type === EntityComponentTypes.Equippable) return this.#equippable
        return void 0
    })
}

export const spawnSimulatedPlayer = vi.fn(() => new SimulatedPlayer())
