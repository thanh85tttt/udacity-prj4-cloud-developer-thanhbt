import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from '@middy/core';
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import { deleteToDo } from '../../helpers/todos' 
import { getUserId } from '../utils'
import { createLogger } from '../../utils/logger'
import { removeImageInS3 } from '../../helpers/attachmentUtils'

const logger = createLogger('Log from deleteTodo.ts');
export const handler = middy(
    async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Deleting Event: ', event);

    const userId = getUserId(event)
    const todoId = event.pathParameters.todoId;
    await removeImageInS3(todoId);
    const deleteData = await deleteToDo(todoId, userId);

    return {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*",
            'Access-Control-Allow-Credentials': true
        },
        body: deleteData,
    }
});

handler
  .use(httpErrorHandler())
  .use(cors(
    {
      origin: "*",
      credentials: true,
    }
  ))