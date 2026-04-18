import { vi, describe, it, expect, beforeEach } from 'vitest'
import { world, system } from '@minecraft/server'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { advanceTicks, resetScheduler } from '../../__mocks__/@minecraft/server.js'

describe('Understudies', () => {
    beforeEach(() => {
        Understudies.understudies = []
        resetScheduler()
    })

    describe('onStartup', () => {
        it('subscribes to entityDie and playerGameModeChange events', () => {
            const subscribeSpy = vi.spyOn(world.afterEvents.entityDie, 'subscribe')
            const subscribeSpy2 = vi.spyOn(world.afterEvents.playerGameModeChange, 'subscribe')
            Understudies.onStartup()
            expect(subscribeSpy).toHaveBeenCalled()
            expect(subscribeSpy2).toHaveBeenCalled()
        })
        
        it('starts processing players on an interval', () => {
            Understudies.onStartup()
            const understudy = Understudies.create('TestBot')
            understudy.join({ location: { x: 0, y: 0, z: 0 }, dimension: world.getDimension('overworld') })
            const onConnectedTickSpy = vi.spyOn(understudy, 'onConnectedTick').mockImplementation(() => {})
            advanceTicks(1)
            expect(onConnectedTickSpy).toHaveBeenCalled()
        })
    })

    describe('onEntityDie', () => {
        it('ignores non-player deaths', () => {
            const event = { deadEntity: { typeId: 'minecraft:zombie' } }
            Understudies.onEntityDie(event)
            expect(Understudies.understudies.length).toBe(0)
        })

        it('removes the understudy when it dies', () => {
            const understudy = Understudies.create('TestBot')
            understudy.join({ location: { x: 0, y: 0, z: 0 }, dimension: world.getDimension('overworld') })
            advanceTicks(1)
            const event = { deadEntity: { typeId: 'minecraft:player', name: 'TestBot' } }
            Understudies.onEntityDie(event)
            advanceTicks(1)
            expect(Understudies.understudies.length).toBe(0)
        })
    })

    describe('onPlayerGameModeChange', () => {
        it('saves player info when game mode changes', () => {
            const understudy = Understudies.create('TestBot')
            const savePlayerInfoSpy = vi.spyOn(understudy, 'savePlayerInfo').mockImplementation(() => {})
            const event = { player: { name: 'TestBot' } }
            Understudies.onPlayerGameModeChange(event)
            expect(savePlayerInfoSpy).toHaveBeenCalled()
        })
    })

    describe('create', () => {
        let understudy;
        beforeEach(() => {
            understudy = Understudies.create('TestBot')
        })
        it('creates and returns a new Understudy with the given name', () => {
            expect(understudy.name).toBe('TestBot')
        })

        it('adds the understudy to the list', () => {
            expect(Understudies.length()).toBe(1)
        })

        it('throws if a player with that name already exists', () => {
            expect(() => Understudies.create('TestBot')).toThrow()
        })
    })

    describe('get', () => {
        it('returns the understudy with the given name', () => {
            Understudies.create('TestBot')
            expect(Understudies.get('TestBot')?.name).toBe('TestBot')
        })

        it('returns undefined when no understudy has that name', () => {
            expect(Understudies.get('TestBot')).toBeUndefined()
        })
    })

    describe('isOnline', () => {
        it('returns true when the understudy exists', () => {
            Understudies.create('TestBot')
            expect(Understudies.isOnline('TestBot')).toBe(true)
        })

        it('returns false when the understudy does not exist', () => {
            expect(Understudies.isOnline('TestBot')).toBe(false)
        })
    })

    describe('length', () => {
        it('returns the number of understudies', () => {
            Understudies.create('TestBot')
            Understudies.create('Bob')
            expect(Understudies.length()).toBe(2)
        })

        it('returns zero when no understudies exist', () => {
            expect(Understudies.length()).toBe(0)
        })
    })

    describe('remove', () => {
        it('removes the understudy once it is no longer connected', () => {
            const understudy = Understudies.create('TestBot')
            understudy.join({ location: { x: 0, y: 0, z: 0 }, dimension: world.getDimension('overworld') })
            advanceTicks(1)
            understudy.leave()
            Understudies.remove(understudy)
            advanceTicks(1)
            expect(Understudies.understudies.length).toBe(0)
        })

        it('clears the run interval after removing', () => {
            const understudy = Understudies.create('TestBot')
            understudy.join({ location: { x: 0, y: 0, z: 0 }, dimension: world.getDimension('overworld') })
            advanceTicks(1)
            understudy.leave()
            const clearRunSpy = vi.spyOn(system, 'clearRun')
            Understudies.remove(understudy)
            advanceTicks(1)
            expect(clearRunSpy).toHaveBeenCalled()
        })
    })

    describe('setNametagPrefix', () => {
        it('saves the prefix to world dynamic property', () => {
            Understudies.setNametagPrefix('BOT')
            expect(world.setDynamicProperty).toHaveBeenCalledWith('nametagPrefix', 'BOT')
        })

        it('sets nametags with prefix format when prefix is non-empty', () => {
            const mockPlayer = { name: 'TestBot', simulatedPlayer: { nameTag: '' } }
            Understudies.understudies = [mockPlayer]
            Understudies.setNametagPrefix('BOT')
            expect(mockPlayer.simulatedPlayer.nameTag).toBe('[BOT§r] TestBot')
        })

        it('resets nametags to plain name when prefix is empty string', () => {
            const mockPlayer = { name: 'TestBot', simulatedPlayer: { nameTag: '[BOT§r] TestBot' } }
            Understudies.understudies = [mockPlayer]
            Understudies.setNametagPrefix('')
            expect(mockPlayer.simulatedPlayer.nameTag).toBe('TestBot')
        })
    })

    describe('addNametagPrefix', () => {
        it('sets nametag when prefix is defined', () => {
            world.getDynamicProperty.mockReturnValue('BOT')
            const mockPlayer = { name: 'TestBot', simulatedPlayer: { nameTag: '' } }
            Understudies.addNametagPrefix(mockPlayer)
            expect(mockPlayer.simulatedPlayer.nameTag).toBe('[BOT§r] TestBot')
        })

        it('does not change nametag when prefix is not set', () => {
            world.getDynamicProperty.mockReturnValue(undefined)
            const mockPlayer = { name: 'TestBot', simulatedPlayer: { nameTag: 'original' } }
            Understudies.addNametagPrefix(mockPlayer)
            expect(mockPlayer.simulatedPlayer.nameTag).toBe('original')
        })
    })

    describe('message helpers', () => {
        it('getNotOnlineMessage returns the correct string', () => {
            expect(Understudies.getNotOnlineMessage('TestBot')).toBe("§cSimplayer 'TestBot' is not online.")
        })

        it('getAlreadyOnlineMessage returns the correct string', () => {
            expect(Understudies.getAlreadyOnlineMessage('TestBot')).toBe("§cSimplayer 'TestBot' is already online.")
        })
    })
})
