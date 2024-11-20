require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const jwt = require('jsonwebtoken')
const SECRET_KEY = process.env.SECRET_KEY

const users = [
  {
    username: 'user',
    password: '123456',
    id: 1,
    email: 'user@dominio.com',
    perfil: 'user',
  },
  {
    username: 'admin',
    password: '123456789',
    id: 2,
    email: 'admin@dominio.com',
    perfil: 'admin',
  },
]

app.use(bodyParser.json())
app.use(express.json())

function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  const token = authHeader && authHeader.split(' ')[1]

  if (!token) {
    return res.status(401).json({ message: 'Acesso não autorizado' })
  }

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      return res.status(403).json({ message: 'Token inválido' })
    }
    req.user = user.name
    next()
  })
}

function doLogin(credentials) {
  const userData = users.find(
    item =>
      item.username === credentials?.username &&
      item.password === credentials?.password,
  )
  return userData
}

function escapeSQL(param) {
  return param.replace(/'/g, "\\'").replace(/'/g, '\\"')
}

function getContracts(empresa, inicio) {
  const query = `SELECT * FROM contracts WHERE empresa = ${escapeSQL(empresa)} AND data_inicio = ${escapeSQL(inicio)} `
  const result = repository.execute(query)
  return result
}

app.post('/api/auth/login', (req, res) => {
  const credentials = req.body
  const userData = doLogin(credentials)

  if (userData) {
    const user = { name: userData.username }
    const accessToken = jwt.sign(user, SECRET_KEY, { expiresIn: 60 * 60 })
    return res.json({ accessToken })
  } else {
    return res.status(400, json({ message: 'Informe o usuário e senha' }))
  }
})

app.get('/api/users', authenticateToken, (req, res) => {
  const userPerfil = req.user

  if (userPerfil !== 'admin') {
    return res.status(403).json({ message: 'Acesso não autorizado' })
  }

  res.status(200).json({ data: users })
})

app.get('/api/current-user', authenticateToken, (req, res) => {
  const body = req.body
  const user = users.find(item => item.id === body.id)

  if (user) res.status(200).json({ user })
  else res.status(401).json({ message: 'Nenhum usuário encontrado' })
})

app.get('api/contracts/:empresa/:inicio', authenticateToken, (req, res) => {
  const userPerfil = req.user

  if (userPerfil !== 'admin') {
    return res.status(403).json({ message: 'Acesso não autorizado' })
  }

  const empresa = req.params.empresa
  const dataInicio = req.params.inicio
  const result = getContracts(empresa, dataInicio)

  if (result) res.status(200).json({ data: result })
  else res.status(404).json({ data: 'Dados não encontrados' })
})

app.listen(3000, () => {
  console.log('Escutando na porta 3000')
})

/*
curl -X POST "http://localhost:3000/api/auth/login" -H "Content-Type: application/json" -d '{"username": "admin", "password": "123456789"}'
curl -X GET "http://localhost:3000/api/users" -H "Authorization: Bearer TOKEN"
*/
