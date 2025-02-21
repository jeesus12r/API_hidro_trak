const express = require('express');
const router = express.Router();
const connection = require('./db');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Obtener todos los registros
router.get('/Users', (req, res) => {
  connection.query('SELECT * FROM usuarios', (err, results) => {
    if (err) {
      console.error('Error al obtener registros:', err);
      res.status(500).json({ error: 'Error al obtener registros' });
      return;
    }
    res.json(results);
  });
});

// Obtener un usuario por ID
router.get('/Users/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM usuarios WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener el usuario:', err);
      res.status(500).json({ error: 'Error al obtener el usuario' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Usuario no encontrado' });
      return;
    }
    res.json(results[0]);
  });
});


// Crear un nuevo usuario sin hashear la contraseña
router.post('/Users', async (req, res) => {
  const { nombre, email, password, telefono, direccion_completa, rol, rolePassword } = req.body;

  if (!nombre || !email || !password || !telefono || !direccion_completa || !rol) {
    return res.status(400).json({ error: 'Todos los campos son requeridos' });
  }

  try {
    // Verificar si el email ya está registrado
    const [existingUser] = await connection.promise().query('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (existingUser.length > 0) {
      return res.status(400).json({ error: 'Ya existe una cuenta con este correo electrónico' });
    }

    const nuevoUsuario = { nombre, email, password, telefono, direccion_completa, rol };
    await connection.promise().query('INSERT INTO usuarios SET ?', nuevoUsuario);
    
    res.status(201).json({ message: 'Usuario registrado exitosamente' });

  } catch (error) {
    console.error('Error al crear un usuario:', error);
    res.status(500).json({ error: 'Error en el servidor al registrar usuario' });
  }
});


// Actualizar un usuario
router.put('/Users/:id', (req, res) => {
  const id = req.params.id;
  const datosActualizados = req.body;

  if (!id || Object.keys(datosActualizados).length === 0) {
    return res.status(400).json({ error: 'Datos actualizados y ID son requeridos' });
  }

  connection.query('UPDATE usuarios SET ? WHERE id = ?', [datosActualizados, id], (err, results) => {
    if (err) {
      console.error('Error al actualizar el usuario:', err);
      res.status(500).json({ error: 'Error al actualizar el usuario' });
      return;
    }
    res.json({ message: 'Usuario actualizado exitosamente' });
  });
});

// Eliminar un usuario
router.delete('/Users/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM usuarios WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar el usuario:', err);
      res.status(500).json({ error: 'Error al eliminar el usuario' });
      return;
    }
    res.json({ message: 'Usuario eliminado exitosamente' });
  });
});

// Autenticación de usuario
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  console.log('Datos recibidos para inicio de sesión:', email, password);

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    const [results] = await connection.promise().query(
      'SELECT id, nombre, email, password, rol FROM usuarios WHERE email = ?',
      [email]
    );

    if (results.length === 0) {
      console.log('Usuario no encontrado con email:', email);
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const usuario = results[0];
    console.log('Usuario encontrado:', usuario);

    // Validar la contraseña sin hashear
    if (password !== usuario.password) {
      console.log('Contraseña incorrecta para usuario:', email);
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    const token = jwt.sign({ id: usuario.id, email: usuario.email, rol: usuario.rol }, process.env.JWT_SECRET, { expiresIn: '1h' });

    res.json({
      success: true,
      message: 'Inicio de sesión exitoso',
      user: {
        id: usuario.id,
        nombre: usuario.nombre,
        email: usuario.email,
        rol: usuario.rol
      },
      token: token
    });

  } catch (error) {
    console.error('Error al autenticar usuario:', error);
    res.status(500).json({ error: 'Error en el servidor al autenticar usuario' });
  }
});

// Validar contraseña de rol
router.post('/validateRolePassword', (req, res) => {
  const { rol, rolePassword } = req.body;

  if (!rolePassword) {
    return res.status(400).json({ error: 'rolePassword es requerido' });
  }

  // Aquí va tu lógica para validar la contraseña de rol
  const validRolePasswords = {
    admin: 'admin1',
    tecnico: 'tecnico1'
  };

  if (validRolePasswords[rol] && validRolePasswords[rol] === rolePassword) {
    res.json({ success: true, message: 'Contraseña de rol válida', valid: true });
  } else {
    res.json({ success: false, message: 'Contraseña de rol inválida', valid: false });
  }
});

// Obtener registros combinados de dos tablas (ejemplo)
router.get('/datos', (req, res) => {
  connection.query(
    'SELECT car.id_carrera AS id, car.nombre AS carrera, gru.nombre AS grupo ' +
    'FROM tb_carrera AS car ' +
    'JOIN tb_grupos AS gru ON car.id_carrera = gru.id_carrera',
    (err, results) => {
      if (err) {
        console.error('Error al obtener registros:', err);
        res.status(500).json({ error: 'Error al obtener registros' });
        return;
      }
      res.json(results);
    }
  );
});

// Obtener todos los usuarios normales
router.get('/UsuariosNormales', (req, res) => {
  connection.query('SELECT * FROM usuarios WHERE rol = ?', ['usuario'], (err, results) => {
    if (err) {
      console.error('Error al obtener registros:', err);
      res.status(500).json({ error: 'Error al obtener registros' });
      return;
    }
    res.json(results);
  });
});



module.exports = router;
