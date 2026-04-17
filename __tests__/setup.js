import { vi, beforeEach } from 'vitest'
import { world, dynamicPropertyStore } from '@minecraft/server'

beforeEach(() => {
    vi.resetAllMocks()
    dynamicPropertyStore.clear()
    world.getDynamicProperty.mockImplementation((key) => dynamicPropertyStore.get(key))
    world.setDynamicProperty.mockImplementation((key, value) => {
        if (value === undefined) {
            dynamicPropertyStore.delete(key)
        } else {
            dynamicPropertyStore.set(key, value)
        }
    })
    world.getDynamicPropertyIds.mockImplementation(() => [...dynamicPropertyStore.keys()])
})
