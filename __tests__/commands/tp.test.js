import { vi, describe, it, expect, beforeAll } from 'vitest'
import { Player, world } from '@minecraft/server'
import { advanceTicks, CustomCommandStatus } from '../../__mocks__/@minecraft/server.js'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { teleportCommand } from '../../packs/BP/scripts/commands/tp.js'
import { PlayerCommandOrigin } from '../../packs/BP/scripts/lib/canopy/PlayerCommandOrigin.js'

function createPlayerMock() {
    const player = new Player()
    player.location = { x: 0, y: 64, z: 0 }
    player.dimension = world.getDimension('overworld')
    player.getRotation = vi.fn(() => ({ x: 0, y: 0 }))
    player.getGameMode = vi.fn(() => 'Survival')
    return player
}

describe('TeleportCommand', () => {
    let understudy

    beforeAll(() => {
        understudy = Understudies.create('TestBot')
        understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension('overworld') })
    })

    describe('customCommand.callback', () => {
        it('delegates to teleportCommand', () => {
            const spy = vi.spyOn(teleportCommand, 'teleportCommand')
            teleportCommand.customCommand.callback({}, 'TestBot')
            expect(spy).toHaveBeenCalledWith({}, 'TestBot')
        })
    })

    describe('teleportCommand', () => {
        it('returns failure when the understudy is not online', () => {
            const result = teleportCommand.teleportCommand({}, 'OfflineBot')
            expect(result.status).toBe(CustomCommandStatus.Failure)
        })

        it('schedules teleport with location info from the origin source', () => {
            const player = createPlayerMock()
            const origin = new PlayerCommandOrigin({ sourceEntity: player })
            const spy = vi.spyOn(understudy, 'teleport')
            teleportCommand.teleportCommand(origin, 'TestBot')
            advanceTicks(1)
            expect(spy).toHaveBeenCalledWith(
                expect.objectContaining({ location: player.location })
            )
        })

        it('returns success on success', () => {
            const player = createPlayerMock()
            const origin = new PlayerCommandOrigin({ sourceEntity: player })
            const result = teleportCommand.teleportCommand(origin, 'TestBot')
            expect(result.status).toBe(CustomCommandStatus.Success)
        })
    })
})
