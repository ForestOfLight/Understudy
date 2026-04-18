export class UnderstudyError extends Error {
    constructor(message) {
        super(`[Understudy] ` + message);
        this.name = 'UnderstudyError';
    }
}