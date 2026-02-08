import { CanopyExtension } from "./lib/canopy/CanopyExtension";

export const extension = new CanopyExtension({
    author: 'ForestOfLight',
    name: 'Understudy',
    description: 'Simulated Players for §l§aCanopy§r',
    version: '1.1.1'
});

import './commands/join';
import './commands/leave';
import './commands/rejoin';

import { noSimplayerSaving } from './rules/noSimplayerSaving';
import { simplayerRejoining } from './rules/simplayerRejoining';

extension.addRule(noSimplayerSaving);
extension.addRule(simplayerRejoining);

import './setup';