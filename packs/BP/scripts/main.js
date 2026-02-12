import { CanopyExtension } from "./lib/canopy/CanopyExtension";

export const extension = new CanopyExtension({
    author: 'ForestOfLight',
    name: 'Understudy',
    description: 'Simulated Players for §l§aCanopy§r',
    version: '1.2.0'
});

import './commands/join';
import './commands/leave';
import './commands/rejoin';
import './commands/teleport';
import './commands/look';
import './commands/move';
import './commands/select';
import './commands/sprint';
import './commands/sneak';
import './commands/claimprojectiles';
import './commands/stop';
import './commands/swapheld';
import './commands/inventory';
import './commands/prefix';
import './commands/action';

import { noSimplayerSaving } from './rules/noSimplayerSaving';
import { simplayerRejoining } from './rules/simplayerRejoining';

extension.addRule(noSimplayerSaving);
extension.addRule(simplayerRejoining);

import './setup';