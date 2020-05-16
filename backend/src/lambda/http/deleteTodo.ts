import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { parseUserId } from '../../auth/utils';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { createLogger } from '../../utils/logger';
import { deleteTodo } from "../../BusinessLogic/todos";

// Using Winston Logger
const logger = createLogger('deleteTodo');

export const handler = middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => 
{
    // Getting todoID from path Parameters 
    const todoId = event.pathParameters.todoId

    // TODO: Remove a TODO item by id
    const authorization = event.headers.Authorization;
    const split = authorization.split(' ');
    const jwtToken = split[1];
    const userId = parseUserId(jwtToken);
  
     logger.info(`User ${userId} deleting todo ${todoId}`)
     
     //Decopuling Business Logic
     await deleteTodo(todoId);
  
    return {
      statusCode: 204,
      headers :{
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Credentials': true
      },
     body: '',
};
})

// Using CORS
handler.use(
    cors({
      credentials: true
    })
  )