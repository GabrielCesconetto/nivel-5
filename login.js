require('dotenv').config()
const express = require('express')
const app = express()
const jwt = require('jsonwebtoken')
const SECRET_KEY = process.env.SECRET_KEY

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
    req.user = user
    next()
  })
}

app.post('/login', (req, res) => {
  const { username, password } = req.body
  if (username && password) {
    const user = { name: username }
    const accessToken = jwt.sign(user, SECRET_KEY, { expiresIn: 60 * 60 })
    return res.json({ accessToken })
  } else {
    return res.statusCode(400, json({ message: 'Informe o usuário e senha' }))
  }
})

app.get('/confidential-data', (req, res) => {
  res.json({ message: 'Dados confidenciais', user: req.user.name })
})

app.listen(3000, () => {
  console.log('Escutando na porta 3000')
})

/*

Testando o login
curl -X POST http://localhost:3000/login -H "Content-Type: application/json" -d {"username": "teste", password: "senha123"}"
*/
