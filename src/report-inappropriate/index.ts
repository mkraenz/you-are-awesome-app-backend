import type { Handler } from "aws-lambda";
import { createTransport } from "nodemailer";
import { parse } from "../utils/parse";
import { respond, respondError } from "../utils/respond";
import { EmailConfig, getEmailConfig } from "../validation/EmailConfig.dto";

export interface IBody {
    messageId: string;
    reason: string;
    comment?: string;
}

export const handler: Handler<{ body: string; httpMethod: "POST" }> =
    async event => {
        try {
            const report = parse<IBody>(event.body);
            const cfg = await getEmailConfig();
            const email = getEmail(report, cfg);
            const mailer = getTransport(cfg);
            const sendEmailResult = await mailer.sendMail(email);
            console.log({ msg: "email sent", sendEmailResult });
            const resBodyObj = { message: "Success" };
            return respond(200, resBodyObj);
        } catch (error) {
            return respondError(error as Error);
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
    { messageId, reason, comment }: IBody,
    mailCfg: EmailConfig
) => {
    return {
        from: {
            name: "You are Awesome App! Content Report",
            address: mailCfg.fromAddress,
        },
        to: mailCfg.to,
        subject: "[YAA] Action required: Inappropriate content reported",
        text: `Hi Admin.\n\nA user reported content as inappropriate\n Id: ${messageId}\nReport ${reason}\nOptional comment: ${comment}\n\nPlease take a look whether the report is justified and appropriate action or inaction.`,
    };
};
