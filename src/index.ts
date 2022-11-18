import * as express from 'express'
import { graphqlHTTP } from 'express-graphql'
import { buildSchema, GraphQLSchema } from 'graphql'

const schema: GraphQLSchema = buildSchema(`type Query {
  hello : String
}`)

const app = express()

const PORT = 3000
const root = { hello: () => 'hello world from graphQL' }
app.get('/', (req, res) => {
  res.send('Hello World!')
})
app.use('/graphql', graphqlHTTP({ schema, rootValue: root, graphiql: true }))
// TODO logger
app.listen(PORT, () => {
  console.log(`AskMe API is running on port http://localhost:${PORT}/graphql`)
})
