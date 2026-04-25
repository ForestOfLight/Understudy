import { vi, describe, it, expect, beforeEach } from 'vitest'
import { world, system, EntityComponentTypes, TicksPerSecond } from '@minecraft/server'
import { PlayerInfoSaver } from '../../packs/BP/scripts/classes/PlayerInfoSaver.js'
import Understudy from '../../packs/BP/scripts/classes/Understudy.js'
import { UnderstudySaveInfoError } from '../../packs/BP/scripts/errors/UnderstudySaveInfoError.js'
import { dynamicPropertyStore } from '@forestoflight/minecraft-vitest-mocks/server'
import { UnderstudyNotConnectedError } from '../../packs/BP/scripts/errors/UnderstudyNotConnectedError.js'

describe('PlayerInfoSaver', () => {
    let understudy
    let infoSaver
    beforeEach(() => {
        vi.clearAllMocks()
        system.currentTick = 0
        understudy = new Understudy('TestBot')
        understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension("minecraft:overworld") })
        infoSaver = new PlayerInfoSaver(understudy)
        dynamicPropertyStore.set('noSimplayerSaving', false)
    })

    describe('get', () => {
        beforeEach(() => {
            vi.clearAllMocks()
        })

        it('throws when noSimplayerSaving is enabled', () => {
            dynamicPropertyStore.set('noSimplayerSaving', true)
            expect(() => infoSaver.get()).toThrow(UnderstudySaveInfoError)
        })

        it('throws when no player info has been saved', () => {
            dynamicPropertyStore.set('TestBot:playerinfo', undefined)
            expect(() => infoSaver.get()).toThrow(UnderstudySaveInfoError)
        })

        it('throws when player info is corrupted', () => {
            dynamicPropertyStore.set('TestBot:playerinfo', 'this is not valid json')
            expect(() => infoSaver.get()).toThrow(UnderstudySaveInfoError)
        })

        it('returns parsed player info when data exists', () => {
            const playerInfo = {
                location: { x: 0, y: 64, z: 0 }, rotation: { x: 0, y: 0 },
                dimensionId: 'minecraft:overworld', gameMode: 'Survival', projectileIds: [],
            }
            dynamicPropertyStore.set('TestBot:playerinfo', JSON.stringify(playerInfo))
            expect(infoSaver.get()).toEqual(playerInfo)
        })

        it('throws an error when something undefined happens', () => {
            const original = world.getDynamicProperty;
            vi.spyOn(world, 'getDynamicProperty').mockImplementation((key, value) => { 
                if (key === 'TestBot:playerinfo')
                    throw new Error('Unexpected error')
                else
                    return original.call(world, key, value)
            })
            expect(() => infoSaver.get()).toThrow(Error)
        })
    })

    describe('save', () => {
        beforeEach(() => {
            vi.clearAllMocks()
        })

        it('throws an error when the understudy is not connected', () => {
            understudy.leave()
            expect(() => infoSaver.save()).toThrow(UnderstudyNotConnectedError)
        })

        it('does not save when noSimplayerSaving is enabled', () => {
            dynamicPropertyStore.set('noSimplayerSaving', true) 
            infoSaver.save()
            expect(world.setDynamicProperty).not.toHaveBeenCalledWith('TestBot:playerinfo', expect.any(String))
        })

        it('writes player info to the dynamic property when connected', () => {
            infoSaver.save()
            expect(world.setDynamicProperty).toHaveBeenCalledWith('TestBot:playerinfo', expect.any(String))
        })

        it('saves player info data', () => {
            infoSaver.save()
            const call = world.setDynamicProperty.mock.calls.find(c => c[0] === 'TestBot:playerinfo')
            const saved = JSON.parse(call[1])
            expect(saved).toBeDefined()
        })

        it('saves projectile ids owned by the understudy', () => {
            const projectile = { id: 'proj1', getComponent: vi.fn().mockReturnValue({ owner: understudy.simulatedPlayer }) }
            world.getDimension.mockReturnValueOnce({
                getEntities: vi.fn(() => [projectile])
            })
            infoSaver.save()
            const call = world.setDynamicProperty.mock.calls.find(c => c[0] === 'TestBot:playerinfo')
            const saved = JSON.parse(call[1])
            expect(saved.projectileIds).toContain('proj1')
        })
    })

    describe('loadInventoryAndProjectileOwnership', () => {
        it('throws when noSimplayerSaving is enabled', () => {
            dynamicPropertyStore.set('noSimplayerSaving', true)
            expect(() => infoSaver.loadInventoryAndProjectileOwnership()).toThrow(UnderstudySaveInfoError)
        })

        it('loads player inventory when data exists', () => {
            const playerInfo = {
                location: { x: 1, y: 64, z: 2 }, rotation: { x: 0, y: 90 },
                dimensionId: 'minecraft:overworld', gameMode: 'Creative', projectileIds: [],
            }
            dynamicPropertyStore.set('TestBot:playerinfo', JSON.stringify(playerInfo))
            dynamicPropertyStore.set('bot_TestBot_inventory', JSON.stringify({ 0: { typeId: 'minecraft:stone', amount: 1 } }))
            infoSaver.loadInventoryAndProjectileOwnership()
            expect(understudy.getInventory().setItem).toHaveBeenCalled()
        })

        it('loads claimed projectiles when data exists', () => {
            const projectile = { id: 'proj1', getComponent: vi.fn().mockReturnValue({ owner: void 0 }) }
            world.getEntity.mockImplementation(id => id === 'proj1' ? projectile : void 0)
            const playerInfo = {
                location: { x: 1, y: 64, z: 2 }, rotation: { x: 0, y: 90 },
                dimensionId: 'minecraft:overworld', gameMode: 'Creative', projectileIds: ['proj1'],
            }
            dynamicPropertyStore.set('TestBot:playerinfo', JSON.stringify(playerInfo))
            infoSaver.loadInventoryAndProjectileOwnership()
            expect(projectile.getComponent(EntityComponentTypes.Projectile).owner).toBe(understudy.simulatedPlayer)
        })
    })

    describe('onConnectedTick', () => {
        beforeEach(() => {
            vi.clearAllMocks()
            system.currentTick = 0
        })

        it('does nothing when noSimplayerSaving is enabled', () => {
            dynamicPropertyStore.set('noSimplayerSaving', true)
            infoSaver.onConnectedTick()
            expect(world.setDynamicProperty).not.toHaveBeenCalledWith('TestBot:playerinfo', expect.any(String))
        })

        it('saves when elapsed ticks is a multiple of saveInterval', () => {
            system.currentTick = infoSaver.saveInterval
            infoSaver.onConnectedTick()
            expect(world.setDynamicProperty).toHaveBeenCalledWith('TestBot:playerinfo', expect.any(String))
        })

        it('does not save playerinfo when elapsed ticks is not a multiple of saveInterval', () => {
            system.currentTick = infoSaver.saveInterval - 1
            infoSaver.onConnectedTick()
            expect(world.setDynamicProperty).not.toHaveBeenCalledWith('TestBot:playerinfo', expect.anything())
        })

        it('saves inventory with NBT every 5 seconds when the player has repeating actions', () => {
            system.currentTick = TicksPerSecond * 5
            understudy.actions.repeat('attack')
            const spy = vi.spyOn(infoSaver, 'save')
            infoSaver.onConnectedTick()
            expect(spy).toHaveBeenCalled()
        })

        it('saves inventory without NBT on off-ticks when player has repeating actions', () => {
            system.currentTick = TicksPerSecond * 5 - 1
            understudy.actions.repeat('attack')
            infoSaver.onConnectedTick()
            expect(world.setDynamicProperty).toHaveBeenCalledWith('bot_TestBot_inventory', expect.any(String))
        })
    })
})
