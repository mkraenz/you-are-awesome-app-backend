import AWS from "aws-sdk";
import { MissingSetup } from "../util/custom.error";
import { ILogger } from "../util/ILogger";
import { MAX_DYNAMO_DB_BATCH_SIZE } from "./TicketRepository";

export interface Subscription {
    expoPushToken: string;
    /** Format HH:mm, e.g. 23:45, 01:08 */
    time: string;
}

export class SubscriptionRepository {
    constructor(
        private readonly docClient: AWS.DynamoDB.DocumentClient,
        private readonly table: string,
        private readonly byTimeIndex = "",
        private readonly logger: ILogger = console
    ) {}

    async getManyByTime(time: string) {
        if (!this.byTimeIndex) {
            throw new MissingSetup(
                "To use SubscriptionRepository.getAllByTime(), you must construct the instance with a TimeIndex"
            );
        }
        const subsRes = await this.docClient
            .query({
                TableName: this.table,
                IndexName: this.byTimeIndex,
                KeyConditionExpression: "#time = :time",
                ExpressionAttributeValues: {
                    ":time": time,
                },
                ExpressionAttributeNames: {
                    "#time": "time",
                },
            })
            .promise();
        return subsRes.Items as Subscription[];
    }

    async put(expoPushToken: string, time: string) {
        await this.docClient
            .put({
                TableName: this.table,
                Item: {
                    expoPushToken,
                    time,
                },
            })
            .promise();
    }

    async get(expoPushToken: string) {
        const res = await this.docClient
            .get({
                TableName: this.table,
                Key: {
                    expoPushToken,
                },
            })
            .promise();
        if (!res.Item) {
            throw new Error("No subscription found");
        }
        return res.Item as Subscription;
    }

    async delete(expoPushToken: string) {
        await this.docClient
            .delete({
                TableName: this.table,
                Key: { expoPushToken },
            })
            .promise();
    }

    async deleteMany(tokens: string[]) {
        if (tokens.length > MAX_DYNAMO_DB_BATCH_SIZE) {
            throw new Error(
                `Can only delete <=25 items at a time. Tokens ${tokens.join(
                    ", "
                )}`
            );
        }
        this.logger.log({ msg: "start removing subs", expoPushTokens: tokens });
        await this.docClient
            .batchWrite({
                RequestItems: {
                    [this.table]: tokens.map(token => ({
                        DeleteRequest: {
                            Key: {
                                expoPushToken: token,
                            },
                        },
                    })),
                },
            })
            .promise();
        this.logger.log({
            msg: "successfully removed subs",
            expoPushTokens: tokens,
        });
    }
}
