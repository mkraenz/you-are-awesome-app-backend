import { Handler } from "aws-lambda";
import { createTransport } from "nodemailer";
import { getBody, IBody, Report } from "./validation/Body.dto";
import { EmailConfig, getEmailConfig } from "./validation/EmailConfig.dto";

export const handler: Handler<{ body: string; httpMethod: "POST" }> = async (
    event,
    context,
    callback
) => {
    try {
        const body: IBody = JSON.parse(event.body);
        const report = await getBody(body);
        const cfg = await getEmailConfig();
        const email = getEmail(report, cfg);
        const mailer = getTransport(cfg);
        const sendEmailResult = await mailer.sendMail(email);
        console.log(sendEmailResult);
        const resBodyObj = { message: "Success" };
        return {
            statusCode: "200",
            body: JSON.stringify(resBodyObj),
            headers: {
                "Content-Type": "application/json",
            },
        };
    } catch (error) {
        console.error({ error });
        console.error(error.message);
        return {
            statusCode: "400",
            body: error.message,
            headers: {
                "Content-Type": "application/json",
            },
        };
    }
};

const getTransport = ({ host, port, useSsl, user, password }: EmailConfig) => {
    return createTransport({
        host,
        port,
        secure: useSsl,
        auth: {
            user,
            pass: password,
        },
    });
};

const getEmail = (
    { messageId, reason, comment }: Report,
    mailCfg: EmailConfig
) => {
    return {
        from: {
            name: "You are Awesome App! Content Report",
            address: mailCfg.fromAddress,
        },
        to: mailCfg.to,
        subject: "[YAA] Action required: User reported content as inappriate.",
        text: `Hi Admin.\n\nA user reported content as inappropriate\n Id: ${messageId}\nReport ${reason}\nOptional comment: ${comment}\n\nPlease take a look whether the report is justified and appropriate action or inaction.`,
    };
};
