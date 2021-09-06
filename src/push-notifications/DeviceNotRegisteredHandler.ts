import { chunk } from "lodash";
import { ILogger } from "../util/ILogger";
import { SubscriptionRepository } from "./SubscriptionRepository";
import {
    DeviceNotRegisteredReceipt,
    MAX_DYNAMO_DB_BATCH_SIZE,
    TicketRepository,
} from "./TicketRepository";

export class DeviceNotRegisteredHandler {
    constructor(
        private readonly tickets: Pick<
            TicketRepository,
            "getMany" | "deleteMany"
        >,
        private readonly subs: Pick<SubscriptionRepository, "deleteMany">,
        private readonly logger: ILogger = console
    ) {}

    public async unsubscribeAffectedExpoPushTokens() {
        const receipts = await this.tickets.getMany(
            "DeviceNotRegisteredReceipt"
        );
        const result = { receiptsAndTickets: receipts.length };
        if (receipts.length === 0) {
            this.logger.log({
                msg: "No DeviceNotRegisteredReceipts found. Skipping",
            });
            return result;
        }
        this.logger.log({
            msg: "found DeviceNotRegistered receipts",
            receipts: receipts.length,
        });
        const tokenChunks = chunk(receipts, MAX_DYNAMO_DB_BATCH_SIZE);

        for (const chunk of tokenChunks) {
            await this.handleChunk(chunk);
        }
        this.logger.log({
            ...result,
            msg: "Handled DeviceNotRegistered receipts. Deleted subscriptions and receipts",
        });
        return result;
    }

    private async handleChunk(receipts: DeviceNotRegisteredReceipt[]) {
        const tokens = receipts.map(r => r.expoPushToken);
        await this.subs.deleteMany(tokens);
        await this.tickets.deleteMany(
            receipts.map(r => r.uuid),
            "DeviceNotRegisteredReceipt"
        );
    }
}
