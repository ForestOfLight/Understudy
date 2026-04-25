import { vi, describe, it, expect, beforeEach } from 'vitest'
import { scheduler } from '@forestoflight/minecraft-vitest-mocks'
import Understudies from '../../packs/BP/scripts/classes/Understudies.js'
import { prefixCommand } from '../../packs/BP/scripts/commands/prefix.js'
import { CustomCommandStatus } from '@minecraft/server'

describe('PrefixCommand', () => {
    beforeEach(() => {
        vi.spyOn(Understudies, 'setNametagPrefix').mockImplementation(() => {})
    })

    describe('customCommand.callback', () => {
        it('delegates to prefixCommand', () => {
            const spy = vi.spyOn(prefixCommand, 'prefixCommand')
            prefixCommand.customCommand.callback({}, '-none')
            expect(spy).toHaveBeenCalledWith({}, '-none')
        })
    })

    describe('prefixCommand', () => {
        it('schedules removing the prefix when prefix is -none', () => {
            prefixCommand.prefixCommand({}, '-none')
            scheduler.advanceTicks(1)
            expect(Understudies.setNametagPrefix).toHaveBeenCalledWith('')
        })

        it('schedules setting the prefix when prefix is provided', () => {
            prefixCommand.prefixCommand({}, 'BOT')
            scheduler.advanceTicks(1)
            expect(Understudies.setNametagPrefix).toHaveBeenCalledWith('BOT')
        })

        it('returns success', () => {
            const result = prefixCommand.prefixCommand({}, 'any')
            expect(result.status).toBe(CustomCommandStatus.Success)
        })
    })
})
