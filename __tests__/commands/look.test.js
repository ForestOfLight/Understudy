import { vi, describe, it, expect, beforeEach } from 'vitest'
import { Entity, Block, world, CustomCommandStatus } from '@minecraft/server'
import { advanceTicks } from '../../__mocks__/@minecraft/server.js'
import { ServerCommandOrigin } from '../../packs/BP/scripts/lib/canopy/ServerCommandOrigin.js'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { lookCommand } from '../../packs/BP/scripts/commands/look.js'
import { EntityCommandOrigin } from '../../packs/BP/scripts/lib/canopy/EntityCommandOrigin.js'

function makeEntityOrigin(overrides = {}) {
    const entity = new Entity()
    entity.getBlockFromViewDirection = vi.fn(() => void 0)
    entity.getEntitiesFromViewDirection = vi.fn(() => [])
    Object.assign(entity, overrides)
    return new EntityCommandOrigin({ sourceEntity: entity })
}

describe('LookCommand', () => {
    let understudy

    beforeEach(() => {
        Understudies.removeAll()
        advanceTicks(1)
        understudy = Understudies.create('TestBot')
        understudy.join({ location: { x: 0, y: 0, z: 0 }, dimension: world.getDimension('overworld') })
    })

    describe('customCommand.callback', () => {
        it('delegates to lookCommand', () => {
            const spy = vi.spyOn(lookCommand, 'lookCommand').mockReturnValue(undefined)
            lookCommand.customCommand.callback({}, 'TestBot', 'up')
            expect(spy).toHaveBeenCalledWith({}, 'TestBot', 'up')
        })
    })

    describe('lookCommand', () => {
        it('returns failure when the understudy is not online', () => {
            const result = lookCommand.lookCommand({}, 'OfflineBot', 'up')
            expect(result.status).toBe(CustomCommandStatus.Failure)
        })

        describe('cardinal direction options', () => {
            it.each([
                ['up', { x: -90, y: 0 }],
                ['down', { x: 90, y: 0 }],
                ['north', { x: 0, y: 180 }],
                ['south', { x: 0, y: 0 }],
                ['east', { x: 0, y: -90 }],
                ['west', { x: 0, y: 90 }]
            ])('routes %s to lookAtCardinal and schedules looking %s', (direction, expected) => {
                const spy = vi.spyOn(understudy, 'look')
                lookCommand.lookCommand({}, 'TestBot', direction)
                advanceTicks(1)
                expect(spy).toHaveBeenCalledWith(expected)
            })
        })

        describe('block option', () => {
            it('returns failure when the source is not an entity', () => {
                const origin = { getSource: vi.fn(() => 'not-an-entity') }
                const result = lookCommand.lookCommand(origin, 'TestBot', 'block')
                expect(result.status).toBe(CustomCommandStatus.Failure)
            })

            it('returns failure when no block is in view', () => {
                const origin = makeEntityOrigin()
                const result = lookCommand.lookCommand(origin, 'TestBot', 'block')
                expect(result.status).toBe(CustomCommandStatus.Failure)
            })

            it('block schedules looking at the block when one is found', () => {
                const block = new Block()
                const origin = makeEntityOrigin()
                origin.getSource().getBlockFromViewDirection.mockReturnValue({ block })
                const spy = vi.spyOn(understudy, 'look')
                lookCommand.lookCommand(origin, 'TestBot', 'block')
                advanceTicks(1)
                expect(spy).toHaveBeenCalledWith(block)
            })
        })

        describe('entity option', () => {
            it('returns failure when the source is not an entity', () => {
                const origin = { getSource: vi.fn(() => 'not-an-entity') }
                const result = lookCommand.lookCommand(origin, 'TestBot', 'entity')
                expect(result.status).toBe(CustomCommandStatus.Failure)
            })

            it('returns failure when no entity is in view', () => {
                const origin = makeEntityOrigin()
                const result = lookCommand.lookCommand(origin, 'TestBot', 'entity')
                expect(result.status).toBe(CustomCommandStatus.Failure)
            })

            it('schedules looking at the entity when one is found', () => {
                const targetEntity = new Entity()
                const origin = makeEntityOrigin()
                origin.getSource().getEntitiesFromViewDirection.mockReturnValue([{ entity: targetEntity }])
                const spy = vi.spyOn(understudy, 'look')
                lookCommand.lookCommand(origin, 'TestBot', 'entity')
                advanceTicks(1)
                expect(spy).toHaveBeenCalledWith(targetEntity)
            })
        })

        describe('me option', () => {
            it('returns failure when the origin is a ServerCommandOrigin', () => {
                const serverOrigin = new ServerCommandOrigin({ sourceType: 'Server' })
                const result = lookCommand.lookCommand(serverOrigin, 'TestBot', 'me')
                expect(result.status).toBe(CustomCommandStatus.Failure)
            })

            it('schedules looking at the origin source when not a server origin', () => {
                const mockSource = {}
                const origin = { getSource: vi.fn(() => mockSource) }
                const spy = vi.spyOn(understudy, 'look')
                lookCommand.lookCommand(origin, 'TestBot', 'me')
                advanceTicks(1)
                expect(spy).toHaveBeenCalledWith(mockSource)
            })
        })

        describe('at option', () => {
            it('schedules looking at a location', () => {
                const location = { x: 10, y: 64, z: 20 }
                const spy = vi.spyOn(understudy, 'look')
                lookCommand.lookCommand({}, 'TestBot', 'at', location)
                advanceTicks(1)
                expect(spy).toHaveBeenCalledWith(
                    expect.objectContaining({ x: 10, y: 64, z: 20 })
                )
            })
        })

        describe('stop option', () => {
            it('schedules stopLooking on the understudy', () => {
                const spy = vi.spyOn(understudy, 'stopLooking')
                lookCommand.lookCommand({}, 'TestBot', 'stop')
                advanceTicks(1)
                expect(spy).toHaveBeenCalled()
            })
        })

        it('returns failure for an unrecognized look option', () => {
            vi.spyOn(Understudies, 'get').mockReturnValue(understudy)
            const result = lookCommand.lookCommand({}, 'TestBot', 'diagonal')
            expect(result).toBeDefined()
            expect(result.message).toContain('diagonal')
        })
    })
})
