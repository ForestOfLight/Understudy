import { UnderstudyError } from "./UnderstudyError";

export class UnderstudySaveInfoError extends UnderstudyError {
    constructor(message) {
        super(message);
        this.name = 'UnderstudySaveInfoError';
    }
}