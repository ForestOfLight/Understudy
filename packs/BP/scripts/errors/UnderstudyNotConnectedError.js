import { UnderstudyError } from "./UnderstudyError";

export class UnderstudyNotConnectedError extends UnderstudyError {
    constructor(playerName) {
        super(`Player ${playerName} is not connected.`);
        this.name = 'UnderstudyNotConnectedError';
    }
}