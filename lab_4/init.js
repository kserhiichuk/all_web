const pool = require('./db');

async function initDB() {
  // Створюємо таблицю викладачів кафедри
  await pool.query(`
    CREATE TABLE IF NOT EXISTS teachers (
      id SERIAL PRIMARY KEY,
      surname VARCHAR(50) NOT NULL,
      position VARCHAR(100) NOT NULL,
      degree VARCHAR(50) NOT NULL,
      room VARCHAR(20) NOT NULL
    );
  `);

  // Додаємо кілька тестових записів 
  await pool.query(`
    INSERT INTO teachers (surname, position, degree, room)
    VALUES
      ('Паламарчук', 'професор', 'доктор технічних наук', '301'),
      ('Лукнчук', 'доцент', 'кандидат фіз.-мат. наук', '305'),
      ('Петрук', 'асистент', 'кандидат технічних наук', '210')
    ON CONFLICT DO NOTHING;
  `);

  console.log('DB Success (teachers table created/initialized)');
  process.exit();
}

initDB();
