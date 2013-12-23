
export enum PollResultStatus {
    SUCCESS,
    FAILURE
}

export interface PollResult {
    status: PollResultStatus;
    id: string;
}

export class PluginBase {
    poll(config: any, callback: (err?: Error, pollResult?: PollResult) => void): void {
        throw new Error("abstract method");
    }
}
