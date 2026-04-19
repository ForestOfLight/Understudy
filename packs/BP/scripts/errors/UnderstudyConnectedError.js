import { UnderstudyError } from "./UnderstudyError";

export class UnderstudyConnectedError extends UnderstudyError {
    constructor(playerName) {
        super(`Player ${playerName} is already connected.`);
        this.name = 'UnderstudyConnectedError';
    }
}