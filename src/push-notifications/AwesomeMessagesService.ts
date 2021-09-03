import axios from "axios";
import { IsDefined, IsISO8601, IsString, validateSync } from "class-validator";
import { isNil, sample } from "lodash";

export interface IAwesomeMessage {
    id: string;
    isodate: string;
    text: string;
    author: string;
    country: string;
}

class AwesomeMessage {
    @IsDefined()
    @IsString()
    public id: string;

    @IsString()
    @IsDefined()
    @IsISO8601()
    public isodate: string;

    @IsString()
    @IsDefined()
    public text: string;

    @IsString()
    @IsDefined()
    public author: string;

    @IsString()
    @IsDefined()
    public country: string;

    constructor(msg: IAwesomeMessage) {
        this.id = msg.id;
        this.isodate = msg.isodate;
        this.text = msg.text;
        this.author = msg.author;
        this.country = msg.country;
    }

    public static isIAwesomeMessage(msg: unknown): msg is IAwesomeMessage {
        // Note: null is of type object. WTF JS?
        if (typeof msg !== "object" || isNil(msg)) {
            return false;
        }
        return new AwesomeMessage(msg as IAwesomeMessage).validate();
    }

    private validate() {
        const errors = validateSync(this);
        return errors.length === 0;
    }
}

export class AwesomeMessagesService {
    constructor(private readonly messageS3Uri: string) {}

    private cachedMessages: IAwesomeMessage[] = [];

    public async getTodaysMessage(): Promise<{
        text: string;
        authorAndCountry: string; // e.g. Phil from United States
    }> {
        if (this.cachedMessages.length === 0) {
            await this.fetchMessages();
        }

        const message = this.pickTodaysMessage(this.cachedMessages);
        if (!message) {
            await this.fetchMessages();
            const message = this.pickTodaysMessage(this.cachedMessages);
            if (!message) {
                const randomMessage = sample(this.cachedMessages)!;
                return this.formatMessage(randomMessage);
            }
            return this.formatMessage(message);
        }
        return this.formatMessage(message);
    }

    private formatMessage(message: IAwesomeMessage) {
        return {
            text: message.text,
            authorAndCountry: `${message.author} from ${message.country}`,
        };
    }

    private async fetchMessages() {
        const { data: messages } = await axios.get<IAwesomeMessage[]>(
            this.messageS3Uri
        );
        const validMessages = messages.filter(AwesomeMessage.isIAwesomeMessage);
        this.cachedMessages = validMessages;
    }

    private pickTodaysMessage(
        messages: IAwesomeMessage[]
    ): IAwesomeMessage | undefined {
        const today = new Date();
        const todayString = today.toISOString().split("T")[0];
        const message = messages.find(m => m.isodate.includes(todayString));
        return message;
    }
}
