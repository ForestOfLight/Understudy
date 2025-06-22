import extension from "../config";
import { Rule } from '../lib/canopy/CanopyExtension';

class NoUnderstudySaving extends Rule {
    constructor() {
        super({
            identifier: 'noUnderstudySaving',
            description: { text: 'Disables saving playerdata for SimPlayers. Improves performance but can destroy items.' }
        });
    }
}

extension.addRule(new NoUnderstudySaving());