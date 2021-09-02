import { ILogger } from "../util/ILogger";
import { AwesomeMessagesService } from "./AwesomeMessagesService";
import { ExpoSendAdapter } from "./ExpoSendAdapter";
import { SubscriptionRepository } from "./SubscriptionRepository";
import { TicketRepository } from "./TicketRepository";
export class Sender {
    constructor(
        private readonly subscriptions: Pick<
            SubscriptionRepository,
            "getManyByTime"
        >,
        private readonly expo: Pick<
            ExpoSendAdapter,
            "chunkNotifications" | "sendNotifications" | "subsToMessages"
        >,
        private readonly awesomeMessages: Pick<
            AwesomeMessagesService,
            "getTodaysMessage"
        >,
        private readonly ticketRepository: Pick<TicketRepository, "putMany">,
        private readonly logger: ILogger = console
    ) {}

    public async send(time: string) {
        const subs = await this.subscriptions.getManyByTime(time);
        if (subs.length === 0) {
            this.logger.log({ msg: "No subs found. Skipping", time });
            return;
        }
        this.logger.log({ msg: `found subs to send`, subs: subs.length, time });
        const message = await this.awesomeMessages.getTodaysMessage();
        const notifications = this.expo.subsToMessages(subs, message);
        const notificationChunks = this.expo.chunkNotifications(notifications);
        for (const [i, notificationChunk] of notificationChunks.entries()) {
            this.logger.log({
                msg: `sending chunk`,
                chunk: i + 1,
                maxChunk: notificationChunk.length,
                time,
                allNotifications: notifications.length,
            });
            const tickets = await this.expo.sendNotifications(
                notificationChunk
            );
            this.logger.log({
                msg: "sent notification chunk",
                chunk: i + 1,
                time,
            });
            await this.ticketRepository.putMany(tickets);
        }
        this.logger.log({
            msg: `finished sending`,
            time,
            processedSubs: subs.length,
        });
    }
}