import { vi, describe, it, expect, beforeAll } from 'vitest'
import { Entity, Block, CustomCommandStatus, world } from '@minecraft/server'
import { advanceTicks } from '@forestoflight/minecraft-vitest-mocks/server'
import { ServerCommandOrigin } from '../../packs/BP/scripts/lib/canopy/ServerCommandOrigin.js'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { moveCommand, MOVE_OPTIONS } from '../../packs/BP/scripts/commands/move.js'
import { EntityCommandOrigin } from '../../packs/BP/scripts/lib/canopy/EntityCommandOrigin.js'

function makeEntityOrigin(overrides = {}) {
    const entity = new Entity()
    entity.getBlockFromViewDirection = vi.fn(() => void 0)
    entity.getEntitiesFromViewDirection = vi.fn(() => [])
    Object.assign(entity, overrides)
    return new EntityCommandOrigin({ sourceEntity: entity })
}

describe('MoveCommand', () => {
    let understudy

    beforeAll(() => {
        understudy = Understudies.create('TestBot')
        understudy.join({ location: { x: 0, y: 64, z: 0 }, dimension: world.getDimension('overworld') })
    })

    describe('customCommand.callback', () => {
        it('delegates to moveCommand', () => {
            const spy = vi.spyOn(moveCommand, 'moveCommand')
            moveCommand.customCommand.callback({}, 'TestBot', MOVE_OPTIONS.FORWARD)
            expect(spy).toHaveBeenCalledWith({}, 'TestBot', MOVE_OPTIONS.FORWARD)
        })
    })

    describe('moveCommand', () => {
        it('returns failure when the understudy is not online', () => {
            const result = moveCommand.moveCommand({}, 'OfflineBot', MOVE_OPTIONS.FORWARD)
            expect(result.status).toBe(CustomCommandStatus.Failure)
        })

        describe('relative options', () => {
            it.each([
                [MOVE_OPTIONS.FORWARD],
                [MOVE_OPTIONS.BACKWARD],
                [MOVE_OPTIONS.LEFT],
                [MOVE_OPTIONS.RIGHT]
            ])('routes %s to moveRelatively', (direction) => {
                const spy = vi.spyOn(understudy, 'moveRelative')
                moveCommand.moveCommand({}, 'TestBot', direction)
                advanceTicks(1)
                expect(spy).toHaveBeenCalledWith(direction)
            })

            it('returns success', () => {
                const result = moveCommand.moveCommand({}, 'TestBot', MOVE_OPTIONS.FORWARD)
                expect(result.status).toBe(CustomCommandStatus.Success)
            })
        })

        it('returns failure for an unrecognized move option', () => {
            const result = moveCommand.moveCommand({}, 'TestBot', 'diagonal')
            expect(result.status).toBe(CustomCommandStatus.Failure)
        })

        describe('block option', () => {
            it('returns failure when the source is not an entity', () => {
                const origin = { getSource: vi.fn(() => 'not-an-entity') }
                const result = moveCommand.moveCommand(origin, 'TestBot', MOVE_OPTIONS.BLOCK)
                expect(result.status).toBe(CustomCommandStatus.Failure)
            })

            it('returns failure when no block is in view', () => {
                const origin = makeEntityOrigin()
                const result = moveCommand.moveCommand(origin, 'TestBot', MOVE_OPTIONS.BLOCK)
                expect(result.status).toBe(CustomCommandStatus.Failure)
                expect(result.message).toContain('block')
            })

            it('schedules moveLocation at the block when one is found', () => {
                const block = new Block()
                const origin = makeEntityOrigin()
                origin.getSource().getBlockFromViewDirection.mockReturnValue({ block })
                const spy = vi.spyOn(understudy, 'moveLocation')
                moveCommand.moveCommand(origin, 'TestBot', MOVE_OPTIONS.BLOCK)
                advanceTicks(1)
                expect(spy).toHaveBeenCalledWith(block)
            })

            it('returns succcess on success', () => {
                const block = new Block()
                const origin = makeEntityOrigin()
                origin.getSource().getBlockFromViewDirection.mockReturnValue({ block })
                const result = moveCommand.moveCommand(origin, 'TestBot', MOVE_OPTIONS.BLOCK)
                expect(result.status).toBe(CustomCommandStatus.Success)
            })
        })

        describe('entity option', () => {
            it('returns failure when the source is not an entity', () => {
                const origin = { getSource: vi.fn(() => 'not-an-entity') }
                const result = moveCommand.moveCommand(origin, 'TestBot', MOVE_OPTIONS.ENTITY)
                expect(result.status).toBe(CustomCommandStatus.Failure)
            })

            it('returns failure when no entity is in view', () => {
                const origin = makeEntityOrigin()
                const result = moveCommand.moveCommand(origin, 'TestBot', MOVE_OPTIONS.ENTITY)
                expect(result.status).toBe(CustomCommandStatus.Failure)
            })

            it('schedules moveLocation at the entity when one is found', () => {
                const targetEntity = new Entity()
                const origin = makeEntityOrigin()
                origin.getSource().getEntitiesFromViewDirection.mockReturnValue([{ entity: targetEntity }])
                const spy = vi.spyOn(understudy, 'moveLocation')
                moveCommand.moveCommand(origin, 'TestBot', MOVE_OPTIONS.ENTITY)
                advanceTicks(1)
                expect(spy).toHaveBeenCalledWith(targetEntity)
            })

            it('returns success on success', () => {
                const targetEntity = new Entity()
                const origin = makeEntityOrigin()
                origin.getSource().getEntitiesFromViewDirection.mockReturnValue([{ entity: targetEntity }])
                const result = moveCommand.moveCommand(origin, 'TestBot', MOVE_OPTIONS.ENTITY)
                expect(result.status).toBe(CustomCommandStatus.Success)
            })
        })

        describe('me option', () => {
            it('returns failure when the origin is a ServerCommandOrigin', () => {
                const serverOrigin = new ServerCommandOrigin({ sourceType: 'Server' })
                const result = moveCommand.moveCommand(serverOrigin, 'TestBot', MOVE_OPTIONS.ME)
                expect(result.status).toBe(CustomCommandStatus.Failure)
                expect(result.message).toContain('server')
            })

            it('schedules moveLocation at the origin source when not a server origin', () => {
                const origin = makeEntityOrigin()
                const spy = vi.spyOn(understudy, 'moveLocation')
                moveCommand.moveCommand(origin, 'TestBot', MOVE_OPTIONS.ME)
                advanceTicks(1)
                expect(spy).toHaveBeenCalledWith(origin.getSource())
            })

            it('returns success on success', () => {
                const origin = makeEntityOrigin()
                const result = moveCommand.moveCommand(origin, 'TestBot', MOVE_OPTIONS.ME)
                expect(result.status).toBe(CustomCommandStatus.Success)
            })
        })

        describe('to option', () => {
            it('schedules moveLocation at a Vector-converted location', () => {
                const origin = makeEntityOrigin()
                const location = { x: 10, y: 64, z: 20 }
                const spy = vi.spyOn(understudy, 'moveLocation')
                moveCommand.moveCommand(origin, 'TestBot', MOVE_OPTIONS.TO, location)
                advanceTicks(1)
                expect(spy).toHaveBeenCalledWith(
                    expect.objectContaining({ x: 10, y: 64, z: 20 })
                )
            })

            it('returns success', () => {
                const origin = makeEntityOrigin()
                const result = moveCommand.moveCommand(origin, 'TestBot', MOVE_OPTIONS.TO, { x: 0, y: 0, z: 0 })
                expect(result.status).toBe(CustomCommandStatus.Success)
            })
        })

        describe('stop option', () => {
            it('schedules stopMoving on the understudy', () => {
                const origin = makeEntityOrigin()
                const spy = vi.spyOn(understudy, 'stopMoving')
                moveCommand.moveCommand(origin, 'TestBot', MOVE_OPTIONS.STOP)
                advanceTicks(1)
                expect(spy).toHaveBeenCalled()
            })

            it('returns success', () => {
                const origin = makeEntityOrigin()
                const result = moveCommand.moveCommand(origin, 'TestBot', MOVE_OPTIONS.STOP)
                expect(result.status).toBe(CustomCommandStatus.Success)
            })
        })
    })
})
