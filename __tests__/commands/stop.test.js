import { vi, describe, it, expect, beforeAll } from 'vitest'
import { advanceTicks } from '../../__mocks__/@minecraft/server.js'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { CustomCommandStatus, world } from '@minecraft/server'
import { stopCommand } from '../../packs/BP/scripts/commands/stop.js'

describe('StopCommand', () => {
    let understudy

    beforeAll(() => {
        understudy = Understudies.create('TestBot')
        understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension('overworld') })
    })

    describe('customCommand.callback', () => {
        it('delegates to stopCommand', () => {
            const spy = vi.spyOn(stopCommand, 'stopCommand')
            stopCommand.customCommand.callback({}, 'TestBot')
            expect(spy).toHaveBeenCalledWith({}, 'TestBot')
        })
    })

    describe('stopCommand', () => {
        it('returns failure when the understudy is not online', () => {
            const result = stopCommand.stopCommand({}, 'OfflineBot')
            expect(result.status).toBe(CustomCommandStatus.Failure)
        })

        it('schedules stopAll when the understudy is found', () => {
            const spy = vi.spyOn(understudy, 'stopAll')
            stopCommand.stopCommand({}, 'TestBot')
            advanceTicks(1)
            expect(spy).toHaveBeenCalled()
        })

        it('returns success on success', () => {
            const result = stopCommand.stopCommand({}, 'TestBot')
            expect(result.status).toBe(CustomCommandStatus.Success)
        })
    })
})
