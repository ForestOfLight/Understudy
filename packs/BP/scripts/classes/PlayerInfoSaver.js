import { world, system, DimensionTypes, TicksPerSecond, EntityComponentTypes } from "@minecraft/server";
import { UnderstudyInventory } from "./UnderstudyInventory";
import { noSimplayerSaving } from "../rules/noSimplayerSaving";

export class PlayerInfoSaver {
    understudy;
    inventory;
    saveInterval = 600;

    constructor(understudy) {
        this.understudy = understudy;
        this.inventory = new UnderstudyInventory(understudy);
    }

    onConnectedTick() {
        this.saveOnInterval();
    }

    saveOnInterval() {
        if (noSimplayerSaving.getValue())
            return;
        if ((system.currentTick - this.understudy.createdTick) % this.saveInterval === 0) {
            this.save();
            return;
        }
        if (this.understudy.hasRepeatingAction()) {
            if ((system.currentTick - this.understudy.createdTick) % (TicksPerSecond*5) === 0)
                this.save();
            else
                this.inventory.saveWithoutNBT();
        }
    }

    get() {
        if (noSimplayerSaving.getValue())
            throw new Error(`[Understudy] Player ${this.understudy.name} has no player info saved due to '${noSimplayerSaving.getID()}' rule being enabled`);
        let playerInfo;
        try {
            playerInfo = JSON.parse(world.getDynamicProperty(`${this.understudy.name}:playerinfo`));
        } catch (error) {
            if (error.name === 'SyntaxError') {
                throw new Error(`[Understudy] Player ${this.understudy.name} has no player info saved`);
            }
            throw error;
        }
        return playerInfo;
    }

    save({ location, rotation, dimension, gameMode, projectileIds } = {}) {
        const simulatedPlayer = this.understudy.simulatedPlayer;
        if (simulatedPlayer === null || !this.understudy.isConnected || noSimplayerSaving.getValue())
            return;
        const playerInfo = {
            location: location || simulatedPlayer.location,
            rotation: rotation || this.understudy.getHeadRotation(),
            dimensionId: dimension?.id || simulatedPlayer.dimension.id,
            gameMode: gameMode || simulatedPlayer.getGameMode(),
            projectileIds: projectileIds || this.findOwnedProjectileIds()
        };
        world.setDynamicProperty(`${this.name}:playerinfo`, JSON.stringify(playerInfo));
        this.inventory.save();
    }

    load() {
        if (noSimplayerSaving.getValue())
            return void 0;
        let playerInfo;
        try {
            playerInfo = this.get();
            this.claimProjectileIds(playerInfo.projectileIds);
            this.inventory.load();
            return playerInfo;
        } catch {
            return void 0;
        }
    }

    findOwnedProjectileIds() {
        let projectileIds = [];
        for (const dimensionType of DimensionTypes.getAll()) {
            const dimension = world.getDimension(dimensionType.typeId);
            const projectiles = dimension.getEntities().filter(entity => {
                const projectileComponent = entity.getComponent(EntityComponentTypes.Projectile);
                return projectileComponent?.owner === this.simulatedPlayer;
            });
            projectileIds = projectileIds.concat(projectiles.map(projectile => projectile.id));
        }
        return projectileIds;
    }

    claimProjectileIds(projectileIds) {
        projectileIds?.forEach(projectileId => {
            const projectile = world.getEntity(projectileId);
            const projectileComponent = projectile?.getComponent(EntityComponentTypes.Projectile);
            if (projectileComponent)
                projectileComponent.owner = this.simulatedPlayer;
        });
    }
}
