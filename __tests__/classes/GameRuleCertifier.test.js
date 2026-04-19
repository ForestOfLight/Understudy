import { vi, describe, it, expect, beforeEach } from 'vitest'
import { system, world } from '@minecraft/server'
import { GameRuleCertifier } from '../../packs/BP/scripts/classes/GameRuleCertifier.js'

describe('GameRuleCertifier', () => {
    beforeEach(() => {
        world.gameRules = {}
    })

    describe('getGameRules', () => {
        it('returns saved dynamic property value for a known game rule', () => {
            world.gameRules = { keepInventory: false }
            world.getDynamicProperty.mockImplementation(key =>
                key === 'gamerule:keepInventory' ? true : undefined
            )
            const result = GameRuleCertifier.getGameRules()
            expect(result.keepInventory).toBe(true)
        })

        it('saves game rule to dynamic property when not yet saved', () => {
            world.gameRules = { keepInventory: false }
            world.getDynamicProperty.mockReturnValue(undefined)
            GameRuleCertifier.getGameRules()
            expect(world.setDynamicProperty).toHaveBeenCalledWith('gamerule:keepInventory', false)
        })

        it('falls back to world.gameRules value when dynamic property is undefined', () => {
            world.gameRules = { keepInventory: true }
            world.getDynamicProperty.mockReturnValue(undefined)
            const result = GameRuleCertifier.getGameRules()
            expect(result.keepInventory).toBe(true)
        })

        it('returns a map of all game rules', () => {
            world.gameRules = { keepInventory: false, mobGriefing: true }
            world.getDynamicProperty.mockReturnValue(undefined)
            const result = GameRuleCertifier.getGameRules()
            expect(Object.keys(result)).toEqual(['keepInventory', 'mobGriefing'])
        })
    })

    describe('setGameRules', () => {
        it('schedules game rule restoration via runTimeout', () => {
            GameRuleCertifier.setGameRules({})
            expect(system.runTimeout).toHaveBeenCalled()
        })

        it('updates a game rule that differs from current world state', () => {
            world.gameRules = { keepInventory: false }
            system.runTimeout.mockImplementation(cb => cb())
            vi.spyOn(console, 'info').mockImplementation(() => {})
            GameRuleCertifier.setGameRules({ keepInventory: true })
            expect(world.gameRules.keepInventory).toBe(true)
        })

        it('does not log when no rules differ', () => {
            world.gameRules = { keepInventory: true }
            system.runTimeout.mockImplementation(cb => cb())
            const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
            GameRuleCertifier.setGameRules({ keepInventory: true })
            expect(spy).not.toHaveBeenCalled()
        })

        it('logs changed rules to console.info', () => {
            world.gameRules = { keepInventory: false }
            system.runTimeout.mockImplementation(cb => cb())
            const spy = vi.spyOn(console, 'info').mockImplementation(() => {})
            GameRuleCertifier.setGameRules({ keepInventory: true })
            expect(spy).toHaveBeenCalled()
        })
    })

    describe('fixGameRules', () => {
        it('reads current rules and reapplies them', () => {
            world.gameRules = { keepInventory: false }
            world.getDynamicProperty.mockImplementation(key =>
                key === 'gamerule:keepInventory' ? true : undefined
            )
            system.runTimeout.mockImplementation(cb => cb())
            vi.spyOn(console, 'info').mockImplementation(() => {})
            GameRuleCertifier.fixGameRules()
            expect(world.gameRules.keepInventory).toBe(true)
        })
    })

    describe('onGameRuleChange', () => {
        it('sets dynamic property for changed game rule', () => {
            const event = { rule: 'keepInventory', value: true }
            GameRuleCertifier.onGameRuleChange(event)
            vi.spyOn(console, 'info').mockImplementation(() => {})
            expect(world.setDynamicProperty).toHaveBeenCalledWith('gamerule:keepInventory', true)
        })
    })
})
