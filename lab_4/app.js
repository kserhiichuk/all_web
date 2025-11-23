const express = require('express');
const bodyParser = require('body-parser');
const pool = require('./db');

const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true }));

// Головна сторінка: список викладачів
app.get('/', async (req, res) => {
  const result = await pool.query('SELECT * FROM teachers ORDER BY id');
  res.render('index', { teachers: result.rows });
});

// Додавання викладача (CREATE)
app.post('/add', async (req, res) => {
  const { surname, position, degree, room } = req.body;
  await pool.query(
    'INSERT INTO teachers (surname, position, degree, room) VALUES ($1, $2, $3, $4)',
    [surname, position, degree, room]
  );
  res.redirect('/');
});

// Видалення викладача (DELETE)
app.post('/delete/:id', async (req, res) => {
  await pool.query('DELETE FROM teachers WHERE id = $1', [req.params.id]);
  res.redirect('/');
});

// Сторінка редагування (READ одного запису)
app.get('/edit/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM teachers WHERE id = $1', [
    req.params.id,
  ]);

  if (result.rows.length === 0) {
    return res.status(404).send('Викладача не знайдено');
  }

  res.render('edit', { teacher: result.rows[0] });
});

// Оновлення викладача (UPDATE)
app.post('/edit/:id', async (req, res) => {
  const { surname, position, degree, room } = req.body;

  await pool.query(
    `UPDATE teachers
     SET surname = $1, position = $2, degree = $3, room = $4
     WHERE id = $5`,
    [surname, position, degree, room, req.params.id]
  );

  res.redirect('/');
});

// JSON API – всі викладачі
app.get('/api/teachers', async (req, res) => {
  const result = await pool.query('SELECT * FROM teachers ORDER BY id');
  res.json(result.rows);
});

// JSON API – один викладач за id (додатковий плюс)
app.get('/api/teachers/:id', async (req, res) => {
  const result = await pool.query('SELECT * FROM teachers WHERE id = $1', [
    req.params.id,
  ]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Викладача не знайдено' });
  }

  res.json(result.rows[0]);
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
