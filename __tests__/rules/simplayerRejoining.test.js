import { vi, describe, it, expect, beforeEach } from 'vitest'
import { system, world } from '@minecraft/server'
import { simplayerRejoining } from '../../packs/BP/scripts/rules/simplayerRejoining.js'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { advanceTicks, dynamicPropertyStore, resetScheduler } from '@forestoflight/minecraft-vitest-mocks/server'

describe('SimplayerRejoining', () => {
    beforeEach(() => {
        vi.clearAllMocks()
    })

    describe('construction', () => {
        it('has identifier simplayerRejoining', () => {
            expect(simplayerRejoining.getID()).toBe('simplayerRejoining')
        })

        it('defaults to false', () => {
            expect(simplayerRejoining.getDefaultValue()).toBe(false)
        })

        it('subscribes to events on enable', () => {
            const spy = vi.spyOn(simplayerRejoining, 'subscribeToEvent').mockImplementation(() => {})
            simplayerRejoining.onEnable()
            expect(spy).toHaveBeenCalled()
        })

        it('unsubscribes from events on disable', () => {
            const spy = vi.spyOn(simplayerRejoining, 'unsubscribeFromEvent').mockImplementation(() => {})
            simplayerRejoining.onDisable()
            expect(spy).toHaveBeenCalled()
        })
    })

    describe('subscribeToEvent', () => {
        it('subscribes onShutdownBound to system.beforeEvents.shutdown', () => {
            simplayerRejoining.subscribeToEvent()
            expect(system.beforeEvents.shutdown.subscribe).toHaveBeenCalledWith(simplayerRejoining.onShutdownBound)
        })
    })

    describe('unsubscribeFromEvent', () => {
        it('unsubscribes onShutdownBound from system.beforeEvents.shutdown', () => {
            simplayerRejoining.unsubscribeFromEvent()
            expect(system.beforeEvents.shutdown.unsubscribe).toHaveBeenCalledWith(simplayerRejoining.onShutdownBound)
        })
    })

    describe('onShutdown', () => {
        it('saves understudy names when enabled', () => {
            dynamicPropertyStore.set('simplayerRejoining', true)
            Understudies.create('Alice')
            Understudies.create('Bob')
            simplayerRejoining.onShutdown()
            expect(world.setDynamicProperty).toHaveBeenCalledWith(
                'simplayersToRejoin',
                JSON.stringify(['Alice', 'Bob'])
            )
        })

        it('saves empty array when disabled', () => {
            simplayerRejoining.onShutdown()
            expect(world.setDynamicProperty).toHaveBeenCalledWith('simplayersToRejoin', JSON.stringify([]))
        })
    })

    describe('onStartup', () => {
        beforeEach(() => {
            resetScheduler()
            Understudies.removeAll()
            vi.clearAllMocks()
            advanceTicks(1)
        })

        it('returns early without reading world state when disabled', () => {
            const spy = vi.spyOn(Understudies, 'create')
            simplayerRejoining.onStartup()
            expect(spy).not.toHaveBeenCalled()
        })

        it('creates and rejoins each saved player when enabled', () => {
            const spy = vi.spyOn(Understudies, 'create')
            dynamicPropertyStore.set('simplayerRejoining', true)
            dynamicPropertyStore.set('simplayersToRejoin', JSON.stringify(['Alice', 'Bob']))
            simplayerRejoining.onStartup()
            expect(spy).toHaveBeenCalledWith('Alice')
            expect(spy).toHaveBeenCalledWith('Bob')
        })

        it('calls addNametagPrefix via runTimeout for each player', () => {
            const spy = vi.spyOn(Understudies, 'addNametagPrefix')
            dynamicPropertyStore.set('simplayerRejoining', true)
            dynamicPropertyStore.set('simplayersToRejoin', JSON.stringify(['Alice']))
            simplayerRejoining.onStartup()
            advanceTicks(5)
            expect(spy).toHaveBeenCalledWith(Understudies.get('Alice'))
        })

        it('logs an error and continues when rejoin throws', () => {
            const mockPlayer = { rejoin: vi.fn().mockImplementation(() => { throw new Error('network error') }) }
            vi.spyOn(Understudies, 'create').mockReturnValue(mockPlayer)
            dynamicPropertyStore.set('simplayerRejoining', true)
            dynamicPropertyStore.set('simplayersToRejoin', JSON.stringify(['Alice']))
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            simplayerRejoining.onStartup()

            expect(consoleSpy).toHaveBeenCalled()
        })

        it('logs an error and rejoins nobody when saved data is invalid JSON', () => {
            dynamicPropertyStore.set('simplayerRejoining', true)
            world.getDynamicProperty.mockImplementation((key) => {
                if (key === 'simplayerRejoining') return JSON.stringify(true)
                if (key === 'simplayersToRejoin') return 'not-valid-json'
            })
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
            vi.spyOn(Understudies, 'create')
            simplayerRejoining.onStartup()
            expect(consoleSpy).toHaveBeenCalled()
            expect(Understudies.create).not.toHaveBeenCalled()
        })

        it('rejoins nobody when saved data is corrupted', () => {
            dynamicPropertyStore.set('simplayerRejoining', true)
            dynamicPropertyStore.set('simplayersToRejoin', 'invalid data')
            vi.spyOn(Understudies, 'create')
            simplayerRejoining.onStartup()
            expect(Understudies.create).not.toHaveBeenCalled()
        })
    })
})
