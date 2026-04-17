export class UnderstudyConnectedError extends Error {
    constructor(playerName) {
        super(`[Understudy] Player ${playerName} is already connected.`);
        this.name = 'UnderstudyConnectedError';
    }
}