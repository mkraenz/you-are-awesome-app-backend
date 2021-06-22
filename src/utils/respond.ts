export const respond = (statusCode: number, body: object | Error) => {
    if (body instanceof Error) {
        console.error(body);
        return {
            statusCode,
            body: JSON.stringify({ error: true, message: body.message }),
            headers: {
                "Content-Type": "application/json",
            },
        };
    }
    return {
        statusCode,
        body: JSON.stringify(body),
        headers: {
            "Content-Type": "application/json",
        },
    };
};
