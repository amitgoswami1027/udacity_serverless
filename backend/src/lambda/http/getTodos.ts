import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { parseUserId } from '../../auth/utils';
import { createLogger } from '../../utils/logger';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import * as AWS from 'aws-sdk';


const docClient: DocumentClient = new AWS.DynamoDB.DocumentClient();

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

const logger = createLogger('getTodo');
const todosTable = process.env.TODOS_TABLE
const indexName = process.env.TODOS_INDEX_NAME

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // TODO: Get all TODO items for a current user
 
  //console.log('Processing event: ', event.pathParameters.userId)
  const authorization = event.headers.Authorization;
  const split = authorization.split(' ');
  const jwtToken = split[1];
  const userId = parseUserId(jwtToken);
  //const userId = event.pathParameters.userId;
  console.log("userid : ",userId,"jwtToken : ",jwtToken);
  logger.info(`get all Todo for user ${userId}`);
  
  const result = await docClient.query({
    TableName: todosTable,
    IndexName: indexName,
    KeyConditionExpression: 'userId = :userId',
    ExpressionAttributeValues: {
        ':userId': userId
    }
}).promise();

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      items: result.Items
    })
};
})

handler.use(
  cors({
    credentials: true
  })
)