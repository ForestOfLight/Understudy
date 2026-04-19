import { vi, describe, it, expect, beforeAll } from 'vitest'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { CustomCommandStatus, world } from '@minecraft/server'
import { Container } from '../../__mocks__/@minecraft/server.js'
import { inventoryCommand } from '../../packs/BP/scripts/commands/inventory.js'

describe('InventoryCommand', () => {
    let understudy

    beforeAll(() => {
        understudy = Understudies.create('TestBot')
        understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension('minecraft:overworld') })
    })

    describe('customCommand.callback', () => {
        it('delegates to inventoryCommand', () => {
            const spy = vi.spyOn(inventoryCommand, 'inventoryCommand')
            inventoryCommand.customCommand.callback({}, 'TestBot')
            expect(spy).toHaveBeenCalledWith({}, 'TestBot')
        })
    })

    describe('inventoryCommand', () => {
        it('returns failure when the understudy is not online', () => {
            const result = inventoryCommand.inventoryCommand({}, 'OfflineBot')
            expect(result.status).toBe(CustomCommandStatus.Failure)
        })

        it('returns success with an inventory message when understudy exists', () => {
            const result = inventoryCommand.inventoryCommand({}, 'TestBot')
            expect(result.status).toBe(CustomCommandStatus.Success)
        })

        it('returns an error message when the inventory is not found', () => {
            vi.spyOn(understudy, 'getInventory').mockReturnValue(void 0)
            const result = inventoryCommand.inventoryCommand({}, 'TestBot')
            expect(result.message).toContain('No inventory found')
        })

        it('returns an empty message when the inventory is empty', () => {
            const mockInventory = new Container(36)
            vi.spyOn(understudy, 'getInventory').mockReturnValue(mockInventory)
            const result = inventoryCommand.inventoryCommand({}, 'TestBot')
            expect(result.message).toContain("TestBot's inventory is empty")
        })

        it('returns a formatted message when the inventory has items', () => {
            const itemStack = { typeId: 'minecraft:stone', amount: 5 }
            const mockInventory = new Container(36)
            mockInventory.setItem(0, itemStack)
            vi.spyOn(understudy, 'getInventory').mockReturnValue(mockInventory)
            const result = inventoryCommand.inventoryCommand({}, 'TestBot')
            expect(result.message).toContain('minecraft:stone')
            expect(result.message).toContain('x5')
        })

        it('colors hotbar slots with §a and non-hotbar slots with §7', () => {
            const hotbarItem = { typeId: 'minecraft:stone', amount: 1 }
            const nonHotbarItem = { typeId: 'minecraft:dirt', amount: 1 }
            const mockInventory = new Container(36)
            mockInventory.setItem(0, hotbarItem)
            mockInventory.setItem(10, nonHotbarItem)
            vi.spyOn(understudy, 'getInventory').mockReturnValue(mockInventory)
            const result = inventoryCommand.inventoryCommand({}, 'TestBot')
            expect(result.message).toContain('§a0')
            expect(result.message).toContain('10§7')
        })
    })
})
