import { vi, describe, it, expect, beforeEach } from 'vitest'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { advanceTicks } from '@forestoflight/minecraft-vitest-mocks/server'
import { world } from '@minecraft/server'
import { actionCommand, REPEATABLE_ACTIONS, TIMING_OPTIONS } from '../../packs/BP/scripts/commands/action.js'

describe('ActionCommand', () => {
    let understudy
    let actions

    beforeEach(() => {
        Understudies.removeAll()
        advanceTicks(1)
        understudy = Understudies.create('TestBot')
        understudy.join({ location: { x: 0, y: 0, z: 0 }, dimension: world.getDimension('overworld') })
        actions = understudy.actions
    })

    describe('customCommand.callback', () => {
        it('delegates to actionCommand', () => {
            const spy = vi.spyOn(actionCommand, 'actionCommand')
            actionCommand.customCommand.callback({}, 'TestBot', REPEATABLE_ACTIONS.ATTACK)
            expect(spy).toHaveBeenCalledWith({}, 'TestBot', REPEATABLE_ACTIONS.ATTACK)
        })
    })

    describe('actionCommand', () => {
        it('returns failure when the understudy is not online', () => {
            vi.spyOn(Understudies, 'get').mockReturnValue(void 0)
            const result = actionCommand.actionCommand({}, 'TestBot', REPEATABLE_ACTIONS.ATTACK)
            expect(result).toBeDefined()
            expect(result.message).toContain('TestBot')
        })

        it('returns failure for an invalid action type', () => {
            vi.spyOn(Understudies, 'get').mockReturnValue(understudy)
            const result = actionCommand.actionCommand({}, 'TestBot', 'invalid_action')
            expect(result).toBeDefined()
            expect(result.message).toContain('invalid_action')
        })

        it('calls actions.once for ONCE timing (default)', () => {
            vi.spyOn(actions, 'once')
            actionCommand.actionCommand({}, 'TestBot', REPEATABLE_ACTIONS.ATTACK)
            expect(actions.once).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK)
        })

        it('calls actions.once for explicit ONCE timing', () => {
            vi.spyOn(actions, 'once')
            actionCommand.actionCommand({}, 'TestBot', REPEATABLE_ACTIONS.INTERACT, TIMING_OPTIONS.ONCE)
            expect(actions.once).toHaveBeenCalledWith(REPEATABLE_ACTIONS.INTERACT)
        })

        it('calls actions.repeat for CONTINUOUS timing', () => {
            vi.spyOn(actions, 'repeat')
            actionCommand.actionCommand({}, 'TestBot', REPEATABLE_ACTIONS.JUMP, TIMING_OPTIONS.CONTINUOUS)
            expect(actions.repeat).toHaveBeenCalledWith(REPEATABLE_ACTIONS.JUMP)
        })

        it('calls actions.remove for STOP timing', () => {
            vi.spyOn(actions, 'remove')
            actionCommand.actionCommand({}, 'TestBot', REPEATABLE_ACTIONS.ATTACK, TIMING_OPTIONS.STOP)
            expect(actions.remove).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK)
        })

        it('returns failure for AFTER timing when ticks is not provided', () => {
            const result = actionCommand.actionCommand({}, 'TestBot', REPEATABLE_ACTIONS.ATTACK, TIMING_OPTIONS.AFTER, void 0)
            expect(result).toBeDefined()
            expect(result.message).toContain('after')
        })

        it('calls actions.once with ticks for AFTER timing', () => {
            vi.spyOn(actions, 'once')
            actionCommand.actionCommand({}, 'TestBot', REPEATABLE_ACTIONS.ATTACK, TIMING_OPTIONS.AFTER, 20)
            expect(actions.once).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK, 20)
        })

        it('returns failure for INTERVAL timing when ticks is not provided', () => {
            const result = actionCommand.actionCommand({}, 'TestBot', REPEATABLE_ACTIONS.ATTACK, TIMING_OPTIONS.INTERVAL, void 0)
            expect(result).toBeDefined()
            expect(result.message).toContain('interval')
        })

        it('calls actions.repeat with ticks for INTERVAL timing', () => {
            vi.spyOn(actions, 'repeat')
            actionCommand.actionCommand({}, 'TestBot', REPEATABLE_ACTIONS.ATTACK, TIMING_OPTIONS.INTERVAL, 10)
            expect(actions.repeat).toHaveBeenCalledWith(REPEATABLE_ACTIONS.ATTACK, 10)
        })

        it('returns failure for an unrecognized timing option', () => {
            const result = actionCommand.actionCommand({}, 'TestBot', REPEATABLE_ACTIONS.ATTACK, 'invalid_timing')
            expect(result).toBeDefined()
            expect(result.message).toContain('invalid_timing')
        })
    })
})
