import { partition } from "lodash";
import { ILogger } from "../util/ILogger";
import {
    ErrorReceipt,
    ExpoReceiptAdapter,
    SuccessReceipt,
} from "./ExpoReceiptsAdapter";
import { SubscriptionRepository } from "./SubscriptionRepository";
import { SuccessTicket, TicketRepository } from "./TicketRepository";

const thirtyMins = 30 * 60 * 1000;

export class TicketHandler {
    constructor(
        private readonly subs: Pick<SubscriptionRepository, "deleteMany">,
        private readonly tickets: Pick<
            TicketRepository,
            "deleteManySuccessTickets" | "getSuccessTickets"
        >,
        private readonly expo: Pick<
            ExpoReceiptAdapter,
            "chunkSuccessTickets" | "getReceipts"
        >,
        private readonly logger: ILogger = console
    ) {}

    public async handleSuccessTickets(): Promise<{
        ticketsProcessed: number;
    }> {
        // ✔  get all success tickets from the database
        // ✔ if no success tickets found: do nothing
        //              tickets contain a receiptId, expoPushToken
        // ✔  if success ticket is younger than 30 mins, do nothing
        // ✔  avoid chunking with 2 different sizes
        // ✔  get receipts from expo
        //              receipts have 2 states: ok, error
        // ✔  if ok, delete ticket from database
        // ✔ if error:
        // ✔ if error is "DeviceNotRegistered" then unsubscribe user by expoPushToken
        // ✔ otherwise: console.error

        const allSuccessTickets = await this.tickets.getSuccessTickets();
        const { successTickets, thirtyMinsAgo } =
            this.filterOutTooYoungTickets(allSuccessTickets);
        if (successTickets.length === 0) {
            this.logger.log({
                msg: "No success tickets after :time found. Skipping",
                time: thirtyMinsAgo,
            });
            return { ticketsProcessed: 0 };
        }

        const chunkedTickets = this.expo.chunkSuccessTickets(successTickets);
        for (const [i, ticketChunk] of chunkedTickets.entries()) {
            this.logger.log({
                msg: "processing ticket chunk",
                currentChunk: i + 1,
                maxChunk: chunkedTickets.length,
            });
            const {
                successReceipts,
                errorReceipts,
            }: {
                successReceipts: SuccessReceipt[];
                errorReceipts: ErrorReceipt[];
            } = await this.expo.getReceipts(ticketChunk);
            this.logger.log({
                msg: "received receipts from expo",
                chunk: i + 1,
                successReceipts: successReceipts.length,
                errorReceipts: errorReceipts.length,
            });
            await this.tickets.deleteManySuccessTickets(
                successReceipts.map(r => r.ticketUuid)
            );
            this.logger.log({
                msg: "deleted success tickets with success receipts",
                successTickets: successTickets.length,
            });
            const [deviceNotRegisteredReceipts, otherErrors] = partition(
                errorReceipts,
                e => e.details?.error === "DeviceNotRegistered"
            );
            await this.logOtherErrors(otherErrors);
            if (deviceNotRegisteredReceipts.length > 0) {
                await this.handleDeviceNotRegisteredError(
                    deviceNotRegisteredReceipts
                );
            }
        }
        this.logger.log({
            msg: "successfully handled all success tickets",
            successTickets: successTickets.length,
        });
        return { ticketsProcessed: successTickets.length };
    }

    private filterOutTooYoungTickets(allSuccessTickets: SuccessTicket[]) {
        const thirtyMinsAgo = new Date(Date.now() - thirtyMins).toISOString();
        const successTickets = allSuccessTickets.filter(
            t => t.timestamp < thirtyMinsAgo
        );
        return { successTickets, thirtyMinsAgo };
    }

    /** TODO #535 consider change in architecture to not directly remove subscriptions from the database. E.g. SQS triggering unsubscribe lambda function */
    private async handleDeviceNotRegisteredError(
        deviceNotRegisteredReceipts: ErrorReceipt[]
    ) {
        await this.subs.deleteMany(
            deviceNotRegisteredReceipts.map(r => r.expoPushToken)
        );
        await this.tickets.deleteManySuccessTickets(
            deviceNotRegisteredReceipts.map(r => r.ticketUuid)
        );
    }

    // TODO #535 handle other errors properly
    private async logOtherErrors(receipts: ErrorReceipt[]) {
        for (const receipt of receipts) {
            this.logger.error({
                msg: "Receipt for ticket has error type",
                errorType: receipt.details?.error,
                receiptId: receipt.receiptId,
                ticketUuid: receipt.ticketUuid,
            });
        }
    }
}
