import { vi, describe, it, expect, beforeEach } from 'vitest'
import { world, system, DimensionTypes, EntityComponentTypes } from '@minecraft/server'
import { makeSimulatedPlayer } from '@minecraft/server-gametest'
import { PlayerInfoSaver } from '../../packs/BP/scripts/classes/PlayerInfoSaver.js'
import Understudy from '../../packs/BP/scripts/classes/Understudy.js'

describe('PlayerInfoSaver', () => {
    let understudy, saver

    beforeEach(() => {
        DimensionTypes.getAll.mockReturnValue([])
        system.currentTick = 0
        understudy = new Understudy('TestBot')
        understudy.#simulatedPlayer = makeSimulatedPlayer()
        understudy.#isConnected = true
        saver = new PlayerInfoSaver(understudy)
    })

    describe('get', () => {
        it('throws when noSimplayerSaving is enabled', () => {
            world.getDynamicProperty.mockImplementation(key =>
                key === 'noSimplayerSaving' ? JSON.stringify(true) : undefined
            )
            expect(() => saver.get()).toThrow()
        })

        it('throws when no player info has been saved', () => {
            world.getDynamicProperty.mockReturnValue(undefined)
            expect(() => saver.get()).toThrow()
        })

        it('returns parsed player info when data exists', () => {
            const playerInfo = {
                location: { x: 0, y: 64, z: 0 }, rotation: { x: 0, y: 0 },
                dimensionId: 'minecraft:overworld', gameMode: 'Survival', projectileIds: [],
            }
            world.getDynamicProperty.mockImplementation(key =>
                key === 'TestBot:playerinfo' ? JSON.stringify(playerInfo) : undefined
            )
            expect(saver.get()).toEqual(playerInfo)
        })
    })

    describe('save', () => {
        it('does not save when simulatedPlayer is null', () => {
            understudy.simulatedPlayer = null
            saver.save()
            expect(world.setDynamicProperty).not.toHaveBeenCalledWith('TestBot:playerinfo', expect.anything())
        })

        it('does not save when player is not connected', () => {
            understudy.isConnected = false
            saver.save()
            expect(world.setDynamicProperty).not.toHaveBeenCalledWith('TestBot:playerinfo', expect.anything())
        })

        it('does not save when noSimplayerSaving is enabled', () => {
            world.getDynamicProperty.mockImplementation(key =>
                key === 'noSimplayerSaving' ? JSON.stringify(true) : undefined
            )
            saver.save()
            expect(world.setDynamicProperty).not.toHaveBeenCalledWith('TestBot:playerinfo', expect.anything())
        })

        it('writes player info to the dynamic property when connected', () => {
            saver.save()
            expect(world.setDynamicProperty).toHaveBeenCalledWith('TestBot:playerinfo', expect.any(String))
        })

        it('saved data includes location, rotation, dimensionId, gameMode, projectileIds', () => {
            saver.save()
            const call = world.setDynamicProperty.mock.calls.find(c => c[0] === 'TestBot:playerinfo')
            const saved = JSON.parse(call[1])
            expect(saved).toMatchObject({
                location: expect.any(Object),
                rotation: expect.any(Object),
                dimensionId: expect.any(String),
                gameMode: expect.any(String),
                projectileIds: expect.any(Array),
            })
        })
    })

    describe('load', () => {
        it('returns undefined when noSimplayerSaving is enabled', () => {
            world.getDynamicProperty.mockImplementation(key =>
                key === 'noSimplayerSaving' ? JSON.stringify(true) : undefined
            )
            expect(saver.load()).toBeUndefined()
        })

        it('returns undefined when no player info exists', () => {
            world.getDynamicProperty.mockReturnValue(undefined)
            expect(saver.load()).toBeUndefined()
        })

        it('returns the loaded player info when data exists', () => {
            const playerInfo = {
                location: { x: 1, y: 64, z: 2 }, rotation: { x: 0, y: 90 },
                dimensionId: 'minecraft:overworld', gameMode: 'Creative', projectileIds: [],
            }
            world.getDynamicProperty.mockImplementation(key =>
                key === 'TestBot:playerinfo' ? JSON.stringify(playerInfo) : undefined
            )
            expect(saver.load()).toEqual(playerInfo)
        })
    })

    describe('saveOnInterval', () => {
        it('skips when noSimplayerSaving is enabled', () => {
            world.getDynamicProperty.mockImplementation(key =>
                key === 'noSimplayerSaving' ? JSON.stringify(true) : undefined
            )
            saver.saveOnInterval()
            expect(world.setDynamicProperty).not.toHaveBeenCalledWith('TestBot:playerinfo', expect.anything())
        })

        it('saves when elapsed ticks is a multiple of saveInterval (600)', () => {
            system.currentTick = 600
            saver.saveOnInterval()
            expect(world.setDynamicProperty).toHaveBeenCalledWith('TestBot:playerinfo', expect.any(String))
        })

        it('does not save playerinfo when elapsed ticks is not a multiple of saveInterval', () => {
            system.currentTick = 100
            saver.saveOnInterval()
            expect(world.setDynamicProperty).not.toHaveBeenCalledWith('TestBot:playerinfo', expect.anything())
        })

        it('saves inventory without NBT on off-ticks when player has repeating actions', () => {
            system.currentTick = 1
            vi.spyOn(understudy, 'hasRepeatingAction').mockReturnValue(true)
            saver.saveOnInterval()
            expect(world.setDynamicProperty).toHaveBeenCalledWith('bot_TestBot_inventory', expect.any(String))
        })
    })
})
