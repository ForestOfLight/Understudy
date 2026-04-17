export class UnderstudySaveInfoError extends Error {
    constructor(message) {
        super(`[Understudy] ${message}`);
        this.name = 'UnderstudySaveInfoError';
    }
}