import { Handler } from "aws-lambda";
import { fetchTodaysPostOrFallback } from "./push-notifications/fetchTodaysPostOrFallback";
import { IPostContent } from "./push-notifications/IPost";
import { triggerExpoPushNotificationBackend } from "./push-notifications/triggerExpoPushNotificationBackend";
import { decrypt } from "./util/crypto";
import { respond } from "./utils/respond";
import { assertToken } from "./validation/assert";

export const handler: Handler<{ body: string; httpMethod: "POST" }> = async (
    event,
    context,
    callback
) => {
    try {
        const body: { token: string } = JSON.parse(event.body);
        const encryptedToken = validateTokenBody(body.token);
        const expoPushToken = decrypt(encryptedToken);
        assertToken(expoPushToken);
        const post = await fetchTodaysPostOrFallback();
        await triggerExpoPushNotificationBackend(
            expoPushToken,
            toNotification(post)
        );
        const resBodyObj = { message: "Success", todaysPost: post };
        return respond(200, resBodyObj);
    } catch (error) {
        return respond(500, error.message);
    }
};

const toNotification = (post: IPostContent) => ({
    title: `${post.author} from ${post.country}`,
    body: post.text,
});

const validateTokenBody = (token: unknown): string => {
    if (typeof token !== "string") {
        throw new Error(
            `invalid token. Expected string. Found ${typeof token}`
        );
    }
    if (!token) {
        throw new Error("Empty token");
    }
    return token;
};
