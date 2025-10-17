import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import {
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
} from '@aws-sdk/lib-dynamodb';
import { Template } from './types';

export class TemplateStorageHelper {
  private readonly ddbDocClient: DynamoDBDocumentClient;

  constructor(
    private readonly tableName: string,
    private readonly templateData: Template[]
  ) {
    const dynamoClient = new DynamoDBClient({ region: 'eu-west-2' });
    this.ddbDocClient = DynamoDBDocumentClient.from(dynamoClient);
  }

  async seedTemplateData() {
    const promises = this.templateData.map((template) =>
      this.ddbDocClient.send(
        new PutCommand({
          TableName: this.tableName,
          Item: template,
        })
      )
    );

    await Promise.all(promises);
  }

  async deleteTemplateData() {
    const promises = this.templateData.map((template) =>
      this.ddbDocClient.send(
        new DeleteCommand({
          TableName: this.tableName,
          Key: {
            id: template.id,
          },
        })
      )
    );

    await Promise.all(promises);
  }
}
