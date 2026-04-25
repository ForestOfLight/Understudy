import { vi, describe, it, expect, beforeEach } from 'vitest'
import { CustomCommandStatus, Player, world } from '@minecraft/server'
import { advanceTicks, resetScheduler } from '@forestoflight/minecraft-vitest-mocks/server'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import Understudy from '../../packs/BP/scripts/classes/Understudy.js'
import { joinCommand } from '../../packs/BP/scripts/commands/join.js'
import { PlayerCommandOrigin } from '../../packs/BP/scripts/lib/canopy/PlayerCommandOrigin.js'

function makePlayerOrigin() {
    const player = new Player()
    player.location = { x: 0, y: 64, z: 0 }
    player.dimension = world.getDimension('overworld')
    player.getRotation = vi.fn(() => ({ x: 0, y: 0 }))
    player.getGameMode = vi.fn(() => 'Survival')
    return new PlayerCommandOrigin({ sourceEntity: player })
}

describe('JoinCommand', () => {
    describe('customCommand.callback', () => {
        it('delegates to joinCommand', () => {
            const spy = vi.spyOn(joinCommand, 'joinCommand')
            joinCommand.customCommand.callback({}, 'TestBot')
            expect(spy).toHaveBeenCalledWith({}, 'TestBot')
        })
    })

    describe('joinCommand', () => {
        beforeEach(() => {
            vi.clearAllMocks()
            Understudies.removeAll()
            advanceTicks(1)
            resetScheduler()
        })

        it('returns failure when the understudy is already online', () => {
            const understudy = Understudies.create('TestBot')
            understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension('overworld') })
            const result = joinCommand.joinCommand(makePlayerOrigin(), 'TestBot')
            expect(result.status).toBe(CustomCommandStatus.Failure)
        })

        it('creates a new understudy when not already online', () => {
            const spy = vi.spyOn(Understudies, 'create')
            joinCommand.joinCommand(makePlayerOrigin(), 'TestBot')
            advanceTicks(1)
            expect(spy).toHaveBeenCalledWith('TestBot')
        })

        it('calls join with location info from the origin source', () => {
            const joinSpy = vi.spyOn(Understudy.prototype, 'join')
            joinCommand.joinCommand(makePlayerOrigin(), 'TestBot')
            advanceTicks(1)
            expect(joinSpy).toHaveBeenCalledWith(
                expect.objectContaining({ location: { x: 0, y: 64, z: 0 } })
            )
        })

        it('adds the nametag prefix after joining', () => {
            vi.spyOn(Understudies, 'addNametagPrefix')
            joinCommand.joinCommand(makePlayerOrigin(), 'TestBot')
            advanceTicks(1)
            const understudy = Understudies.get('TestBot')
            expect(Understudies.addNametagPrefix).toHaveBeenCalledWith(understudy)
        })

        it('returns undefined on success', () => {
            const result = joinCommand.joinCommand(makePlayerOrigin(), 'TestBot')
            expect(result).toBeUndefined()
        })
    })
})
