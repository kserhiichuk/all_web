const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');

const app = express();
app.use(express.json());

const SECRET_KEY = 'mySecretKey';
const users = [];

// ====== Middleware для перевірки токена ======
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ message: 'Токен відсутній' });

  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) return res.status(403).json({ message: 'Невалідний токен' });
    req.user = user;
    next();
  });
}

// ====== Middleware для перевірки ролі ======
function authorizeRole(role) {
  return (req, res, next) => {
    if (req.user.role !== role) {
      return res.status(403).json({ message: 'Доступ заборонено' });
    }
    next();
  };
}

// ====== Реєстрація ======
app.post('/users/register', async (req, res) => {
  const { username, password, role } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = {
    id: Date.now(),
    username,
    password: hashedPassword,
    role: role || 'user',
  };

  users.push(user);
  res.json({
    message: 'Користувач зареєстрований',
    user: { username, role: user.role },
  });
});

// ====== Логін ======
app.post('/users/login', async (req, res) => {
  const { username, password } = req.body;

  const user = users.find((u) => u.username === username);
  if (!user)
    return res.status(400).json({ message: 'Користувач не знайдений' });

  const validPassword = await bcrypt.compare(password, user.password);
  if (!validPassword)
    return res.status(403).json({ message: 'Невірний пароль' });

  const token = jwt.sign({ id: user.id, role: user.role }, SECRET_KEY, {
    expiresIn: '1h',
  });
  res.json({ token });
});

// ====== Захищений маршрут для всіх ======
app.get('/profile', authenticateToken, (req, res) => {
  res.json({ message: 'Ваш профіль', user: req.user });
});

// ====== Лише для admin ======
app.get('/admin', authenticateToken, authorizeRole('admin'), (req, res) => {
  res.json({ message: 'Привіт, адмін!', user: req.user });
});

app.listen(3000, () => console.log('Server started on http://localhost:3000'));
