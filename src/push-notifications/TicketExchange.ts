import { v4 } from "uuid";
import { ILogger } from "../util/ILogger";
import {
    ErrorReceipt,
    ExpoReceiptAdapter,
    SuccessReceipt,
} from "./ExpoReceiptsAdapter";
import { SuccessTicket, TicketRepository } from "./TicketRepository";
import { toErrorReceiptType } from "./toErrorReceiptType";

const thirtyMins = 30 * 60 * 1000;

export class TicketExchange {
    constructor(
        private readonly tickets: Pick<
            TicketRepository,
            "deleteMany" | "getSuccessTickets" | "putMany"
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

            await this.putErrorReceipts(errorReceipts);

            await this.tickets.deleteMany(
                [...successReceipts, ...errorReceipts].map(r => r.ticketUuid),
                "SuccessTicket"
            );
            this.logger.log({
                msg: "finished chunk",
                currentChunk: i + 1,
            });
        }
        this.logger.log({
            msg: "successfully exchanged all success tickets",
            successTickets: successTickets.length,
        });
        return { ticketsProcessed: successTickets.length };
    }

    private async putErrorReceipts(receipts: ErrorReceipt[]) {
        await this.tickets.putMany(
            receipts.map(r => ({
                type: toErrorReceiptType(r),
                uuid: v4(),
                expoPushToken: r.expoPushToken,
                message: r.message,
                receiptId: r.receiptId,
                timestamp: new Date().toISOString(),
            }))
        );
    }

    private filterOutTooYoungTickets(allSuccessTickets: SuccessTicket[]) {
        const thirtyMinsAgo = new Date(Date.now() - thirtyMins).toISOString();
        const successTickets = allSuccessTickets.filter(
            t => t.timestamp < thirtyMinsAgo
        );
        return { successTickets, thirtyMinsAgo };
    }
}
