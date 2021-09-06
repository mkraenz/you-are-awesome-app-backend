import AWS from "aws-sdk";

export const dropTable = async (dynamoDb: AWS.DynamoDB, tableName: string) => {
    await dynamoDb
        .deleteTable({
            TableName: tableName,
        })
        .promise();
};

export const createSubsTable = async (
    dynamoDb: AWS.DynamoDB,
    tableName: string
) => {
    await dynamoDb
        .createTable({
            TableName: tableName,
            KeySchema: [{ AttributeName: "expoPushToken", KeyType: "HASH" }],
            AttributeDefinitions: [
                { AttributeName: "expoPushToken", AttributeType: "S" },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
        })
        .promise();
};

export const createTicketsTable = async (
    dynamoDb: AWS.DynamoDB,
    tableName: string
) => {
    await dynamoDb
        .createTable({
            TableName: tableName,
            KeySchema: [
                { AttributeName: "type", KeyType: "HASH" },
                {
                    AttributeName: "uuid",
                    KeyType: "RANGE",
                },
            ],
            AttributeDefinitions: [
                { AttributeName: "type", AttributeType: "S" },
                {
                    AttributeName: "uuid",
                    AttributeType: "S",
                },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 5,
                WriteCapacityUnits: 5,
            },
        })
        .promise();
};

export const createGsiSubsByTime = async (
    dynamoDb: AWS.DynamoDB,
    tableName: string,
    IndexName: string
) => {
    await dynamoDb
        .updateTable({
            TableName: tableName,
            AttributeDefinitions: [
                { AttributeName: "time", AttributeType: "S" },
                { AttributeName: "expoPushToken", AttributeType: "S" },
            ],
            GlobalSecondaryIndexUpdates: [
                {
                    Create: {
                        IndexName,
                        KeySchema: [
                            { AttributeName: "time", KeyType: "HASH" },
                            {
                                AttributeName: "expoPushToken",
                                KeyType: "RANGE",
                            },
                        ],
                        Projection: {
                            ProjectionType: "ALL",
                        },
                        ProvisionedThroughput: {
                            ReadCapacityUnits: 5,
                            WriteCapacityUnits: 5,
                        },
                    },
                },
            ],
        })
        .promise();
};

export const createItem = async (
    docClient: AWS.DynamoDB.DocumentClient,
    TableName: string
) => {
    await docClient
        .put({
            TableName,
            Item: {
                time: "23:54",
                expoPushToken: "xxxxxxxxxxxxxxxxxxxxxx",
            },
        })
        .promise();
};

const getItem = async (
    docClient: AWS.DynamoDB.DocumentClient,
    TableName: string
) => {
    const res = await docClient
        .get({ TableName, Key: { id: "2349534" } })
        .promise();
    console.log(res.Item);
};

const updateItem = async (
    docClient: AWS.DynamoDB.DocumentClient,
    TableName: string
) => {
    const updated = await docClient
        .update({
            TableName,
            Key: { id: "2349534" },
            // ex: SET a=:value1, b=:value2 DELETE :value3, :value4, :value5
            UpdateExpression: "SET #s = :s REMOVE message, details",
            ExpressionAttributeValues: {
                ":s": "ok",
            },
            ExpressionAttributeNames: {
                "#s": "status",
            },
            ReturnValues: "UPDATED_NEW",
        })
        .promise();
    console.log(updated);
};

const revertUpdateItem = async (
    docClient: AWS.DynamoDB.DocumentClient,
    TableName: string
) => {
    const updated = await docClient
        .update({
            TableName,
            Key: { id: "2349534" },
            // ex: SET a=:value1, b=:value2 DELETE :value3, :value4, :value5
            UpdateExpression: "SET #s = :s, message = :m, details = :d",
            ExpressionAttributeValues: {
                ":s": "error",
                ":m": '\\"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]\\" is not a registered push notification recipient',
                ":d": {
                    error: "DeviceNotRegistered",
                },
            },
            ExpressionAttributeNames: {
                "#s": "status",
            },
            ReturnValues: "UPDATED_NEW",
        })
        .promise();
    console.log(updated);
};

const deleteItem = async (
    docClient: AWS.DynamoDB.DocumentClient,
    TableName: string
) => {
    const updated = await docClient
        .delete({
            TableName,
            Key: { id: "2349534" },
        })
        .promise();
    console.log(updated);
};
