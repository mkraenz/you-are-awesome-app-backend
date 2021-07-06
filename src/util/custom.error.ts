export class MissingEnvironmentVariable extends Error {
    constructor(envVarName: string) {
        super(`Missing Environment variable: ${envVarName}`);
        this.name = "MissingEnvironmentVariableError";
    }
}

export class InvalidArgument extends Error {
    constructor(msg: string) {
        super(`Invalid argument: ${msg}`);
        this.name = "InvalidArgumentError";
    }
}

export class FailedParsing extends Error {
    constructor(stringifiedObj: string) {
        super(`Parsing failed: ${stringifiedObj}`);
        this.name = "ParsingFailedError";
    }
}
