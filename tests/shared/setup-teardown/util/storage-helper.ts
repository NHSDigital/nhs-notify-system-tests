import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';

export class StorageHelper<T extends { id: string; owner: string }> {
  private readonly ddbDocClient: DynamoDBDocumentClient;

  constructor(private readonly tableName: string, private readonly data: T[]) {
    const dynamoClient = new DynamoDBClient({ region: 'eu-west-2' });
    this.ddbDocClient = DynamoDBDocumentClient.from(dynamoClient);
  }

  async seedData() {
    const promises = this.data.map((item) =>
      this.ddbDocClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: item,
        })
      )
    );

    await Promise.all(promises);
  }

  async deleteData() {
    const promises = this.data.map((item) =>
      this.ddbDocClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: {
            id: item.id,
          },
        })
      )
    );

    await Promise.all(promises);
  }
}
