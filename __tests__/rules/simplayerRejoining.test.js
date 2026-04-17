import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import { system, world } from '@minecraft/server'

vi.mock('../../packs/BP/scripts/classes/Understudies.js', () => ({
    default: {
        create: vi.fn(),
        addNametagPrefix: vi.fn(),
        understudies: [],
    }
}))

const { simplayerRejoining } = await import('../../packs/BP/scripts/rules/simplayerRejoining.js')
const { default: Understudies } = await import('../../packs/BP/scripts/classes/Understudies.js')

function mockDynamicProperties({ ruleEnabled = false, savedPlayers = undefined } = {}) {
    world.getDynamicProperty.mockImplementation((key) => {
        if (key === 'simplayerRejoining') return JSON.stringify(ruleEnabled)
        if (key === 'simplayersToRejoin' && savedPlayers !== undefined) return JSON.stringify(savedPlayers)
        return undefined
    })
}

describe('SimplayerRejoining', () => {
    beforeEach(() => {
        Understudies.understudies = []
        Understudies.create.mockReturnValue({ rejoin: vi.fn() })
        system.runTimeout.mockImplementation((cb) => cb())
        mockDynamicProperties()
    })

    afterEach(() => {
        vi.restoreAllMocks()
    })

    describe('construction', () => {
        it('has identifier simplayerRejoining', () => {
            expect(simplayerRejoining.getID()).toBe('simplayerRejoining')
        })

        it('defaults to false', () => {
            expect(simplayerRejoining.getDefaultValue()).toBe(false)
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
            mockDynamicProperties({ ruleEnabled: true })
            Understudies.understudies = [{ name: 'Alice' }, { name: 'Bob' }]
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
        it('returns early without reading world state when disabled', () => {
            simplayerRejoining.onStartup()
            expect(Understudies.create).not.toHaveBeenCalled()
        })

        it('creates and rejoins each saved player when enabled', () => {
            const mockPlayer = { rejoin: vi.fn() }
            Understudies.create.mockReturnValue(mockPlayer)
            mockDynamicProperties({ ruleEnabled: true, savedPlayers: ['Alice', 'Bob'] })

            simplayerRejoining.onStartup()

            expect(Understudies.create).toHaveBeenCalledWith('Alice')
            expect(Understudies.create).toHaveBeenCalledWith('Bob')
            expect(mockPlayer.rejoin).toHaveBeenCalledTimes(2)
        })

        it('calls addNametagPrefix via runTimeout for each player', () => {
            const mockPlayer = { rejoin: vi.fn() }
            Understudies.create.mockReturnValue(mockPlayer)
            mockDynamicProperties({ ruleEnabled: true, savedPlayers: ['Alice'] })

            simplayerRejoining.onStartup()

            expect(Understudies.addNametagPrefix).toHaveBeenCalledWith(mockPlayer)
        })

        it('logs an error and continues when rejoin throws', () => {
            const mockPlayer = { rejoin: vi.fn().mockImplementation(() => { throw new Error('network error') }) }
            Understudies.create.mockReturnValue(mockPlayer)
            mockDynamicProperties({ ruleEnabled: true, savedPlayers: ['Alice'] })
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            simplayerRejoining.onStartup()

            expect(consoleSpy).toHaveBeenCalled()
        })

        it('logs an error and rejoins nobody when saved data is invalid JSON', () => {
            mockDynamicProperties({ ruleEnabled: true })
            world.getDynamicProperty.mockImplementation((key) => {
                if (key === 'simplayerRejoining') return JSON.stringify(true)
                if (key === 'simplayersToRejoin') return 'not-valid-json'
            })
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

            simplayerRejoining.onStartup()

            expect(consoleSpy).toHaveBeenCalled()
            expect(Understudies.create).not.toHaveBeenCalled()
        })

        it('rejoins nobody when saved data is not an array', () => {
            mockDynamicProperties({ ruleEnabled: true, savedPlayers: { name: 'Alice' } })

            simplayerRejoining.onStartup()

            expect(Understudies.create).not.toHaveBeenCalled()
        })
    })
})
