import { vi, describe, it, expect, beforeAll } from 'vitest'
import { advanceTicks } from '../../__mocks__/@minecraft/server.js'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { sprintCommand } from '../../packs/BP/scripts/commands/sprint.js'
import { CustomCommandStatus, world } from '@minecraft/server'

describe('SprintCommand', () => {
    let understudy

    beforeAll(() => {
        understudy = Understudies.create('TestBot')
        understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension('overworld') })
    })

    describe('customCommand.callback', () => {
        it('delegates to sprintCommand', () => {
            const spy = vi.spyOn(sprintCommand, 'sprintCommand')
            sprintCommand.customCommand.callback({}, 'TestBot', true)
            expect(spy).toHaveBeenCalledWith({}, 'TestBot', true)
        })
    })

    describe('sprintCommand', () => {
        it('returns failure when the understudy is not online', () => {
            const result = sprintCommand.sprintCommand({}, 'OfflineBot', true)
            expect(result.status).toBe(CustomCommandStatus.Failure)
        })

        it.each([true, false])('schedules sprint(%s) when shouldSprint is %s', (shouldSprint) => {
            const spy = vi.spyOn(understudy, 'sprint')
            sprintCommand.sprintCommand({}, 'TestBot', shouldSprint)
            advanceTicks(1)
            expect(spy).toHaveBeenCalledWith(shouldSprint)
        })

        it('returns success on success', () => {
            const result = sprintCommand.sprintCommand({}, 'TestBot', true)
            expect(result.status).toBe(CustomCommandStatus.Success)
        })
    })
})
