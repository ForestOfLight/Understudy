import { vi, describe, it, expect, beforeEach } from 'vitest'
import { world, EntityComponentTypes, EquipmentSlot } from '@minecraft/server'
import { makeSimulatedPlayer, makeContainer, makeEquippable } from '@minecraft/server-gametest'

const { UnderstudyInventory } = await import('../../packs/BP/scripts/classes/UnderstudyInventory.js')
const { default: Understudy } = await import('../../packs/BP/scripts/classes/Understudy.js')

const mockDimension = { runCommand: vi.fn(), fillBlocks: vi.fn(), getEntities: vi.fn(() => []), spawnItem: vi.fn() }

describe('UnderstudyInventory', () => {
    let understudy, inventory

    beforeEach(() => {
        world.getDimension.mockReturnValue(mockDimension)
        understudy = new Understudy('TestBot')
        understudy.#simulatedPlayer = makeSimulatedPlayer()
        inventory = new UnderstudyInventory(understudy)
    })

    describe('constructor', () => {
        it('sets inventory dynamic property key based on player name', () => {
            expect(inventory.inventoryDP).toBe('bot_TestBot_inventory')
        })

        it('sets equippable dynamic property key based on player name', () => {
            expect(inventory.equippableDP).toBe('bot_TestBot_equippable')
        })

        it('truncates player name to 8 characters in the table name', () => {
            const inv = new UnderstudyInventory(new Understudy('LongNamedPlayer'))
            expect(inv.inventoryDP).toBe('bot_LongName_inventory')
        })
    })

    describe('saveItemsWithoutNBT', () => {
        it('serializes items and writes to world dynamic property', () => {
            inventory.saveItemsWithoutNBT('test_dp', { 0: { typeId: 'minecraft:stone', amount: 1 } })
            expect(world.setDynamicProperty).toHaveBeenCalledWith(
                'test_dp',
                JSON.stringify({ 0: { typeId: 'minecraft:stone', amount: 1 } })
            )
        })

        it('excludes undefined or null entries from the serialized output', () => {
            inventory.saveItemsWithoutNBT('test_dp', { 0: undefined, 1: { typeId: 'minecraft:stone', amount: 1 } })
            const saved = JSON.parse(world.setDynamicProperty.mock.calls[0][1])
            expect(saved['0']).toBeUndefined()
            expect(saved['1']).toEqual({ typeId: 'minecraft:stone', amount: 1 })
        })
    })

    describe('saveItemsWithNBT', () => {
        it('calls itemDatabase.setItems with non-undefined item values', () => {
            const spy = vi.spyOn(inventory.itemDatabase, 'setItems')
            const items = { 0: { typeId: 'minecraft:stone', amount: 1 }, 1: undefined }
            inventory.saveItemsWithNBT('inv', items)
            expect(spy).toHaveBeenCalledWith('inv', [{ typeId: 'minecraft:stone', amount: 1 }])
        })
    })

    describe('save', () => {
        it('calls saveInventoryItems and saveEquippableItems with saveNBT true', () => {
            const invSpy = vi.spyOn(inventory, 'saveInventoryItems')
            const equSpy = vi.spyOn(inventory, 'saveEquippableItems')
            inventory.save()
            expect(invSpy).toHaveBeenCalledWith({ saveNBT: true })
            expect(equSpy).toHaveBeenCalledWith({ saveNBT: true })
        })
    })

    describe('saveWithoutNBT', () => {
        it('calls saveInventoryItems and saveEquippableItems with saveNBT false', () => {
            const invSpy = vi.spyOn(inventory, 'saveInventoryItems')
            const equSpy = vi.spyOn(inventory, 'saveEquippableItems')
            inventory.saveWithoutNBT()
            expect(invSpy).toHaveBeenCalledWith({ saveNBT: false })
            expect(equSpy).toHaveBeenCalledWith({ saveNBT: false })
        })
    })

    describe('saveInventoryItems', () => {
        it('writes inventory to the inventory dynamic property', () => {
            inventory.saveInventoryItems({ saveNBT: false })
            expect(world.setDynamicProperty).toHaveBeenCalledWith('bot_TestBot_inventory', expect.any(String))
        })

        it('calls itemDatabase.setItems when saveNBT is true', () => {
            const spy = vi.spyOn(inventory.itemDatabase, 'setItems')
            inventory.saveInventoryItems({ saveNBT: true })
            expect(spy).toHaveBeenCalled()
        })

        it('does not call itemDatabase.setItems when saveNBT is false', () => {
            const spy = vi.spyOn(inventory.itemDatabase, 'setItems')
            inventory.saveInventoryItems({ saveNBT: false })
            expect(spy).not.toHaveBeenCalled()
        })
    })

    describe('saveEquippableItems', () => {
        it('writes equippable data to the equippable dynamic property', () => {
            inventory.saveEquippableItems({ saveNBT: false })
            expect(world.setDynamicProperty).toHaveBeenCalledWith('bot_TestBot_equippable', expect.any(String))
        })
    })

    describe('loadInventoryItems', () => {
        it('returns early when no saved data exists', () => {
            world.getDynamicProperty.mockReturnValue(undefined)
            const container = makeContainer({ size: 1 })
            understudy.simulatedPlayer = makeSimulatedPlayer({ container })
            inventory = new UnderstudyInventory(understudy)
            inventory.loadInventoryItems()
            expect(container.setItem).not.toHaveBeenCalled()
        })

        it('sets items in inventory container from saved data', () => {
            const container = makeContainer({ size: 1 })
            understudy.simulatedPlayer = makeSimulatedPlayer({ container })
            inventory = new UnderstudyInventory(understudy)
            world.getDynamicProperty.mockImplementation(key =>
                key === 'bot_TestBot_inventory'
                    ? JSON.stringify({ 0: { typeId: 'minecraft:stone', amount: 1 } })
                    : undefined
            )
            vi.spyOn(inventory.itemDatabase, 'getItems').mockReturnValue([{ typeId: 'minecraft:stone', amount: 1 }])
            inventory.loadInventoryItems()
            expect(container.setItem).toHaveBeenCalledTimes(1)
        })

        it('calls setItem with undefined when item is absent from both databases', () => {
            const container = makeContainer({ size: 1 })
            understudy.simulatedPlayer = makeSimulatedPlayer({ container })
            inventory = new UnderstudyInventory(understudy)
            world.getDynamicProperty.mockImplementation(key =>
                key === 'bot_TestBot_inventory'
                    ? JSON.stringify({ 0: { typeId: 'minecraft:stone', amount: 1 } })
                    : undefined
            )
            vi.spyOn(inventory.itemDatabase, 'getItems').mockReturnValue([])
            inventory.loadInventoryItems()
            expect(container.setItem).toHaveBeenCalledWith(0, undefined)
        })
    })

    describe('loadEquippableItems', () => {
        it('returns early when no saved equippable data exists', () => {
            world.getDynamicProperty.mockReturnValue(undefined)
            const equippable = makeEquippable()
            understudy.simulatedPlayer = makeSimulatedPlayer({ equippable })
            inventory = new UnderstudyInventory(understudy)
            inventory.loadEquippableItems()
            expect(equippable.setEquipment).not.toHaveBeenCalled()
        })

        it('calls setEquipment for each slot in EquipmentSlot', () => {
            const equippable = makeEquippable()
            understudy.simulatedPlayer = makeSimulatedPlayer({ equippable })
            inventory = new UnderstudyInventory(understudy)
            const savedData = Object.fromEntries(Object.keys(EquipmentSlot).map(slot => [slot, null]))
            world.getDynamicProperty.mockImplementation(key =>
                key === 'bot_TestBot_equippable' ? JSON.stringify(savedData) : undefined
            )
            vi.spyOn(inventory.itemDatabase, 'getItems').mockReturnValue([])
            inventory.loadEquippableItems()
            expect(equippable.setEquipment).toHaveBeenCalledTimes(Object.keys(EquipmentSlot).length)
        })
    })
})
