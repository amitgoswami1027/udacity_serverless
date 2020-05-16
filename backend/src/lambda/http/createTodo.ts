import 'source-map-support/register'
import * as middy from 'middy'
import { cors } from 'middy/middlewares'
import { parseUserId } from '../../auth/utils';
import { createLogger } from '../../utils/logger';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda'
import { createTodo } from "../../BusinessLogic/todos";
import { CreateTodoRequest } from '../../requests/CreateTodoRequest'

// Using Winston for logging
const logger = createLogger('createTodo');

export const handler= middy(async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const newTodo: CreateTodoRequest = JSON.parse(event.body)
  
 // TODO: Implement creating a new TODO item
 const authorization = event.headers.Authorization;
 const split = authorization.split(' ');
 const jwtToken = split[1];
 const userId = parseUserId(jwtToken);

 // Decopuling the Business logic and DB Function
 const newItem = await createTodo(newTodo, userId);

 // Logging userId and newTodo
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

//Taking care of CORS
handler.use(
  cors({
    credentials: true
  })
)