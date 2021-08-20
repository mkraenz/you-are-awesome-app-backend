import AWS from "aws-sdk";
import { ServiceConfigurationOptions } from "aws-sdk/lib/service";

// https://github.com/aws/aws-sdk-js/issues/1635#issuecomment-316486871
const serviceConfigOptions: ServiceConfigurationOptions = {
    region: "us-west-2",
    endpoint: "http://localhost:7999", // disable
};

const dynamodb = new AWS.DynamoDB(serviceConfigOptions);
const docClient = new AWS.DynamoDB.DocumentClient(serviceConfigOptions);

const TableName = "NotificationTickets";

/** WARNING: Cannot be run twice */
export const createTable = async () => {
    // I
    const table = await dynamodb
        .createTable({
            TableName,
            AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
            KeySchema: [
                {
                    AttributeName: "id",
                    KeyType: "HASH",
                },
            ],
            ProvisionedThroughput: {
                ReadCapacityUnits: 3,
                WriteCapacityUnits: 3,
            },
        })
        .promise();
    console.log(table.TableDescription?.TableName);
};

export const createItem = async () => {
    await docClient
        .put({
            TableName,
            Item: {
                id: "2349534",
                status: "error",
                message:
                    '\\"ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]\\" is not a registered push notification recipient',
                details: {
                    error: "DeviceNotRegistered",
                },
            },
        })
        .promise();
    await docClient
        .put({
            TableName,
            Item: {
                id: "XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX",
                status: "ok",
            },
        })
        .promise();
};

const getItem = async () => {
    const res = await docClient
        .get({ TableName, Key: { id: "2349534" } })
        .promise();
    console.log(res.Item);
};

const updateItem = async () => {
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

const revertUpdateItem = async () => {
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

const deleteItem = async () => {
    const updated = await docClient
        .delete({
            TableName,
            Key: { id: "2349534" },
        })
        .promise();
    console.log(updated);
};

const main = async () => {
    // await createTable();
    // await createItem();
    // await getItem();
    // await updateItem();
    // await revertUpdateItem();
    // await deleteItem();
};

main();
