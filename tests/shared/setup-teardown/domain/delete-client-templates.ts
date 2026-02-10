import {
  AttributeValue,
  DeleteItemCommand,
  DynamoDBClient,
  QueryCommand,
  QueryCommandInput,
} from '@aws-sdk/client-dynamodb';

const client = new DynamoDBClient({ region: 'eu-west-2' });

export async function deleteClientEntries(
  clientId: string,
  tableName: string,
): Promise<void> {
  const input: QueryCommandInput = {
    TableName: tableName,
    KeyConditionExpression: '#owner = :owner',
    ExpressionAttributeNames: {
      '#owner': 'owner',
    },
    ExpressionAttributeValues: {
      ':owner': { S: `CLIENT#${clientId}` },
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

  console.log(`Found ${items.length} items for client ${clientId}`);

  const itemKeys = items.map((item) => ({
    owner: item.owner,
    id: item.id,
  }));

  for (let itemKey of itemKeys) {
    console.log(`Deleting ${JSON.stringify(itemKey)}`);
    await client.send(
      new DeleteItemCommand({
        TableName: tableName,
        Key: itemKey,
      })
    );
  }
}
