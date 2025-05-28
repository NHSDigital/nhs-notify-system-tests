import {
  AttributeValue,
  DeleteItemCommand,
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
  TransactWriteItemsCommand,
} from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: "eu-west-2" });

const testUsers = JSON.parse(process.env.TEST_USERS ?? "[]") as Array<string>;
const targetEnvironment = process.env.TARGET_ENVIRONMENT;

if (!targetEnvironment) {
  throw new Error("Missing TARGET_ENVIRONMENT");
}

console.log(`Test users (${testUsers.length}): ${JSON.stringify(testUsers)}`);

const tableName = `nhs-notify-${targetEnvironment}-app-api-templates`;

async function deleteTestUserData(owner: string): Promise<void> {
  const input: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: "#owner = :owner",
    ExpressionAttributeNames: {
      "#owner": "owner",
    },
    ExpressionAttributeValues: {
      ":owner": { S: owner },
    },
  };

  const items: Array<Record<string, AttributeValue>> = [];

  do {
    // eslint-disable-next-line no-await-in-loop
    const { Items = [], LastEvaluatedKey } = await client.send(
      new QueryCommand(input)
    );

    input.ExclusiveStartKey = LastEvaluatedKey;

    items.push(...Items);
  } while (input.ExclusiveStartKey);

  console.log(`Found ${items.length} items for owner ${owner}`);

  const itemKeys = items.map(item => ({
    owner: item.owner,
    id: item.id
  }));

  for (let itemKey of itemKeys) {
    console.log(`Deleting ${JSON.stringify(itemKey)}`);
    await client.send(new DeleteItemCommand({
      TableName: tableName,
      Key: itemKey
    }));
  }
}

async function deleteAllTestUserData(): Promise<void> {
  for (let owner of testUsers) {
    await deleteTestUserData(owner);
  }
}

deleteAllTestUserData();
