const express = require('express')
const {open} = require('sqlite')
const sqlite3 = require('sqlite3')
const path = require('path')

const databasePath = path.join(__dirname, 'todoApplication.db')
const app = express()
app.use(express.json())

let database = null

const initializationDbAndServer = async () => {
  try {
    database = await open({
      filename: databasePath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('server running at http://localhost:3000/')
    })
  } catch (error) {
    console.log(`DB Error: ${error.message}`)
    process.exit(1)
  }
}
initializationDbAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodaosQuery = ''
  const {search_q = '', priority, status} = request.query

  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodaosQuery = `
    select * from todo where todo like '%${search_q}%'
    and status = '${status}'
    and priority = '${priority}';`
      break
    case hasPriorityProperty(request.query):
      getTodaosQuery = `
    select * from todo where todo like '%${search_q}%'
    and priority = '${priority}';`
      break
    case hasStatusProperty(request.query):
      getTodaosQuery = `
    select * from todo where todo like '%${search_q}%'
    and status = '${status}';`
      break
    default:
      getTodaosQuery = `
    select * from todo where todo like '%${search_q}%';`
  }
  data = await database.all(getTodaosQuery)
  response.send(data)
})

//mbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodaosQuery = `
  select * from todo where id = ${todoId};`
  const getArray = await database.get(getTodaosQuery)
  response.send(getArray)
})

//mbbbbbbbbbbbbbbbbbbbbb

app.post('/todos/', async (request, response) => {
  const getDetails = request.body
  const {id, todo, priority, status} = getDetails
  const addDetails = `
    insert into todo (id,todo,priority,status) values (
      '${id}',
      '${todo}',
      '${priority}',
      '${status}'
    );`
  await database.run(addDetails)
  response.send('Todo Successfully Added')
})

//mbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb

app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updateColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updateColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updateColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updateColumn = 'Todo'
      break
  }
  const previousQuery = `
    select * from todo where id = ${todoId};`
  const previousTodo = await database.get(previousQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body

  const updateQuery = `
    update todo set 
    todo = '${todo}',
    priority = '${priority}',
    status = '${status}'
    where id = ${todoId};`
  await database.run(updateQuery)
  response.send(`${updateColumn} Updated`)
})

app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const getTodaosQuery = `
  delete from todo where id = ${todoId};`
  await database.run(getTodaosQuery)
  response.send('Todo Deleted')
})

module.exports = app
