import { describe, it, expect, beforeEach } from 'vitest'
import { world } from '@minecraft/server'
import { noSimplayerSaving } from '../../packs/BP/scripts/rules/noSimplayerSaving.js'

describe('NoSimplayerSaving', () => {
    beforeEach(() => {
        world.getDynamicProperty.mockReturnValue(JSON.stringify(false))
    })

    it('has identifier noSimplayerSaving', () => {
        expect(noSimplayerSaving.getID()).toBe('noSimplayerSaving')
    })

    it('defaults to false', () => {
        expect(noSimplayerSaving.getDefaultValue()).toBe(false)
    })
})
