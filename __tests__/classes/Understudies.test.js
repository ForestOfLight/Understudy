import { vi, describe, it, expect, beforeEach } from 'vitest'
import { world, system } from '@minecraft/server'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'

describe('Understudies', () => {
    beforeEach(() => {
        Understudies.understudies = []
    })

    describe('create', () => {
        it('creates and returns a new Understudy with the given name', () => {
            const player = Understudies.create('Alice')
            expect(player.name).toBe('Alice')
        })

        it('adds the understudy to the list', () => {
            Understudies.create('Alice')
            expect(Understudies.length()).toBe(1)
        })

        it('throws if a player with that name already exists', () => {
            Understudies.create('Alice')
            expect(() => Understudies.create('Alice')).toThrow()
        })
    })

    describe('get', () => {
        it('returns the understudy with the given name', () => {
            Understudies.create('Alice')
            expect(Understudies.get('Alice')?.name).toBe('Alice')
        })

        it('returns undefined when no understudy has that name', () => {
            expect(Understudies.get('Alice')).toBeUndefined()
        })
    })

    describe('isOnline', () => {
        it('returns true when the understudy exists', () => {
            Understudies.create('Alice')
            expect(Understudies.isOnline('Alice')).toBe(true)
        })

        it('returns false when the understudy does not exist', () => {
            expect(Understudies.isOnline('Alice')).toBe(false)
        })
    })

    describe('length', () => {
        it('returns the number of understudies', () => {
            Understudies.create('Alice')
            Understudies.create('Bob')
            expect(Understudies.length()).toBe(2)
        })

        it('returns zero when no understudies exist', () => {
            expect(Understudies.length()).toBe(0)
        })
    })

    describe('remove', () => {
        it('removes the understudy once simulatedPlayer becomes null', () => {
            const mockPlayer = { name: 'Alice', simulatedPlayer: {} }
            Understudies.understudies.push(mockPlayer)
            let intervalCb
            system.runInterval.mockImplementation(cb => { intervalCb = cb })
            Understudies.remove(mockPlayer)
            mockPlayer.simulatedPlayer = null
            intervalCb()
            expect(Understudies.understudies).not.toContain(mockPlayer)
        })

        it('clears the run interval after removing', () => {
            const runnerId = 42
            const mockPlayer = { name: 'Alice', simulatedPlayer: null }
            Understudies.understudies.push(mockPlayer)
            let intervalCb
            system.runInterval.mockImplementation(cb => { intervalCb = cb; return runnerId })
            Understudies.remove(mockPlayer)
            intervalCb()
            expect(system.clearRun).toHaveBeenCalledWith(runnerId)
        })
    })

    describe('setNametagPrefix', () => {
        it('saves the prefix to world dynamic property', () => {
            Understudies.setNametagPrefix('BOT')
            expect(world.setDynamicProperty).toHaveBeenCalledWith('nametagPrefix', 'BOT')
        })

        it('sets nametags with prefix format when prefix is non-empty', () => {
            const mockPlayer = { name: 'Alice', simulatedPlayer: { nameTag: '' } }
            Understudies.understudies = [mockPlayer]
            Understudies.setNametagPrefix('BOT')
            expect(mockPlayer.simulatedPlayer.nameTag).toBe('[BOT§r] Alice')
        })

        it('resets nametags to plain name when prefix is empty string', () => {
            const mockPlayer = { name: 'Alice', simulatedPlayer: { nameTag: '[BOT§r] Alice' } }
            Understudies.understudies = [mockPlayer]
            Understudies.setNametagPrefix('')
            expect(mockPlayer.simulatedPlayer.nameTag).toBe('Alice')
        })
    })

    describe('addNametagPrefix', () => {
        it('sets nametag when prefix is defined', () => {
            world.getDynamicProperty.mockReturnValue('BOT')
            const mockPlayer = { name: 'Alice', simulatedPlayer: { nameTag: '' } }
            Understudies.addNametagPrefix(mockPlayer)
            expect(mockPlayer.simulatedPlayer.nameTag).toBe('[BOT§r] Alice')
        })

        it('does not change nametag when prefix is not set', () => {
            world.getDynamicProperty.mockReturnValue(undefined)
            const mockPlayer = { name: 'Alice', simulatedPlayer: { nameTag: 'original' } }
            Understudies.addNametagPrefix(mockPlayer)
            expect(mockPlayer.simulatedPlayer.nameTag).toBe('original')
        })
    })

    describe('message helpers', () => {
        it('getNotOnlineMessage returns the correct string', () => {
            expect(Understudies.getNotOnlineMessage('Alice')).toBe("§cSimplayer 'Alice' is not online.")
        })

        it('getAlreadyOnlineMessage returns the correct string', () => {
            expect(Understudies.getAlreadyOnlineMessage('Alice')).toBe("§cSimplayer 'Alice' is already online.")
        })
    })

    describe('subscribeToEvents', () => {
        it('subscribes to the entityDie event', () => {
            Understudies.subscribeToEvents()
            expect(world.afterEvents.entityDie.subscribe).toHaveBeenCalled()
        })

        it('subscribes to the playerGameModeChange event', () => {
            Understudies.subscribeToEvents()
            expect(world.afterEvents.playerGameModeChange.subscribe).toHaveBeenCalled()
        })

        it('calls leave and remove when a tracked player entity dies', () => {
            let entityDieHandler
            world.afterEvents.entityDie.subscribe.mockImplementation(cb => { entityDieHandler = cb })
            const mockUnderstudy = { name: 'Alice', leave: vi.fn(), simulatedPlayer: null }
            Understudies.understudies = [mockUnderstudy]
            system.runInterval.mockImplementation(() => {})
            Understudies.subscribeToEvents()
            entityDieHandler({ deadEntity: { typeId: 'minecraft:player', name: 'Alice' } })
            expect(mockUnderstudy.leave).toHaveBeenCalled()
        })

        it('does nothing when an untracked entity dies', () => {
            let entityDieHandler
            world.afterEvents.entityDie.subscribe.mockImplementation(cb => { entityDieHandler = cb })
            Understudies.subscribeToEvents()
            expect(() =>
                entityDieHandler({ deadEntity: { typeId: 'minecraft:player', name: 'Unknown' } })
            ).not.toThrow()
        })

        it('calls savePlayerInfo when a tracked player changes game mode', () => {
            let gameModeHandler
            world.afterEvents.playerGameModeChange.subscribe.mockImplementation(cb => { gameModeHandler = cb })
            const mockUnderstudy = { name: 'Alice', savePlayerInfo: vi.fn() }
            Understudies.understudies = [mockUnderstudy]
            Understudies.subscribeToEvents()
            gameModeHandler({ player: { name: 'Alice' } })
            expect(mockUnderstudy.savePlayerInfo).toHaveBeenCalled()
        })
    })

    describe('startProcessingPlayers', () => {
        it('registers a run interval', () => {
            Understudies.startProcessingPlayers()
            expect(system.runInterval).toHaveBeenCalled()
        })

        it('calls onConnectedTick for each connected understudy', () => {
            const mockUnderstudy = { isConnected: true, onConnectedTick: vi.fn() }
            Understudies.understudies = [mockUnderstudy]
            let intervalCb
            system.runInterval.mockImplementation(cb => { intervalCb = cb })
            Understudies.startProcessingPlayers()
            intervalCb()
            expect(mockUnderstudy.onConnectedTick).toHaveBeenCalled()
        })

        it('skips onConnectedTick for disconnected understudies', () => {
            const mockUnderstudy = { isConnected: false, onConnectedTick: vi.fn() }
            Understudies.understudies = [mockUnderstudy]
            let intervalCb
            system.runInterval.mockImplementation(cb => { intervalCb = cb })
            Understudies.startProcessingPlayers()
            intervalCb()
            expect(mockUnderstudy.onConnectedTick).not.toHaveBeenCalled()
        })
    })
})
