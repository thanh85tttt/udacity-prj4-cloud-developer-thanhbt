import * as AWS from "aws-sdk";
import { DocumentClient } from "aws-sdk/clients/dynamodb";
import { Types } from 'aws-sdk/clients/s3';
import { TodoItem } from "../models/TodoItem";
import { TodoUpdate } from "../models/TodoUpdate";
import { createLogger } from '../utils/logger';

const logger = createLogger('Log from TodoAccess.ts');
const AWSXRay = require('aws-xray-sdk');
const XAWS = AWSXRay.captureAWS(AWS);

export class ToDoAccess {
    constructor(
        private readonly docClient: DocumentClient = createDynamoDBClient(),
        private readonly s3Client: Types = new XAWS.S3({ signatureVersion: 'v4' }),
        private readonly todoTable = process.env.TODOS_TABLE,
        private readonly s3BucketName = process.env.S3_BUCKET_NAME) {
    }

    async getAllToDo(userId: string): Promise<TodoItem[]> {
        logger.info(`Processing: Getting all todos of ${userId} from ${this.todoTable}`);
        const params = {
            TableName: this.todoTable,
            KeyConditionExpression: "#userId = :userId",
            ExpressionAttributeNames: {
                "#userId": "userId"
            },
            ExpressionAttributeValues: {
                ":userId": userId
            }
        };
        const result = await this.docClient.query(params).promise();
        const items = result.Items;
        logger.info(`Processing: Get ${items.length} todos of ${userId} from ${this.todoTable}`);

        return items as TodoItem[];
    }

    async createToDo(todoItem: TodoItem): Promise<TodoItem> {
        logger.info(`Create new todo: Insert ${todoItem.todoId} of user: ${todoItem.userId} into table: ${this.todoTable}`)
        const params = {
            TableName: this.todoTable,
            Item: todoItem,
        };
        await this.docClient.put(params).promise();

        return todoItem as TodoItem;
    }

    async updateToDo(todoUpdate: TodoUpdate, todoId: string, userId: string): Promise<TodoUpdate> {
        logger.info('Update todo: ', todoUpdate);
        const params = {
            TableName: this.todoTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            },
            UpdateExpression: "set #todoName = :todoName, #todoDate = :todoDate, #status = :status",
            ExpressionAttributeNames: {
                "#todoName": "name",
                "#todoDate": "dueDate",
                "#status": "done"
            },
            ExpressionAttributeValues: {
                ":todoName": todoUpdate.name,
                ":todoDate": todoUpdate.dueDate,
                ":status": todoUpdate.done
            },
            ReturnValues: "UPDATED_NEW"
        };

        const result = await this.docClient.update(params).promise();
        const attributes = result.Attributes;

        return attributes as TodoUpdate;
    }

    async deleteToDo(todoId: string, userId: string): Promise<string> {
        logger.info('Delete todo: ', todoId);
        const params = {
            TableName: this.todoTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            },
        };

        await this.docClient.delete(params).promise();

        return;
    }

    async generateUploadUrl(todoId: string, userId: string): Promise<string> {
        logger.info('Generate upload url of: ', todoId);
        const url = this.s3Client.getSignedUrl('putObject', {
            Bucket: this.s3BucketName,
            Key: todoId,
            Expires: 600,
        });
        await this.docClient.update({
            TableName: this.todoTable,
            Key: { userId, todoId },
            UpdateExpression: "set attachmentUrl=:URL",
            ExpressionAttributeValues: {
              ":URL": url.split("?")[0]
          },
          ReturnValues: "UPDATED_NEW"
        })
        .promise();

        return url as string;
    }

    async removeImageInS3(id: string): Promise<void> {
        const params = {
          Bucket: this.s3BucketName,
          Key: id
        }
        try {
            logger.info(`Find image of id: ${id} in S3`)
          await this.s3Client.headObject(params).promise()

          try {
            await this.s3Client.deleteObject(params).promise()
            logger.info(`Image of id: ${id} deleted Successfully`)
          }
          catch (err) {
            logger.error("Error in deleting Image in S3 : " + JSON.stringify(err))
          }
        } catch (err) {
          logger.error("File not Found ERROR : " + err.code)
        }
      }

    async getTodoItemByKeySchema(todoId: string, userId: string): Promise<TodoItem> {
        logger.info(`Getting todo ${todoId} from ${this.todoTable}`)
        const params = {
            TableName: this.todoTable,
            Key: {
                "userId": userId,
                "todoId": todoId
            },
        };
        const result = await this.docClient.get(params).promise()
    
        const item = result.Item
    
        return item as TodoItem
      }
    
}

function createDynamoDBClient() {
    if (process.env.IS_OFFLINE) {
      return new XAWS.DynamoDB.DocumentClient({
        region: 'localhost',
        endpoint: 'http://localhost:8000'
      })
    }
  
    return new XAWS.DynamoDB.DocumentClient()
  }
