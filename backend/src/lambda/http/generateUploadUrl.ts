import 'source-map-support/register'
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import middy from '@middy/core';
import cors from '@middy/http-cors'
import httpErrorHandler from '@middy/http-error-handler'
import { generateUploadUrl } from '../../helpers/attachmentUtils'
import { createLogger } from '../../utils/logger'
import { getUserId } from '../utils'

const logger = createLogger('GenerateUploadUrl');
export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    logger.info('Generating UploadUrl Event: ', event);
    const todoId = event.pathParameters.todoId;
    const userId = getUserId(event);
    const URL = await generateUploadUrl(todoId, userId);

    return {
        statusCode: 202,
        headers: {
            "Access-Control-Allow-Origin": "*",
            'Access-Control-Allow-Credentials': true
        },
        body: JSON.stringify({
            uploadUrl: URL,
        })
    };
});
handler
  .use(httpErrorHandler())
  .use(cors(
    {
      origin: "*",
      credentials: true,
    }
  ))
