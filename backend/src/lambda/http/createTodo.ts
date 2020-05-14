import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { parseUserId } from '../../auth/utils';
import { createLogger } from '../../utils/logger';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import * as uuid from 'uuid'
import * as AWS from 'aws-sdk'

import { CreateTodoRequest } from '../../requests/CreateTodoRequest'
const docClient = new AWS.DynamoDB.DocumentClient()

const logger = createLogger('createTodo');
const todosTable = process.env.TODOS_TABLE
//const todosTable = process.env.TODOS_TABLE

export const handler= middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  
  const itemId = uuid.v4();
  const parsedBody = JSON.parse(event.body)
  // TODO: Implement creating a new TODO item
  const authorization = event.headers.Authorization;
  const split = authorization.split(' ');
  const jwtToken = split[1];
  const userId = parseUserId(jwtToken);

  const newItem = {
      todoId: itemId,
      userId: userId,
      ...parsedBody
  }

  await docClient.put({
      TableName: todosTable,
      Item: newItem
  }).promise()


  logger.info(`create Todo for user ${userId} with data ${newTodo}`);
  return {
    statusCode: 201,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
    },
    body: JSON.stringify({
      item :{
        ...newItem,
      }
    }),
};
})

handler.use(
  cors({
    credentials: true
  })
)