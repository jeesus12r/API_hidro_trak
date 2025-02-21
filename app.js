const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const cors = require('cors');
const routes = require('./routes');
require('dotenv').config(); // Cargar las variables de entorno

app.use(bodyParser.json());

// Configurar CORS
app.use(cors({
  origin: 'http://localhost:5173', // Cambia esto al origen correcto
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

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
