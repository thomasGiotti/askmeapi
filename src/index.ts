import * as express from 'express'
const app = express()

const PORT = 3000

app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(PORT, () => {
  console.log(`AskMe API is running on port ${PORT}`)
})
