import { UnderstudyError } from "./UnderstudyError";

export class UnknownRepeatingActionError extends UnderstudyError {
    constructor(playerName, actionType) {
        super(`Unknown repeating action '${actionType}' for player ${playerName}.`);
        this.name = 'UnknownRepeatingActionError';
    }
}