import extension from "../config";
import { Rule } from '../Rule.js';

class NoUnderstudySaving extends Rule {
    constructor() {
        super({
            identifier: 'noUnderstudySaving',
            description: { text: 'Disables saving playerdata for SimPlayers. Improves performance but can destroy items.' }
        });
    }
}

extension.addRule(new NoUnderstudySaving());