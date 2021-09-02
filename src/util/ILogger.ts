import { noop } from "lodash";

export interface ILogger {
    readonly log: (obj: { msg: string; [key: string]: any }) => void;
    readonly error: (obj: { msg: string; [key: string]: any }) => void;
}

export const mockLogger: ILogger = { error: noop, log: noop };
