/* eslint-disable new-cap */
import { PROTO } from '../ipc/ipc'

const rawtext = PROTO.Object({
    text: PROTO.Optional(PROTO.String),
    translate: PROTO.Optional(PROTO.String),
    with: PROTO.Optional(PROTO.Array(PROTO.String)),
    rawtext: PROTO.Optional(PROTO.Array(() => rawtext))
});

export const Ready = PROTO.Void;

export const RegisterExtension = PROTO.Object({
    name: PROTO.String,
    version: PROTO.String,
    author: PROTO.String,
    description: rawtext,
    isEndstone: PROTO.Boolean
});

export const RegisterRule = PROTO.Object({
    identifier: PROTO.String,
    description: rawtext,
    defaultValue: PROTO.String,
    contingentRules: PROTO.Optional(PROTO.Array(PROTO.String)),
    independentRules: PROTO.Optional(PROTO.Array(PROTO.String)),
    type: PROTO.String,
    valueRange: PROTO.Optional(PROTO.Object({
        range: PROTO.Optional(PROTO.Object({
            min: PROTO.Float64,
            max: PROTO.Float64
        })),
        other: PROTO.Optional(PROTO.Array(PROTO.Float64))
    })),
    extensionName: PROTO.Optional(PROTO.String)
});

export const RuleValueRequest = PROTO.Object({
    ruleID: PROTO.String
});

export const RuleValueResponse = PROTO.Object({
    value: PROTO.String
});

export const RuleValueSet = PROTO.Object({
    ruleID: PROTO.String,
    value: PROTO.String
});