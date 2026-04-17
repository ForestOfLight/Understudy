export class UnderstudyNotConnectedError extends Error {
    constructor(playerName) {
        super(`[Understudy] Player ${playerName} is not connected.`);
        this.name = 'UnderstudyNotConnectedError';
    }
}