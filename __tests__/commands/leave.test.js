import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { scheduler } from '@forestoflight/minecraft-vitest-mocks'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { leaveCommand } from '../../packs/BP/scripts/commands/leave.js'
import { CustomCommandStatus, world } from '@minecraft/server'

describe('LeaveCommand', () => {
    let understudy

    beforeAll(() => {
        understudy = Understudies.create('TestBot')
        understudy.join({ location: { x: 0, y: 0, z: 0 }, dimension: world.getDimension('overworld') })
    })

    describe('customCommand.callback', () => {
        it('delegates to leaveCommand', () => {
            const spy = vi.spyOn(leaveCommand, 'leaveCommand')
            leaveCommand.customCommand.callback({}, 'TestBot')
            expect(spy).toHaveBeenCalledWith({}, 'TestBot')
        })
    })

    describe('leaveCommand', () => {
        beforeEach(() => {
            Understudies.removeAll()
            scheduler.advanceTicks(1)
            understudy = Understudies.create('TestBot')
            understudy.join({ location: { x: 0, y: 0, z: 0 }, dimension: world.getDimension('overworld') })
        })

        it('returns failure when the understudy is not online', () => {
            const result = leaveCommand.leaveCommand({}, 'OfflineBot')
            expect(result.status).toBe(CustomCommandStatus.Failure)
        })

        it('schedules leave when the understudy is found', () => {
            vi.spyOn(understudy, 'leave')
            leaveCommand.leaveCommand({}, 'TestBot')
            scheduler.advanceTicks(1)
            expect(understudy.leave).toHaveBeenCalled()
        })

        it('schedules remove after leave', () => {
            const spy = vi.spyOn(Understudies, 'remove')
            leaveCommand.leaveCommand({}, 'TestBot')
            scheduler.advanceTicks(1)
            expect(spy).toHaveBeenCalledWith(understudy)
        })

        it('returns undefined on success', () => {
            vi.spyOn(Understudies, 'remove')
            const result = leaveCommand.leaveCommand({}, 'TestBot')
            expect(result).toBeUndefined()
        })
    })
})
