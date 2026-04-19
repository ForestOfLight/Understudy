import { describe, it, expect } from 'vitest'
import { Block, Container, Entity, GameMode, Player } from '@minecraft/server'
import {
    PLAYER_EYE_HEIGHT,
    getLookAtLocation,
    getLookAtRotation,
    swapSlots,
    portOldGameModeToNewUpdate,
    getLocationInfoFromSource,
} from '../packs/BP/scripts/utils.js'

describe('PLAYER_EYE_HEIGHT', () => {
    it('is 1.62001002', () => {
        expect(PLAYER_EYE_HEIGHT).toBe(1.62001002)
    })
})

describe('getLookAtLocation', () => {
    it('returns a location offset by eye height on the y axis', () => {
        const result = getLookAtLocation({ x: 0, y: 0, z: 0 }, { x: 0, y: 0 })
        expect(result.y).toBeCloseTo(PLAYER_EYE_HEIGHT)
    })

    it.each([
        [{ x: 0, y: 0, z: 0 }, { x: 0, y: 0 }, { x: 0, z: 1000 }],
        [{ x: 10, y: 64, z: -5 }, { x: 0, y: 0 }, { x: 10, z: 995 }],
        [{ x: 0, y: 0, z: 0 }, { x: 0, y: 90 }, { x: -1000, z: 0 }],
        [{ x: 0, y: 0, z: 0 }, { x: 0, y: -90 }, { x: 1000, z: 0 }],
    ])('base offset and yaw are reflected in the result (%o, %o)', (base, rotation, expected) => {
        const result = getLookAtLocation(base, rotation)
        expect(result.x).toBeCloseTo(expected.x, 0)
        expect(result.z).toBeCloseTo(expected.z, 0)
    })
})

describe('getLookAtRotation', () => {
    it('returns pitch and yaw', () => {
        const result = getLookAtRotation({ x: 0, y: 0, z: 0 }, { x: 1000, y: PLAYER_EYE_HEIGHT, z: 0 })
        expect(result).toHaveProperty('x')
        expect(result).toHaveProperty('y')
    })

    it.each([
        [{ x: 0, y: 0, z: 0 }, { x: 1000, y: PLAYER_EYE_HEIGHT, z: 0 }],
        [{ x: 5, y: 64, z: 5 }, { x: 5, y: 64 + PLAYER_EYE_HEIGHT, z: 1005 }],
        [{ x: 0, y: 0, z: 0 }, { x: 0, y: PLAYER_EYE_HEIGHT, z: 1000 }],
        [{ x: 0, y: 0, z: 0 }, { x: 0, y: PLAYER_EYE_HEIGHT, z: -1000 }],
    ])('pitch is ~0 when target is at eye height and far away (%o, %o)', (base, target) => {
        const { x: pitch } = getLookAtRotation(base, target)
        expect(pitch).toBeCloseTo(0, 1)
    })

    it.each([
        [{ x: 0, y: 0, z: 0 }, { x: 0, y: 1000, z: 0 },  -90],
        [{ x: 0, y: 1000, z: 0 }, { x: 0, y: 0, z: 0 },  90],
    ])('pitch is correct when looking straight up or down (%o, %o)', (base, target, expectedPitch) => {
        const { x: pitch } = getLookAtRotation(base, target)
        expect(pitch).toBeCloseTo(expectedPitch, 1)
    })
})

describe('swapSlots', () => {
    it('swaps two items between slots', () => {
        const inv = new Container()
        const itemA = { typeId: 'minecraft:stone' }
        const itemB = { typeId: 'minecraft:dirt' }
        inv.setItem(0, itemA)
        inv.setItem(1, itemB)

        swapSlots(inv, 0, 1)

        expect(inv.getItem(0)).toEqual(itemB)
        expect(inv.getItem(1)).toEqual(itemA)
    })

    it('swaps when one slot is empty', () => {
        const inv = new Container()
        const itemA = { typeId: 'minecraft:stone' }
        inv.setItem(0, itemA)

        swapSlots(inv, 0, 1)

        expect(inv.getItem(0)).toBeUndefined()
        expect(inv.getItem(1)).toEqual(itemA)
    })

    it('throws when there is no inventory container', () => {
        expect(() => swapSlots(void 0, 0, 1)).toThrow('[Understudy] Inventory container is not available.')
    })

    it('throws when the container is undefined', () => {
        expect(() => swapSlots(void 0, 0, 1)).toThrow()
    })
})

describe('portOldGameModeToNewUpdate', () => {
    it.each([
        ['survival', GameMode.Survival],
        ['Survival', GameMode.Survival],
        ['SURVIVAL', GameMode.Survival],
        ['creative', GameMode.Creative],
        ['Creative', GameMode.Creative],
        ['adventure', GameMode.Adventure],
        ['Adventure', GameMode.Adventure],
        ['spectator', GameMode.Spectator],
        ['Spectator', GameMode.Spectator],
    ])('maps "%s" to the correct GameMode', (input, expected) => {
        expect(portOldGameModeToNewUpdate(input)).toBe(expected)
    })

    it('throws for an unknown game mode string', () => {
        expect(() => portOldGameModeToNewUpdate('invalid')).toThrow('[Understudy] Unknown game mode: invalid')
    })

    it.each([
        ['number', 0],
        ['boolean', true],
        ['object', {}],
        ['undefined', void 0]
    ])('throws when given a %s', (type, value) => {
        expect(() => portOldGameModeToNewUpdate(value)).toThrow(expect.objectContaining({ message: expect.stringContaining(type) }))
    })
})

describe('getLocationInfoFromSource', () => {
    it('returns location, dimension, rotation, and gameMode for a Player', () => {
        const player = new Player()
        const result = getLocationInfoFromSource(player)
        expect(result).toEqual({
            location: player.location,
            dimension: player.dimension,
            rotation: player.getRotation(),
            gameMode: player.getGameMode()
        })
    })

    it('returns location, dimension, and rotation for a non-Player Entity', () => {
        const entity = new Entity()
        const result = getLocationInfoFromSource(entity)
        expect(result).toEqual({
            location: entity.location,
            dimension: entity.dimension,
            rotation: entity.getRotation()
        })
    })

    it('returns offset location and dimension for a Block', () => {
        const block = Object.assign(new Block(), { x: 4, y: 63, z: -2, dimension: 'overworld' })
        const result = getLocationInfoFromSource(block)
        expect(result).toEqual({
            location: { x: 4.5, y: 64, z: -1.5 },
            dimension: 'overworld'
        })
    })

    it('throws for an invalid source', () => {
        expect(() => getLocationInfoFromSource({})).toThrow('[Understudy] Invalid source')
    })
})
