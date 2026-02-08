import extension from "../config";
import { Rule } from '../lib/canopy/CanopyExtension';

class NoSimplayerSaving extends Rule {
    constructor() {
        super({
            identifier: 'noSimplayerSaving',
            description: { text: 'Disables saving playerdata for SimPlayers. Improves performance but can destroy items.' }
        });
    }
}

extension.addRule(new NoSimplayerSaving());