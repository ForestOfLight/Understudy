import { vi, beforeEach } from 'vitest'
import { world, dynamicPropertyStore, resetScheduler } from '@minecraft/server'

beforeEach(() => {
    vi.resetAllMocks()
    resetScheduler()
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
