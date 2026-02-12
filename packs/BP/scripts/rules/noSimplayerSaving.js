import { BooleanRule } from '../lib/canopy/CanopyExtension';

class NoSimplayerSaving extends BooleanRule {
    constructor() {
        super({
            identifier: 'noSimplayerSaving',
            description: 'Disables saving playerdata for SimPlayers. Improves performance but causes SimPlayers to lose their inventory and location when they leave and rejoin.',
            defaultValue: false
        }); 
    }
}

export const noSimplayerSaving = new NoSimplayerSaving();