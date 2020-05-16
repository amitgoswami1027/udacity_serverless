import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { parseUserId } from '../../auth/utils';
import { createLogger } from '../../utils/logger';
//import { DocumentClient } from 'aws-sdk/clients/dynamodb';
//import * as AWS from 'aws-sdk';
import { getAllTodos } from "../../BusinessLogic/todos";

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'

// Using Winson logger
const logger = createLogger('getTodos');

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  // TODO: Get all TODO items for a current user
 
  console.log('Processing event: ', event)

  const authorization = event.headers.Authorization;
  const split = authorization.split(' ');
  const jwtToken = split[1];
  const userId = parseUserId(jwtToken);

  console.log("userid : ",userId,"jwtToken : ",jwtToken);
  
  // Decoupling the Business Logic and the DB code 
  const todos = await getAllTodos(userId);

  logger.info(`get all Todo for user ${userId}`);

  //const result = await docClient.query({
  //  TableName: todosTable,
  //  IndexName: indexName,
  //  KeyConditionExpression: 'userId = :userId',
  //  ExpressionAttributeValues: {
  //      ':userId': userId
  //  }
//}).promise();

  return {
    statusCode: 200,
    headers:
    {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      items: todos
    })
};
})

handler.use(
  cors({
    credentials: true
  })
)