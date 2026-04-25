import { vi, describe, it, expect, beforeAll } from 'vitest'
import { advanceTicks } from '@forestoflight/minecraft-vitest-mocks/server'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { sneakCommand } from '../../packs/BP/scripts/commands/sneak.js'
import { CustomCommandStatus, world } from '@minecraft/server'

describe('SneakCommand', () => {
    let understudy

    beforeAll(() => {
        understudy = Understudies.create('TestBot')
        understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension('overworld') })
    })

    describe('customCommand.callback', () => {
        it('delegates to sprintCommand', () => {
            const spy = vi.spyOn(sneakCommand, 'sprintCommand')
            sneakCommand.customCommand.callback({}, 'TestBot', true)
            expect(spy).toHaveBeenCalledWith({}, 'TestBot', true)
        })
    })

    describe('sprintCommand', () => {
        it('returns failure when the understudy is not online', () => {
            const result = sneakCommand.sprintCommand({}, 'OfflineBot', true)
            expect(result.status).toBe(CustomCommandStatus.Failure)
        })

        it.each([true, false])('schedules sneak(%s) when shouldSneak is %s', (shouldSneak) => {
            const spy = vi.spyOn(understudy, 'sneak')
            sneakCommand.sprintCommand({}, 'TestBot', shouldSneak)
            advanceTicks(1)
            expect(spy).toHaveBeenCalledWith(shouldSneak)
        })

        it('returns success on success', () => {
            const result = sneakCommand.sprintCommand({}, 'TestBot', true)
            expect(result.status).toBe(CustomCommandStatus.Success)
        })
    })
})
