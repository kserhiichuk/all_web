const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const { buildSchema } = require('graphql');
const pool = require('./db');

// --- SCHEMA (SDL) ---
const schema = buildSchema(`
  type Teacher {
    id: ID!
    surname: String!
    position: String!
    degree: String!
    room: String!
  }

  type Query {
    # Отримати одного викладача за id
    getTeacher(id: ID!): Teacher

    # Отримати всіх викладачів
    getAllTeachers: [Teacher]
  }

  type Mutation {
    # Створити нового викладача
    createTeacher(
      surname: String!,
      position: String!,
      degree: String!,
      room: String!
    ): Teacher

    # Оновити дані викладача (можна змінити будь-яке з полів)
    updateTeacher(
      id: ID!,
      surname: String,
      position: String,
      degree: String,
      room: String
    ): Teacher

    # Видалити викладача
    deleteTeacher(id: ID!): Boolean
  }
`);

// --- RESOLVERS ---
const root = {
  // всі викладачі
  getAllTeachers: async () => {
    const res = await pool.query('SELECT * FROM teachers ORDER BY id');
    return res.rows;
  },

  // один викладач за id
  getTeacher: async ({ id }) => {
    const res = await pool.query('SELECT * FROM teachers WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  // створення викладача
  createTeacher: async (args) => {
    const { surname, position, degree, room } = args;
    const res = await pool.query(
      `INSERT INTO teachers (surname, position, degree, room)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [surname, position, degree, room]
    );
    return res.rows[0];
  },

  // оновлення викладача (динамічно будуємо SET)
  updateTeacher: async (args) => {
    const fields = Object.entries(args).filter(
      ([key, value]) => key !== 'id' && value !== undefined
    );
    if (!fields.length) return null;

    const setClause = fields
      .map(([key], index) => `${key} = $${index + 1}`)
      .join(', ');
    const values = fields.map(([_, value]) => value);

    const res = await pool.query(
      `UPDATE teachers
       SET ${setClause}
       WHERE id = $${fields.length + 1}
       RETURNING *`,
      [...values, args.id]
    );

    return res.rows[0] || null;
  },

  // видалення викладача
  deleteTeacher: async ({ id }) => {
    const res = await pool.query(
      'DELETE FROM teachers WHERE id = $1 RETURNING *',
      [id]
    );
    return res.rowCount > 0;
  },
};

// --- SERVER ---
const app = express();

app.use(
  '/graphql',
  graphqlHTTP({
    schema,
    rootValue: root,
    graphiql: true, // вбудований GraphiQL UI в браузері
  })
);

app.listen(4000, () => {
  console.log('GraphQL server running at http://localhost:4000/graphql');
});
