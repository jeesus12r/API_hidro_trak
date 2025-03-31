const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');
require('dotenv').config(); 

app.use(bodyParser.json());

// Configurar CORS
const allowedOrigins = ['http://localhost:5173', 'http://localhost:5174']; // Agrega todos los orígenes permitidos

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('No permitido por la política CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Habilitar solicitudes preflight
app.options('*', cors());

// Rutas de la API
app.use('/api', routes);

// Manejo de errores globales
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Algo salió mal, inténtalo de nuevo más tarde.' });
});

// Puerto
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor API a la espera de consulta, por el puerto ${PORT}`);
});
