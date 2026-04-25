import { vi, describe, it, expect, beforeEach, beforeAll } from 'vitest'
import { CustomCommandStatus, Player, world } from '@minecraft/server'
import { advanceTicks } from '@forestoflight/minecraft-vitest-mocks/server'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { rejoinCommand } from '../../packs/BP/scripts/commands/rejoin.js'
import Understudy from '../../packs/BP/scripts/classes/Understudy.js'
import { PlayerCommandOrigin } from '../../packs/BP/scripts/lib/canopy/PlayerCommandOrigin.js'

function makePlayerOrigin() {
    const player = new Player()
    player.location = { x: 0, y: 64, z: 0 }
    player.dimension = world.getDimension()
    player.getRotation = vi.fn(() => ({ x: 0, y: 0 }))
    player.getGameMode = vi.fn(() => 'Survival')
    return new PlayerCommandOrigin({ sourceEntity: player })
}

describe('RejoinCommand', () => {
    beforeAll(() => {
        Understudies.removeAll()
    })

    describe('customCommand.callback', () => {
        it('delegates to rejoinCommand', () => {
            const origin = makePlayerOrigin()
            const spy = vi.spyOn(rejoinCommand, 'rejoinCommand')
            rejoinCommand.customCommand.callback(origin, 'TestBot')
            expect(spy).toHaveBeenCalledWith(origin, 'TestBot')
        })
    })

    describe('rejoinCommand', () => {
        beforeEach(() => {
            vi.clearAllMocks()
            Understudies.removeAll()
            advanceTicks(1)
        })

        it('returns failure when the understudy is already online', () => {
            const existing = Understudies.create('TestBot')
            existing.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension('overworld') })
            const result = rejoinCommand.rejoinCommand(makePlayerOrigin(), 'TestBot')
            expect(result.status).toBe(CustomCommandStatus.Failure)
        })

        it('creates a new understudy and calls rejoin when not already online', () => {
            const createSpy = vi.spyOn(Understudies, 'create')
            const rejoinSpy = vi.spyOn(Understudy.prototype, 'rejoin')
            rejoinCommand.rejoinCommand(makePlayerOrigin(), 'TestBot')
            advanceTicks(1)
            expect(createSpy).toHaveBeenCalledWith('TestBot')
            expect(rejoinSpy).toHaveBeenCalled()
        })

        it('falls back to join when rejoin throws', () => {
            vi.spyOn(Understudy.prototype, 'rejoin').mockImplementation(() => { throw new Error('rejoin failed') })
            vi.spyOn(console, 'warn').mockImplementation(() => {})
            const joinSpy = vi.spyOn(Understudy.prototype, 'join')
            rejoinCommand.rejoinCommand(makePlayerOrigin(), 'TestBot')
            advanceTicks(1)
            expect(joinSpy).toHaveBeenCalled()
        })

        it('adds the nametag prefix after rejoining/joining', () => {
            const spy = vi.spyOn(Understudies, 'addNametagPrefix')
            rejoinCommand.rejoinCommand(makePlayerOrigin(), 'TestBot')
            advanceTicks(1)
            expect(spy).toHaveBeenCalledWith(expect.any(Understudy))
        })

        it('returns success on success', () => {
            const result = rejoinCommand.rejoinCommand(makePlayerOrigin(), 'TestBot')
            expect(result.status).toBe(CustomCommandStatus.Success)
        })
    })
})
