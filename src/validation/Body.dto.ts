import { IsOptional, IsString, validate } from "class-validator";

export interface IBody {
    messageId: string;
    reason: string;
    comment?: string;
}

export class Report {
    @IsString()
    public readonly messageId: string;

    @IsString()
    public readonly reason: string;

    @IsOptional()
    @IsString()
    public readonly comment?: string;

    constructor({ messageId, reason, comment }: IBody) {
        this.messageId = messageId;
        this.reason = reason;
        this.comment = comment;
    }
}

export const getBody = async (inputBody: IBody) => {
    const body = new Report(inputBody);
    const validation = await validate(body);
    if (validation.length > 0) {
        throw new Error(`Validation error on request body.`);
    }
    return body;
};
