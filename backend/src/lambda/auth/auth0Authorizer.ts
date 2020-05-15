import { CustomAuthorizerEvent, CustomAuthorizerResult } from 'aws-lambda'
import 'source-map-support/register'

import { verify, decode } from 'jsonwebtoken'
import { createLogger } from '../../utils/logger'
import Axios from 'axios'
import { Jwt } from '../../auth/Jwt'
import { JwtPayload } from '../../auth/JwtPayload'

const logger = createLogger('auth')

// TODO: Provide a URL that can be used to download a certificate that can be used
// to verify JWT token signature.
// To get this URL you need to go to an Auth0 page -> Show Advanced Settings -> Endpoints -> JSON Web Key Set
const jwksUrl = 'https://dev-lo4kzqz7.auth0.com/.well-known/jwks.json'

export const handler = async (
  event: CustomAuthorizerEvent
): Promise<CustomAuthorizerResult> => {

  logger.info('Authorizing a user', event.authorizationToken)
  try {
    const jwtToken = await verifyToken(event.authorizationToken)
    logger.info('User was authorized', jwtToken)

    return {
      principalId: jwtToken.sub,
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Allow',
            Resource: '*'
          }
        ]
      }
    }
  } catch (e) {
    logger.error('User not authorized', { error: e.message })

    return {
      principalId: 'user',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [
          {
            Action: 'execute-api:Invoke',
            Effect: 'Deny',
            Resource: '*'
          }
        ]
      }
    }
  }
}

async function verifyToken(authHeader: string): Promise<JwtPayload> {
  const token = getToken(authHeader)
  const jwt: Jwt = decode(token, { complete: true }) as Jwt

  // TODO: Implement token verification done
  // You should implement it similarly to how it was implemented for the exercise for the lesson 5
  // You can read more about how to do this here: https://auth0.com/blog/navigating-rs256-and-jwks/
  // return undefined
  const { header } = jwt;

  let key = await getSigningKey(jwksUrl, header.kid)
  return verify(token, key.publicKey, { algorithms: ['RS256'] }) as JwtPayload

}

 function  getToken(authHeader: string): string 
 {
   if (!authHeader) throw new Error('No authentication header')

   if (!authHeader.toLowerCase().startsWith('bearer '))
     throw new Error('Invalid authentication header')

   const split = authHeader.split(' ')
   const token = split[1]

   return token
 }

const getSigningKey = async (jwkurl, kid) => {
  let res = await Axios.get(jwkurl, {
    headers: {
      'Content-Type': 'application/json',
      "Access-Control-Allow-Origin": "*",
      'Access-Control-Allow-Credentials': true,
    }
  });
  
  let keys  = res.data.keys;
  // since the keys is an array its possible to have many keys in case of cycling.
  const signingKeys = keys.filter(key => key.use === 'sig' // JWK property `use` determines the JWK is for signing
                                  && key.kty === 'RSA' // We are only supporting RSA
                                  && key.kid           // The `kid` must be present to be useful for later
                                  && key.x5c && key.x5c.length // Has useful public keys (we aren't using n or e)
                                  ).map(key => {
                                    return { kid: key.kid, nbf: key.nbf, publicKey: certToPEM(key.x5c[0]) };
                                  });
  
  const signingKey = signingKeys.find(key => key.kid === kid);
  if(!signingKey)
  {
    throw new Error('Invalid signing keys')
    logger.error("No signing keys found")
  }

  logger.info("Signing keys created successfully ", signingKey)
  return signingKey

};

function certToPEM(cert) 
{
  cert = cert.match(/.{1,64}/g).join('\n');
  cert = `-----BEGIN CERTIFICATE-----
  MIIDBzCCAe+gAwIBAgIJAtsKWsu9SV52MA0GCSqGSIb3DQEBCwUAMCExHzAdBgNV
  BAMTFmRldi1sbzRrenF6Ny5hdXRoMC5jb20wHhcNMjAwNTA5MjAxMDE0WhcNMzQw
  MTE2MjAxMDE0WjAhMR8wHQYDVQQDExZkZXYtbG80a3pxejcuYXV0aDAuY29tMIIB
  IjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3X5U+XCpG1t45scCyctaLiNN
  eUzyp5RSBHKq3adD286nMdWHSOA5XmnCd3nDl7wt1xi4FASRBMbhbW7TFf0By7kE
  UcJEyx7uxvkf5nDjjhMhmWfjPSiuo/YxAsd8QRj9+BFXaXtSQkustcyF/XZoyFZw
  rfXUShNAxQZ4w0KxtvV7JomvlQLaGN35DOBIeparbGgGVPFVbigfydZfnwHiBtl5
  PDLnxiN+xjhX/zqWudBxK01BHPykGp7BLlSTZS/L/w+8FbwDE+dA1IXXZatNV5VQ
  /5SIiuKMc8uNSJOlRwUlXb8PYxPhogp1Dg+KsxHKDbdzp+ubXnqwOz8HdSDriwID
  AQABo0IwQDAPBgNVHRMBAf8EBTADAQH/MB0GA1UdDgQWBBT/EWW0eWv2PEad+q0s
  3mVreu+r5zAOBgNVHQ8BAf8EBAMCAoQwDQYJKoZIhvcNAQELBQADggEBAHFA24VJ
  PHWgFZvWjW63q/Tm6Hs7RGOFARXAwMNewR9+muB7TD4+WR2ugYevSusCdlqqQYBz
  hE1NWPV/8t3vPGQZbIp5iD0mKeV4LehXEpqwMajYdPHWS4jx8OTJnBwtBdwzLXwL
  FN1DxGKFvRNXLso2SMJPu/+JUEps5lN4Bp3f1ShY5Xvunc3BlGafBANE3Gfy8VBK
  kgvL3hjSlaMHHz1lXL8RuRkt43E8vJT6Bckg6HQPMwwfY5EXLy3jgpz1YD6k8wEf
  bV8uVzgOZh+lkCyE6vRbzM7WboqW6CjXGl+KvAoN7SEO7YhLSpOkidkMvWJCwLjx
  OGo+he5JvPjpm74=
  -----END CERTIFICATE-----`;
  return cert;
}