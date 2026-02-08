import { extension } from "../main";
import { BooleanRule } from '../lib/canopy/CanopyExtension';

class NoSimplayerSaving extends BooleanRule {
    constructor() {
        super({
            identifier: 'noSimplayerSaving',
            description: 'Disables saving playerdata for SimPlayers. Improves performance but can destroy items.',
            defaultValue: false
        }); 
    }
}

export const noSimplayerSaving = new NoSimplayerSaving();