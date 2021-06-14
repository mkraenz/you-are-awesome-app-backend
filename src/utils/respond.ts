export const respond = (statusCode: number, body: object | Error) => ({
    statusCode,
    body:
        body instanceof Error
            ? JSON.stringify({ error: true, message: body.message })
            : JSON.stringify(body),
    headers: {
        "Content-Type": "application/json",
    },
});
