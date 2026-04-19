import { vi, describe, it, expect, beforeAll } from 'vitest'
import { advanceTicks } from '../../__mocks__/@minecraft/server.js'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { selectCommand } from '../../packs/BP/scripts/commands/select.js'
import { CustomCommandStatus, world } from '@minecraft/server'

describe('SelectCommand', () => {
    let understudy

    beforeAll(() => {
        understudy = Understudies.create('TestBot')
        understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension('overworld') })
    })

    describe('customCommand.callback', () => {
        it('delegates to selectCommand', () => {
            const spy = vi.spyOn(selectCommand, 'selectCommand')
            selectCommand.customCommand.callback({}, 'TestBot', 0)
            expect(spy).toHaveBeenCalledWith({}, 'TestBot', 0)
        })
    })

    describe('selectCommand', () => {
        it('returns failure when the understudy is not online', () => {
            const result = selectCommand.selectCommand({}, 'OfflineBot', 5)
            expect(result.status).toBe(CustomCommandStatus.Failure)
        })

        it('returns failure for slot number below 0', () => {
            const result = selectCommand.selectCommand({}, 'TestBot', -1)
            expect(result.status).toBe(CustomCommandStatus.Failure)
            expect(result.message).toContain('-1')
        })

        it('returns failure for slot number above 8', () => {
            const result = selectCommand.selectCommand({}, 'TestBot', 9)
            expect(result.status).toBe(CustomCommandStatus.Failure)
            expect(result.message).toContain('9')
        })

        it.each([0, 1, 2, 3, 4, 5, 6, 7, 8])('schedules selectSlot for valid slot (%i)', (slot) => {
            const spy = vi.spyOn(understudy, 'selectSlot')
            selectCommand.selectCommand({}, 'TestBot', slot)
            advanceTicks(1)
            expect(spy).toHaveBeenCalledWith(slot)
        })

        it('returns success on success', () => {
            const result = selectCommand.selectCommand({}, 'TestBot', 4)
            expect(result.status).toBe(CustomCommandStatus.Success)
        })
    })
})
