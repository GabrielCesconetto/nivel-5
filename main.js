require('dotenv').config()
const express = require('express')
const bodyParser = require('body-parser')
const app = express()
const crypto = require('crypto')
const SECRET_KEY = process.env.SECRET_KEY

const users = [
  { "username": "user", password: "123456", "id": 1, "email": "user@dominio.com", "perfil": "user" },
  { "username": "admin", password: "123456789", "id": 2, "email": "admin@dominio.com", "perfil": "admin" }
]

app.use(bodyParser.json())
app.use(express.json())

function doLogin(credentials) {
  const userData = users.find(item => item.username === credentials?.username && item.password === credentials?.password)
  return userData
}

function getPerfil(sessionId) {
  const user = JSON.parse(decrypt(sessionId))

  const userData = users.find(item => parseInt(user.usuario_id) === parseInt(item.id))

  return userData.perfil
}

function encrypt(text) {
  const cipher = crypto.createCipher('aes-256-cbc', SECRET_KEY)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')

  return encrypted
}

function decrypt(encryptedText) {
  const decipher = crypto.createDecipher('aes-256-cbc', SECRET_KEY)
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8')
  decrypted += decipher.final('utf8')

  return decrypted
}

app.post('/api/auth/login', (req, res) => {
  const credentials = req.body
  const userData = doLogin(credentials)

  if (userData) {
    const dataToEncrypt = `{"usuario_id": ${userData.id}}`
    const bufferToEncrypt = Buffer.from(dataToEncrypt, "utf8")
    const hashString = encrypt(bufferToEncrypt)

    return res.json({ sessionId: hashString })
  } else {
    return res.status(400, json({ message: 'Informe o usuário e senha' }))
  }
})

// Endpoint para demonstração do processo de quebra da criptografia da session-id gerada no login
// Esse endpoint e consequente processo não deve estar em uma API oficial, aparecendo aqui apenas para finalidade de estudos
app.post('/api/auth/decrypt/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId
  const decryptedSessionId = decrypt(sessionId)

  res.json({ decryptedSessionId })
})

app.get('/api/users/:sessionId', (req, res) => {
  const sessionId = req.params.sessionId
  const perfil = getPerfil(sessionId)

  if (perfil !== 'admin') {
    res.status(403).json({ message: 'Forbidden' })
  } else {
    res.status(200).json({ data: users })
  }
})

app.listen(3000, () => {
  console.log('Escutando na porta 3000')
})

/*
curl -X POST "http://localhost:3000/api/auth/login" -H "Content-Type: application/json" -d "{\"username\": \"admin\", \"password\": \"123456789\"}"

curl -X GET "http://localhost:3000/api/users/sessionId"
*/
