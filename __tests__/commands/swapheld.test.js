import { vi, describe, it, expect, beforeAll } from 'vitest'
import { advanceTicks } from '../../__mocks__/@minecraft/server.js'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { swapHeldCommand } from '../../packs/BP/scripts/commands/swapheld.js'
import { CustomCommandStatus, world, Player } from '@minecraft/server'
import { PlayerCommandOrigin } from '../../packs/BP/scripts/lib/canopy/PlayerCommandOrigin.js'

describe('SwapHeldCommand', () => {
    let understudy

    beforeAll(() => {
        understudy = Understudies.create('TestBot')
        understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension('overworld') })
    })

    describe('customCommand.callback', () => {
        it('delegates to swapHeldCommand', () => {
            const spy = vi.spyOn(swapHeldCommand, 'swapHeldCommand')
            const origin = new PlayerCommandOrigin({ sourceEntity: new Player() })
            swapHeldCommand.customCommand.callback(origin, 'TestBot')
            expect(spy).toHaveBeenCalledWith(origin, 'TestBot')
        })
    })

    describe('swapHeldCommand', () => {
        it('returns failure when the understudy is not online', () => {
            const result = swapHeldCommand.swapHeldCommand({}, 'OfflineBot')
            expect(result.status).toBe(CustomCommandStatus.Failure)
        })

        it('schedules swapHeldItemWithPlayer with the origin source', () => {
            const origin = new PlayerCommandOrigin({ sourceEntity: new Player() })
            const spy = vi.spyOn(understudy, 'swapHeldItemWithPlayer')
            swapHeldCommand.swapHeldCommand(origin, 'TestBot')
            advanceTicks(1)
            expect(spy).toHaveBeenCalledWith(origin.getSource())
        })

        it('returns success on success', () => {
            const result = swapHeldCommand.swapHeldCommand({}, 'TestBot')
            expect(result.status).toContain(CustomCommandStatus.Success)
        })
    })
})
