import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { advanceTicks } from '@forestoflight/minecraft-vitest-mocks/server'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { world, CustomCommandStatus } from '@minecraft/server'
import { claimProjectilesCommand } from '../../packs/BP/scripts/commands/claimprojectiles.js'

describe('ClaimProjectilesCommand', () => {
    let understudy

    beforeAll(() => {
        understudy = Understudies.create('TestBot')
        understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension('minecraft:overworld') })
    })

    describe('customCommand.callback', () => {
        it('delegates to claimprojectilesCommand', () => {
            const spy = vi.spyOn(claimProjectilesCommand, 'claimprojectilesCommand')
            claimProjectilesCommand.customCommand.callback({}, 'TestBot')
            expect(spy).toHaveBeenCalledWith({}, 'TestBot')
        })
    })

    describe('claimprojectilesCommand', () => {
        beforeEach(() => {
            vi.clearAllMocks()
            vi.spyOn(understudy, 'claimProjectiles')
        })

        it('returns failure when the understudy is not online', () => {
            const result = claimProjectilesCommand.claimprojectilesCommand({}, 'OfflineBot')
            expect(result.status).toBe(CustomCommandStatus.Failure)
        })

        it('schedules claimProjectiles with the default radius of 25', () => {
            claimProjectilesCommand.claimprojectilesCommand({}, 'TestBot')
            advanceTicks(1)
            expect(understudy.claimProjectiles).toHaveBeenCalledWith(25)
        })

        it('schedules claimProjectiles with a custom radius', () => {
            claimProjectilesCommand.claimprojectilesCommand({}, 'TestBot', 50)
            advanceTicks(1)
            expect(understudy.claimProjectiles).toHaveBeenCalledWith(50)
        })
    })
})
