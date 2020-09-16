import {
    IsArray,
    IsBoolean,
    IsEmail,
    IsInt,
    IsString,
    validate,
} from "class-validator";

export class EmailConfig {
    @IsString()
    public readonly host: string;

    @IsInt()
    public readonly port: number;

    @IsBoolean()
    public readonly useSsl: boolean;

    @IsEmail()
    public readonly user: string;

    @IsString()
    public readonly password: string;

    @IsArray()
    @IsString({ each: true })
    public readonly to: string[];

    @IsString()
    public readonly fromAddress: string;

    constructor(env: {
        SMTP_HOST?: string;
        SMTP_PORT?: string;
        SMTP_USE_SSL?: string;
        SMTP_USERNAME?: string;
        SMTP_PASSWORD?: string;
        TO_EMAILS_CSV?: string;
        FROM_ADDRESS?: string;
    }) {
        const separator = ",";
        if (
            !env.TO_EMAILS_CSV ||
            typeof env.TO_EMAILS_CSV !== "string" ||
            !env.SMTP_PORT
        ) {
            throw new Error("Missing env var");
        }
        // handled on higher level: we validate the object and can thus assume all values are defined. else we throw.
        this.host = env.SMTP_HOST!;
        this.port = Number.parseInt(env.SMTP_PORT, 10);
        this.useSsl = env.SMTP_USE_SSL !== "false";
        this.user = env.SMTP_USERNAME!;
        this.password = env.SMTP_PASSWORD!;
        const to = env.TO_EMAILS_CSV.split(separator).map(s => s.trim());
        this.to = to;
        this.fromAddress = env.FROM_ADDRESS!;
    }
}

const requiredEnvVars = [
    "SMTP_HOST",
    "SMTP_PORT",
    "SMTP_USE_SSL",
    "SMTP_USERNAME",
    "SMTP_PASSWORD",
    "TO_EMAILS_CSV",
    "FROM_ADDRESS",
];
export const getEmailConfig = async (
    env: {
        SMTP_HOST?: string;
        SMTP_PORT?: string;
        SMTP_USE_SSL?: string;
        SMTP_USERNAME?: string;
        SMTP_PASSWORD?: string;
        TO_EMAILS_CSV?: string;
        FROM_ADDRESS?: string;
    } = process.env
) => {
    const cfg = new EmailConfig(env);
    const validation = await validate(cfg);
    if (validation.length > 0) {
        throw new Error(
            `Missing env var. Required: ${requiredEnvVars.join(", ")}`
        );
    }
    return cfg;
};
