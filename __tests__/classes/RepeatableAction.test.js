import { vi, describe, it, expect, beforeEach } from 'vitest'
import { system, EntityComponentTypes, world } from '@minecraft/server'
import { makeSimulatedPlayer, makeContainer } from '@minecraft/server-gametest'
import { RepeatableAction } from '../../packs/BP/scripts/classes/RepeatableAction.js'
import { REPEATABLE_ACTIONS } from '../../packs/BP/scripts/commands/action.js'
import Understudy from '../../packs/BP/scripts/classes/Understudy.js'

function understudyJoin(simulatedPlayerOverrides = {}) {
    const u = new Understudy('TestBot')
    u.join({ location: { x: 0, y: 64, z: 0 }, dimensionId: world.getDimension() })
    u.#simulatedPlayer = { ...u.#simulatedPlayer, ...simulatedPlayerOverrides }
    return u
}

describe('RepeatableAction', () => {
    beforeEach(() => {
        system.currentTick = 0
    })

    describe('constructor', () => {
        it('stores understudy, type, intervalTicks, and startTick', () => {
            system.currentTick = 10
            const understudy = understudyJoin()
            const action = new RepeatableAction(understudy, 'attack', 5)
            expect(action.understudy).toBe(understudy)
            expect(action.type).toBe('attack')
            expect(action.intervalTicks).toBe(5)
            expect(action.startTick).toBe(10)
        })

        it('defaults intervalTicks to 0', () => {
            const action = new RepeatableAction(understudyJoin(), 'attack')
            expect(action.intervalTicks).toBe(0)
        })
    })

    describe('setInterval', () => {
        it('updates intervalTicks', () => {
            const action = new RepeatableAction(understudyJoin(), 'attack', 5)
            action.setInterval(20)
            expect(action.intervalTicks).toBe(20)
        })
    })

    describe('isActionTick', () => {
        it('always returns true when intervalTicks is 0', () => {
            const action = new RepeatableAction(understudyJoin(), 'attack', 0)
            system.currentTick = 7
            expect(action.isActionTick()).toBe(true)
        })

        it('returns true when elapsed ticks is a multiple of interval', () => {
            system.currentTick = 0
            const action = new RepeatableAction(understudyJoin(), 'attack', 5)
            system.currentTick = 5
            expect(action.isActionTick()).toBe(true)
        })

        it('returns false when elapsed ticks is not a multiple of interval', () => {
            system.currentTick = 0
            const action = new RepeatableAction(understudyJoin(), 'attack', 5)
            system.currentTick = 3
            expect(action.isActionTick()).toBe(false)
        })
    })

    describe('onTick', () => {
        it('calls perform when isActionTick returns true', () => {
            const action = new RepeatableAction(understudyJoin(), REPEATABLE_ACTIONS.ATTACK, 0)
            action.onTick()
            expect(action.understudy.simulatedPlayer.attack).toHaveBeenCalled()
        })

        it('does not call perform when isActionTick returns false', () => {
            system.currentTick = 0
            const sp = makeSimulatedPlayer()
            const action = new RepeatableAction(understudyJoin(sp), REPEATABLE_ACTIONS.ATTACK, 5)
            system.currentTick = 3
            action.onTick()
            expect(action.understudy.simulatedPlayer.attack).not.toHaveBeenCalled()
        })
    })

    describe('perform', () => {
        it('throws when simulatedPlayer is null', () => {
            const understudy = new Understudy('TestBot')
            const action = new RepeatableAction(understudy, REPEATABLE_ACTIONS.ATTACK)
            expect(() => action.perform()).toThrow()
        })

        it('calls simulatedPlayer.attack() for ATTACK', () => {
            const action = new RepeatableAction(understudyJoin(), REPEATABLE_ACTIONS.ATTACK)
            action.perform()
            expect(action.understudy.simulatedPlayer.attack).toHaveBeenCalled()
        })

        it('calls simulatedPlayer.interact() for INTERACT', () => {
            const action = new RepeatableAction(understudyJoin(), REPEATABLE_ACTIONS.INTERACT)
            action.perform()
            expect(action.understudy.simulatedPlayer.interact).toHaveBeenCalled()
        })

        it('calls simulatedPlayer.useItemInSlot() for USE', () => {
            const action = new RepeatableAction(understudyJoin(), REPEATABLE_ACTIONS.USE)
            action.perform()
            expect(action.understudy.simulatedPlayer.useItemInSlot).toHaveBeenCalled()
        })

        it('calls simulatedPlayer.jump() for JUMP', () => {
            const action = new RepeatableAction(understudyJoin(), REPEATABLE_ACTIONS.JUMP)
            action.perform()
            expect(action.understudy.simulatedPlayer.jump).toHaveBeenCalled()
        })

        it('calls simulatedPlayer.dropSelectedItem() for DROP_STACK', () => {
            const action = new RepeatableAction(understudyJoin(), REPEATABLE_ACTIONS.DROP_STACK)
            action.perform()
            expect(action.understudy.simulatedPlayer.dropSelectedItem).toHaveBeenCalled()
        })

        it('calls console.warn for an unknown action type', () => {
            const spy = vi.spyOn(console, 'warn').mockImplementation(() => {})
            new RepeatableAction(understudyJoin(), 'unknownType').perform()
            expect(spy).toHaveBeenCalled()
        })
    })

    describe('build', () => {
        it('calls start/stopBuild on the simulated player', () => {
            const action = new RepeatableAction(understudyJoin({ selectedSlotIndex: 3 }), REPEATABLE_ACTIONS.BUILD)
            action.perform()
            expect(action.understudy.simulatedPlayer.startBuild).toHaveBeenCalled()
            expect(action.understudy.simulatedPlayer.stopBuild).toHaveBeenCalled()
        })

        it('restores selectedSlotIndex after build', () => {
            const action = new RepeatableAction(understudyJoin({ selectedSlotIndex: 3 }), REPEATABLE_ACTIONS.BUILD)
            action.perform()
            expect(action.understudy.simulatedPlayer.selectedSlotIndex).toBe(3)
        })
    })

    describe('break', () => {
        it('calls breakBlock at the looked-at block location', () => {
            const location = { x: 0, y: 64, z: 0 }
            const spOverrides = {
                getBlockFromViewDirection: vi.fn(() => ({ block: { location } })),
            }
            const action = new RepeatableAction(understudyJoin(spOverrides), REPEATABLE_ACTIONS.BREAK)
            action.perform()
            expect(action.understudy.simulatedPlayer.breakBlock).toHaveBeenCalledWith(location)
        })

        it('does nothing when not looking at a block', () => {
            const spOverrides = { getBlockFromViewDirection: vi.fn(() => undefined) }
            const action = new RepeatableAction(understudyJoin(spOverrides), REPEATABLE_ACTIONS.BREAK)
            action.perform()
            expect(action.understudy.simulatedPlayer.breakBlock).not.toHaveBeenCalled()
        })
    })

    describe('drop', () => {
        it('does nothing when the selected slot is empty', () => {
            const action = new RepeatableAction(understudyJoin(), REPEATABLE_ACTIONS.DROP)
            action.perform()
            expect(action.understudy.simulatedPlayer.dropSelectedItem).not.toHaveBeenCalled()
        })

        it('drops directly when the stack amount is 1', () => {
            const container = makeContainer()
            container.getItem.mockReturnValue({ amount: 1, typeId: 'minecraft:stone' })
            const sp = makeSimulatedPlayer()
            sp.getComponent.mockReturnValue({ container })
            const understudy = understudyJoin(sp)
            new RepeatableAction(understudy, REPEATABLE_ACTIONS.DROP).perform()
            expect(sp.dropSelectedItem).toHaveBeenCalledTimes(1)
        })

        it('splits the stack when amount is greater than 1', () => {
            const container = makeContainer()
            container.getItem.mockReturnValue({ amount: 5, typeId: 'minecraft:stone' })
            const sp = makeSimulatedPlayer()
            sp.getComponent.mockReturnValue({ container })
            const understudy = understudyJoin(sp)
            new RepeatableAction(understudy, REPEATABLE_ACTIONS.DROP).perform()
            expect(container.setItem).toHaveBeenCalledTimes(2)
            expect(sp.dropSelectedItem).toHaveBeenCalledTimes(1)
        })
    })
})
