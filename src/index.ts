import { ApolloServer } from 'apollo-server-express'
import * as express from 'express'
import { ApolloServerPluginDrainHttpServer } from 'apollo-server-core'
import { createServer } from 'http'
import * as dotenv from 'dotenv'
import Schema from './Schemas/Schema'
import Resolvers from './Resolvers/Resolvers'

dotenv.config()

const startApolloServer = async (schema: any, resolvers: any) => {
  const app = express()
  const httpServer = createServer(app)
  // middleware
  app.use(express.json())
  // Create apollo server
  const server = new ApolloServer({
    typeDefs: schema,
    resolvers,
    // tell Express to attach GraphQL functionality to the server
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer })],
  }) as any

  await server.start() //  start the GraphQL server.
  server.applyMiddleware({ app })

  await new Promise<void>(
    resolve => {
      httpServer.listen({ port: process.env.PORT }, resolve)
    } // run the server on port 4000
  )
  console.log(`Server ready at http://localhost:${process.env.PORT}/${server.graphqlPath}`)
}
// in the end, run the server and pass in our Schema and Resolver.
startApolloServer(Schema, Resolvers)
