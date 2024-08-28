import { Rule } from 'lib/canopy/CanopyExtension';
import extension from 'config';

const commandPlayerRule = new Rule({
    identifier: 'commandPlayer',
    description: 'Enables player command.',
});
extension.addRule(commandPlayerRule);
