const express = require('express');
const moment = require('moment');
const multer = require('multer');
const XLSX = require('xlsx');
const connection = require('./db');

const router = express.Router();
const storage = multer.memoryStorage();
const upload = multer({ storage });
const jwt = require('jsonwebtoken');




// Función para validar y corregir fechas (seriales y malformadas)
const validarFecha = (fecha) => {
  // Manejar seriales de Excel
  if (!isNaN(fecha)) {
    const fechaConvertida = moment('2025-01-01').add(fecha - 2, 'days'); // Ajustar por el error de Excel
    console.warn('Fecha serial encontrada:', fecha, '-> Convertida:', fechaConvertida.format('YYYY-MM-DD HH:mm:ss'));
    return fechaConvertida.format('YYYY-MM-DD HH:mm:ss');
  }

  // Validar y corregir formatos malformados
  if (!moment(fecha, 'YYYY-MM-DD HH:mm:ss', true).isValid()) {
    console.warn('Fecha malformada encontrada:', fecha);
    return null; // Devolver null si la fecha no es procesable
  }

  // Fecha válida, devolverla formateada
  return moment(fecha).format('YYYY-MM-DD HH:mm:ss');
};

// Ruta: Subir y procesar archivo Excel
router.post('/upload-excel', upload.single('file'), (req, res) => {
  const file = req.file;
  if (!file) {
    return res.status(400).json({ error: 'No se cargó ningún archivo' });
  }

  try {
    const workbook = XLSX.read(file.buffer, { type: 'buffer' });
    const sheetNames = workbook.SheetNames; // Obtiene los nombres de las hojas en el archivo

    // Iterar sobre cada hoja y procesar los datos
    sheetNames.forEach(sheetName => {
      const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

      switch (sheetName.toLowerCase()) {
        case 'usuarios':
      sheetData.forEach(row => {
        const { id, nombre, email, password, telefono, direccion_completa, fecha_registro, activo, rol } = row;

        // Limpieza de contraseñas
        const passwordLimpio = password ? password.trim() : null;
        console.log('Contraseña procesada desde Excel:', passwordLimpio); // Log para confirmar las contraseñas procesadas

        connection.query(
          `INSERT INTO usuarios (id, nombre, email, password, telefono, direccion_completa, fecha_registro, activo, rol)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
           password = COALESCE(VALUES(password), password), 
           nombre = VALUES(nombre), email = VALUES(email),
           telefono = VALUES(telefono), direccion_completa = VALUES(direccion_completa),
           fecha_registro = VALUES(fecha_registro), activo = VALUES(activo), rol = VALUES(rol)`,
          [id || null, nombre, email, passwordLimpio, telefono, direccion_completa, validarFecha(fecha_registro), activo, rol],
          (err) => {
            if (err) console.error('Error al insertar usuario:', err);
          }
        );
      });
      break;

        case 'dispositivos':
          sheetData.forEach(row => {
            const { id, nombre, tipo, ubicacion, estado, usuario_id, fecha_instalacion } = row;
            connection.query(
              `INSERT INTO dispositivos (id, nombre, tipo, ubicacion, estado, usuario_id, fecha_instalacion)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
               nombre = VALUES(nombre), tipo = VALUES(tipo), ubicacion = VALUES(ubicacion),
               estado = VALUES(estado), usuario_id = VALUES(usuario_id), fecha_instalacion = VALUES(fecha_instalacion)`,
              [id || null, nombre, tipo, ubicacion, estado, usuario_id, validarFecha(fecha_instalacion)],
              (err) => {
                if (err) console.error('Error al insertar dispositivo:', err);
              }
            );
          });
          break;

        case 'sensores':
          sheetData.forEach(row => {
            const { id, tipo, unidad_medida, rango_min, rango_max, dispositivo_id } = row;
            connection.query(
              `INSERT INTO sensores (id, tipo, unidad_medida, rango_min, rango_max, dispositivo_id)
               VALUES (?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
               tipo = VALUES(tipo), unidad_medida = VALUES(unidad_medida),
               rango_min = VALUES(rango_min), rango_max = VALUES(rango_max), dispositivo_id = VALUES(dispositivo_id)`,
              [id || null, tipo, unidad_medida, rango_min, rango_max, dispositivo_id],
              (err) => {
                if (err) console.error('Error al insertar sensor:', err);
              }
            );
          });
          break;

        case 'registro_mediciones':
          sheetData.forEach(row => {
            const { id, sensor_id, valor, fecha_registro, calidad_dato } = row;
            connection.query(
              `INSERT INTO registro_mediciones (id, sensor_id, valor, fecha_registro, calidad_dato)
               VALUES (?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
               sensor_id = VALUES(sensor_id), valor = VALUES(valor),
               fecha_registro = VALUES(fecha_registro), calidad_dato = VALUES(calidad_dato)`,
              [id || null, sensor_id, valor, validarFecha(fecha_registro), calidad_dato],
              (err) => {
                if (err) console.error('Error al insertar en registro_mediciones:', err);
              }
            );
          });
          break;

        case 'registros':
          sheetData.forEach(row => {
            const { id, usuario_id, dispositivo_id, sensor_id, accion, fecha_registro, detalles } = row;
            connection.query(
              `INSERT INTO registros (id, usuario_id, dispositivo_id, sensor_id, accion, fecha_registro, detalles)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
               accion = VALUES(accion), fecha_registro = VALUES(fecha_registro), detalles = VALUES(detalles)`,
              [id || null, usuario_id, dispositivo_id, sensor_id, accion, validarFecha(fecha_registro), detalles],
              (err) => {
                if (err) console.error('Error al insertar registro:', err);
              }
            );
          });
          break;

        case 'alertas':
          sheetData.forEach(row => {
            const { id, usuario_id, dispositivo_id, sensor_id, mensaje, tipo_alerta, prioridad, fecha_registro } = row;
            connection.query(
              `INSERT INTO alertas (id, usuario_id, dispositivo_id, sensor_id, mensaje, tipo_alerta, prioridad, fecha_registro)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
               mensaje = VALUES(mensaje), tipo_alerta = VALUES(tipo_alerta), prioridad = VALUES(prioridad), fecha_registro = VALUES(fecha_registro)`,
              [id || null, usuario_id, dispositivo_id, sensor_id, mensaje, tipo_alerta, prioridad, validarFecha(fecha_registro)],
              (err) => {
                if (err) console.error('Error al insertar alerta:', err);
              }
            );
          });
          break;

        case 'historial_consumo':
          sheetData.forEach(row => {
            const { id, usuario_id, dispositivo_id, consumo, periodo, fecha_registro, comentarios } = row;
            connection.query(
              `INSERT INTO historial_consumo (id, usuario_id, dispositivo_id, consumo, periodo, fecha_registro, comentarios)
               VALUES (?, ?, ?, ?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
               consumo = VALUES(consumo), periodo = VALUES(periodo),
               fecha_registro = VALUES(fecha_registro), comentarios = VALUES(comentarios)`,
              [id || null, usuario_id, dispositivo_id, consumo, periodo, validarFecha(fecha_registro), comentarios],
              (err) => {
                if (err) console.error('Error al insertar en historial_consumo:', err);
              }
            );
          });
          break;

        case 'configuraciones':
          sheetData.forEach(row => {
            const { id, clave, valor, descripcion } = row;
            connection.query(
              `INSERT INTO configuraciones (id, clave, valor, descripcion)
               VALUES (?, ?, ?, ?)
               ON DUPLICATE KEY UPDATE
               clave = VALUES(clave), valor = VALUES(valor), descripcion = VALUES(descripcion)`,
              [id || null, clave, valor, descripcion],
              (err) => {
                if (err) console.error('Error al insertar en configuraciones:', err);
              }
            );
          });
          break;

        default:
          console.warn(`No se definió una lógica para la hoja: ${sheetName}`);
      }
    });

    res.status(200).json({ message: 'Archivo procesado y datos cargados correctamente' });
  } catch (error) {
    console.error('Error al procesar el archivo:', error);
    res.status(500).json({ error: 'Error al procesar el archivo' });
  }
});








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

// Buscar usuarios por todos los campos
router.get('/Users/buscar', (req, res) => {
  const { termino } = req.query;
  connection.query(
    `SELECT * FROM usuarios WHERE 
      nombre LIKE ? OR 
      email LIKE ? OR 
      telefono LIKE ? OR 
      direccion_completa LIKE ? OR 
      rol LIKE ?`, 
    Array(5).fill(`%${termino}%`), 
    (err, results) => {
      if (err) {
        console.error('Error al buscar usuarios:', err);
        res.status(500).json({ error: 'Error al buscar usuarios' });
        return;
      }
      res.json(results);
    }
  );
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

  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }

  try {
    const [results] = await connection.promise().query(
      'SELECT id, nombre, email, password, rol  FROM usuarios WHERE email = ?',
      [email]
    );

    if (results.length === 0) {
      return res.status(401).json({ error: 'Usuario no encontrado' });
    }

    const usuario = results[0];

    // Validar contraseña (si está hasheada, usa bcrypt en lugar de comparación directa)
    if (password !== usuario.password) {
      return res.status(401).json({ error: 'Contraseña incorrecta' });
    }

    // Generar token JWT
    // Generar token JWT con campos adicionales
  const token = jwt.sign(
    { 
      id: usuario.id, 
      email: usuario.email, 
      rol: usuario.rol, 
      telefono: usuario.telefono, 
      direccion_completa: usuario.direccion_completa, 
      fecha_registro: usuario.fecha_registro 
    },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Responder al cliente tras el inicio de sesión exitoso
  res.json({
    success: true,
    message: 'Inicio de sesión exitoso',
    user: {
      id: usuario.id,
      nombre: usuario.nombre,
      email: usuario.email,
      telefono: usuario.telefono,
      direccion_completa: usuario.direccion_completa,
      fecha_registro: usuario.fecha_registro,
      rol: usuario.rol
    },
    token
  });

    } catch (error) {
      console.error('Error en el login:', error);
      res.status(500).json({ error: 'Error interno del servidor' });
    }
  });

  //obtener mi perfil
  router.get('/mi-perfil', (req, res) => {
    const token = req.headers.authorization;

    if (!token) {
      return res.status(401).json({ error: 'No se proporcionó un token' });
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const userId = decoded.id;

      // Consulta del perfil del usuario
      connection.query('SELECT id, nombre, email, rol, telefono, direccion_completa, fecha_registro FROM usuarios WHERE id = ?', [userId], (err, userResults) => {
        if (err) {
          console.error('Error al obtener el perfil del usuario:', err);
          return res.status(500).json({ error: 'Error interno al obtener perfil' });
        }

        if (userResults.length === 0) {
          return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const userProfile = userResults[0];

        // Realiza consultas adicionales para el resto de las tablas
        const queries = {
          dispositivos: 'SELECT * FROM dispositivos WHERE usuario_id = ?',
          sensores: 'SELECT * FROM sensores WHERE dispositivo_id IN (SELECT id FROM dispositivos WHERE usuario_id = ?)',
          registros: 'SELECT * FROM registros WHERE usuario_id = ?',
          alertas: 'SELECT * FROM alertas WHERE usuario_id = ?',
          historial_consumo: 'SELECT * FROM historial_consumo WHERE usuario_id = ?',
          registro_mediciones: 'SELECT * FROM registro_mediciones WHERE sensor_id IN (SELECT id FROM sensores)',
          configuraciones: 'SELECT * FROM configuraciones'
        };

        const data = { perfil: userProfile };

        // Ejecuta todas las consultas y combina los resultados
        const queryPromises = Object.entries(queries).map(([key, query]) => {
          return new Promise((resolve, reject) => {
            connection.query(query, [userId], (err, results) => {
              if (err) {
                console.error(`Error al obtener ${key}:`, err);
                return reject(err);
              }
              data[key] = results.length > 0 ? results : [];
              resolve();
            });
          });
        });

        Promise.all(queryPromises)
          .then(() => res.json(data))
          .catch(() => res.status(500).json({ error: 'Error interno al obtener datos' }));
      });
    } catch (err) {
      console.error('Error al verificar el token:', err);
      return res.status(401).json({ error: 'Token inválido o expirado' });
    }
  });

  // Validar contraseña del rol
router.post('/validateRolePassword', (req, res) => {
  const { rol, rolePassword } = req.body;

  if (!rol || !rolePassword) {
    return res.status(400).json({ valid: false, error: 'Por favor, envía el rol y la contraseña' });
  }

  // Consulta a la base de datos
  connection.query(
    'SELECT role_password FROM roles_passwords WHERE rol = ? LIMIT 1',
    [rol],
    (err, results) => {
      if (err) {
        console.error('Error al validar contraseña del rol:', err);
        res.status(500).json({ valid: false, error: 'Error del servidor' });
        return;
      }

      // Verificar si se encontró el rol
      if (results.length === 0) {
        res.status(404).json({ valid: false, error: 'Rol no encontrado' });
        return;
      }

      const storedPassword = results[0].role_password;

      // Comparar la contraseña directamente
      if (rolePassword === storedPassword) {
        res.status(200).json({ valid: true });
      } else {
        res.status(403).json({ valid: false, error: 'Contraseña incorrecta' });
      }
    }
  );
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

///////////////////////Dispocitivos
// Obtener todos los dispositivos
router.get('/dispositivos', (req, res) => {
  connection.query('SELECT * FROM dispositivos', (err, results) => {
    if (err) {
      console.error('Error al obtener dispositivos:', err);
      res.status(500).json({ error: 'Error al obtener dispositivos' });
      return;
    }
    res.json(results);
  });
});

// Buscar dispositivos por todos los campos
router.get('/dispositivos/buscar', (req, res) => {
  const { termino } = req.query;
  connection.query(
    `SELECT * FROM dispositivos WHERE 
      nombre LIKE ? OR 
      tipo LIKE ? OR 
      ubicacion LIKE ? OR 
      estado LIKE ? OR 
      usuario_id LIKE ? OR 
      fecha_instalacion LIKE ?`, 
    Array(6).fill(`%${termino}%`), 
    (err, results) => {
      if (err) {
        console.error('Error al buscar dispositivos:', err);
        res.status(500).json({ error: 'Error al buscar dispositivos' });
        return;
      }
      res.json(results);
    }
  );
});

// Crear nuevo dispositivo
router.post('/dispositivos', (req, res) => {
  const { nombre, tipo, ubicacion, estado, usuario_id, fecha_instalacion } = req.body;
  if (!nombre || !tipo || !estado) {
    return res.status(400).json({ error: 'Nombre, tipo y estado son campos obligatorios' });
  }
  const nuevoDispositivo = { nombre, tipo, ubicacion, estado, usuario_id, fecha_instalacion };
  connection.query('INSERT INTO dispositivos SET ?', nuevoDispositivo, (err, results) => {
    if (err) {
      console.error('Error al crear dispositivo:', err);
      res.status(500).json({ error: 'Error al crear dispositivo' });
      return;
    }
    res.status(201).json({ message: 'Dispositivo creado exitosamente', dispositivoId: results.insertId });
  });
});

// Obtener un dispositivo por ID
router.get('/dispositivos/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM dispositivos WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener el dispositivo:', err);
      res.status(500).json({ error: 'Error al obtener el dispositivo' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Dispositivo no encontrado' });
      return;
    }
    res.json(results[0]);
  });
});

// Actualizar un dispositivo
router.put('/dispositivos/:id', (req, res) => {
  const id = req.params.id;
  const datosActualizados = req.body;
  if (!id || Object.keys(datosActualizados).length === 0) {
    return res.status(400).json({ error: 'Datos actualizados y ID son requeridos' });
  }
  connection.query('UPDATE dispositivos SET ? WHERE id = ?', [datosActualizados, id], (err, results) => {
    if (err) {
      console.error('Error al actualizar el dispositivo:', err);
      res.status(500).json({ error: 'Error al actualizar el dispositivo' });
      return;
    }
    res.json({ message: 'Dispositivo actualizado exitosamente' });
  });
});

// Eliminar un dispositivo
router.delete('/dispositivos/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM dispositivos WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar el dispositivo:', err);
      res.status(500).json({ error: 'Error al eliminar el dispositivo' });
      return;
    }
    res.json({ message: 'Dispositivo eliminado exitosamente' });
  });
});



/*registros*/
// Obtener todos los registros
router.get('/registros', (req, res) => {
  connection.query('SELECT * FROM registros', (err, results) => {
    if (err) {
      console.error('Error al obtener registros:', err);
      res.status(500).json({ error: 'Error al obtener registros' });
      return;
    }
    res.json(results);
  });
});

// Buscar registros por todos los campos
router.get('/registros/buscar', (req, res) => {
  const { termino } = req.query;
  connection.query(
    `SELECT * FROM registros WHERE 
      usuario_id LIKE ? OR 
      dispositivo_id LIKE ? OR 
      sensor_id LIKE ? OR 
      accion LIKE ? OR 
      fecha_registro LIKE ? OR 
      detalles LIKE ?`, 
    Array(6).fill(`%${termino}%`), 
    (err, results) => {
      if (err) {
        console.error('Error al buscar registros:', err);
        res.status(500).json({ error: 'Error al buscar registros' });
        return;
      }
      res.json(results);
    }
  );
});

// Crear nuevo registro
router.post('/registros', (req, res) => {
  const { usuario_id, dispositivo_id, sensor_id, accion, fecha_registro, detalles } = req.body;
  const nuevoRegistro = { usuario_id, dispositivo_id, sensor_id, accion, fecha_registro, detalles };
  connection.query('INSERT INTO registros SET ?', nuevoRegistro, (err, results) => {
    if (err) {
      console.error('Error al crear registro:', err);
      res.status(500).json({ error: 'Error al crear registro' });
      return;
    }
    res.status(201).json({ message: 'Registro creado exitosamente', registroId: results.insertId });
  });
});

// Obtener un registro por ID
router.get('/registros/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM registros WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener el registro:', err);
      res.status(500).json({ error: 'Error al obtener el registro' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }
    res.json(results[0]);
  });
});

// Actualizar un registro
router.put('/registros/:id', (req, res) => {
  const id = req.params.id;
  const datosActualizados = req.body;
  connection.query('UPDATE registros SET ? WHERE id = ?', [datosActualizados, id], (err, results) => {
    if (err) {
      console.error('Error al actualizar el registro:', err);
      res.status(500).json({ error: 'Error al actualizar el registro' });
      return;
    }
    res.json({ message: 'Registro actualizado exitosamente' });
  });
});

// Eliminar un registro
router.delete('/registros/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM registros WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar el registro:', err);
      res.status(500).json({ error: 'Error al eliminar el registro' });
      return;
    }
    res.json({ message: 'Registro eliminado exitosamente' });
  });
});

/*sensore*/

// Obtener todos los sensores
router.get('/sensores', (req, res) => {
  connection.query('SELECT * FROM sensores', (err, results) => {
    if (err) {
      console.error('Error al obtener sensores:', err);
      res.status(500).json({ error: 'Error al obtener sensores' });
      return;
    }
    res.json(results);
  });
});

// Buscar sensores por todos los campos
router.get('/sensores/buscar', (req, res) => {
  const { termino } = req.query;
  connection.query(
    `SELECT * FROM sensores WHERE 
      tipo LIKE ? OR 
      unidad_medida LIKE ? OR 
      rango_min LIKE ? OR 
      rango_max LIKE ? OR 
      dispositivo_id LIKE ?`, 
    Array(6).fill(`%${termino}%`), 
    (err, results) => {
      if (err) {
        console.error('Error al buscar sensores:', err);
        res.status(500).json({ error: 'Error al buscar sensores' });
        return;
      }
      res.json(results);
    }
  );
});

// Crear nuevo sensor
router.post('/sensores', (req, res) => {
  const { tipo, unidad_medida, rango_min, rango_max, dispositivo_id } = req.body;
  const nuevoSensor = { tipo, unidad_medida, rango_min, rango_max, dispositivo_id };
  connection.query('INSERT INTO sensores SET ?', nuevoSensor, (err, results) => {
    if (err) {
      console.error('Error al crear sensor:', err);
      res.status(500).json({ error: 'Error al crear sensor' });
      return;
    }
    res.status(201).json({ message: 'Sensor creado exitosamente', sensorId: results.insertId });
  });
});

// Obtener un sensor por ID
router.get('/sensores/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM sensores WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener el sensor:', err);
      res.status(500).json({ error: 'Error al obtener el sensor' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Sensor no encontrado' });
      return;
    }
    res.json(results[0]);
  });
});

// Actualizar un sensor
router.put('/sensores/:id', (req, res) => {
  const id = req.params.id;
  const datosActualizados = req.body;
  connection.query('UPDATE sensores SET ? WHERE id = ?', [datosActualizados, id], (err, results) => {
    if (err) {
      console.error('Error al actualizar el sensor:', err);
      res.status(500).json({ error: 'Error al actualizar el sensor' });
      return;
    }
    res.json({ message: 'Sensor actualizado exitosamente' });
  });
});

// Eliminar un sensor
router.delete('/sensores/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM sensores WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar el sensor:', err);
      res.status(500).json({ error: 'Error al eliminar el sensor' });
      return;
    }
    res.json({ message: 'Sensor eliminado exitosamente' });
  });
});

//Registros de las medidas api
// Obtener todos los registros de mediciones
router.get('/registros_mediciones', (req, res) => {
  connection.query('SELECT * FROM registro_mediciones', (err, results) => {
    if (err) {
      console.error('Error al obtener registros de mediciones:', err);
      res.status(500).json({ error: 'Error al obtener registros de mediciones' });
      return;
    }
    res.json(results);
  });
});

// Buscar registros de mediciones por todos los campos
router.get('/registros_mediciones/buscar', (req, res) => {
  const { termino } = req.query;
  connection.query(
    `SELECT * FROM registro_mediciones WHERE 
      sensor_id LIKE ? OR 
      valor LIKE ? OR 
      fecha_registro LIKE ? OR 
      calidad_dato LIKE ?`, 
    Array(4).fill(`%${termino}%`), 
    (err, results) => {
      if (err) {
        console.error('Error al buscar registros de mediciones:', err);
        res.status(500).json({ error: 'Error al buscar registros de mediciones' });
        return;
      }
      res.json(results);
    }
  );
});

// Crear un nuevo registro de medición
router.post('/registros_mediciones', (req, res) => {
  const { sensor_id, valor, calidad_dato } = req.body;
  const nuevoRegistro = { sensor_id, valor, calidad_dato };
  connection.query('INSERT INTO registro_mediciones SET ?', nuevoRegistro, (err, results) => {
    if (err) {
      console.error('Error al crear registro de medición:', err);
      res.status(500).json({ error: 'Error al crear registro de medición' });
      return;
    }
    res.status(201).json({ message: 'Registro de medición creado exitosamente', registroId: results.insertId });
  });
});

// Obtener un registro de medición por ID
router.get('/registros_mediciones/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM registro_mediciones WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener el registro de medición:', err);
      res.status(500).json({ error: 'Error al obtener el registro de medición' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Registro de medición no encontrado' });
      return;
    }
    res.json(results[0]);
  });
});

// Actualizar un registro de medición
router.put('/registros_mediciones/:id', (req, res) => {
  const id = req.params.id;
  const datosActualizados = req.body;
  connection.query('UPDATE registro_mediciones SET ? WHERE id = ?', [datosActualizados, id], (err, results) => {
    if (err) {
      console.error('Error al actualizar el registro de medición:', err);
      res.status(500).json({ error: 'Error al actualizar el registro de medición' });
      return;
    }
    res.json({ message: 'Registro de medición actualizado exitosamente' });
  });
});

// Eliminar un registro de medición
router.delete('/registros_mediciones/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM registro_mediciones WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar el registro de medición:', err);
      res.status(500).json({ error: 'Error al eliminar el registro de medición' });
      return;
    }
    res.json({ message: 'Registro de medición eliminado exitosamente' });
  });
});

//historial de consumo
// Obtener todos los registros de historial de consumo
router.get('/historial_consumo', (req, res) => {
  connection.query('SELECT * FROM historial_consumo', (err, results) => {
    if (err) {
      console.error('Error al obtener historial de consumo:', err);
      res.status(500).json({ error: 'Error al obtener historial de consumo' });
      return;
    }
    res.json(results);
  });
});

// Crear un nuevo registro de historial de consumo
router.post('/historial_consumo', (req, res) => {
  const { usuario_id, dispositivo_id, consumo, periodo, comentarios } = req.body;
  const nuevoRegistro = { usuario_id, dispositivo_id, consumo, periodo, comentarios };
  connection.query('INSERT INTO historial_consumo SET ?', nuevoRegistro, (err, results) => {
    if (err) {
      console.error('Error al crear registro de historial de consumo:', err);
      res.status(500).json({ error: 'Error al crear registro de historial de consumo' });
      return;
    }
    res.status(201).json({ message: 'Registro creado exitosamente', id: results.insertId });
  });
});

router.get('/historial/buscar', (req, res) => {
  const { termino } = req.query;
  
  connection.query(
    `SELECT * FROM historial_consumo WHERE 
      id LIKE ? OR 
      usuario_id LIKE ? OR 
      dispositivo_id LIKE ? OR 
      consumo LIKE ? OR 
      periodo LIKE ? OR 
      fecha_registro LIKE ? OR 
      comentarios LIKE ?`, 
    Array(7).fill(`%${termino}%`), 
    (err, results) => {
      if (err) {
        console.error('Error al buscar en historial de consumo:', err);
        res.status(500).json({ error: 'Error en la búsqueda' });
        return;
      }
      res.json(results);
    }
  );
});


// Obtener un registro por ID
router.get('/historial_consumo/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM historial_consumo WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener el registro:', err);
      res.status(500).json({ error: 'Error al obtener el registro' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Registro no encontrado' });
      return;
    }
    res.json(results[0]);
  });
});

// Actualizar un registro
router.put('/historial_consumo/:id', (req, res) => {
  const id = req.params.id;
  const datosActualizados = req.body;
  connection.query('UPDATE historial_consumo SET ? WHERE id = ?', [datosActualizados, id], (err, results) => {
    if (err) {
      console.error('Error al actualizar el registro:', err);
      res.status(500).json({ error: 'Error al actualizar el registro' });
      return;
    }
    res.json({ message: 'Registro actualizado exitosamente' });
  });
});

// Eliminar un registro
router.delete('/historial_consumo/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM historial_consumo WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar el registro:', err);
      res.status(500).json({ error: 'Error al eliminar el registro' });
      return;
    } 
    res.json({ message: 'Registro eliminado exitosamente' });
  });
});




//configuraciones
// Buscar registros en la tabla configuraciones por clave, valor o descripción
router.get('/configuraciones/buscar', (req, res) => {
  const { termino } = req.query; // Obtener el término de búsqueda
  if (!termino) {
    return res.status(400).json({ error: 'El término de búsqueda es requerido.' });
  }

  // Consulta SQL para buscar configuraciones
  connection.query(
    `SELECT * FROM configuraciones WHERE 
      clave LIKE ? OR 
      valor LIKE ? OR 
      descripcion LIKE ?`, 
    Array(3).fill(`%${termino}%`), // Busca en las columnas clave, valor y descripción
    (err, results) => {
      if (err) {
        console.error('Error al buscar en configuraciones:', err);
        return res.status(500).json({ error: 'Error al buscar en configuraciones.' });
      }
      res.json(results); // Retornar los resultados
    }
  );
});



//configuraciones
// Obtener todas las configuraciones
router.get('/configuraciones', (req, res) => {
  connection.query('SELECT * FROM configuraciones', (err, results) => {
    if (err) {
      console.error('Error al obtener configuraciones:', err);
      res.status(500).json({ error: 'Error al obtener configuraciones' });
      return;
    }
    res.json(results);
  });
});

// Obtener una configuración por ID
router.get('/configuraciones/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM configuraciones WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener configuración:', err);
      res.status(500).json({ error: 'Error al obtener configuración' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Configuración no encontrada' });
      return;
    }
    res.json(results[0]);
  });
});

// Crear una nueva configuración
router.post('/configuraciones', (req, res) => {
  const { clave, valor, descripcion } = req.body;
  const nuevaConfiguracion = { clave, valor, descripcion };
  connection.query('INSERT INTO configuraciones SET ?', nuevaConfiguracion, (err, results) => {
    if (err) {
      console.error('Error al crear configuración:', err);
      res.status(500).json({ error: 'Error al crear configuración' });
      return;
    }
    res.status(201).json({ message: 'Configuración creada exitosamente', id: results.insertId });
  });
});

// Actualizar una configuración existente
router.put('/configuraciones/:id', (req, res) => {
  const id = req.params.id;
  const { clave, valor, descripcion } = req.body;
  const configuracionActualizada = { clave, valor, descripcion };
  connection.query('UPDATE configuraciones SET ? WHERE id = ?', [configuracionActualizada, id], (err, results) => {
    if (err) {
      console.error('Error al actualizar configuración:', err);
      res.status(500).json({ error: 'Error al actualizar configuración' });
      return;
    }
    res.json({ message: 'Configuración actualizada exitosamente' });
  });
});

// Eliminar una configuración
router.delete('/configuraciones/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM configuraciones WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar configuración:', err);
      res.status(500).json({ error: 'Error al eliminar configuración' });
      return;
    }
    res.json({ message: 'Configuración eliminada exitosamente' });
  });
});

// Buscar configuraciones dinámicamente por cualquier campo
router.get('/configuraciones/buscar', (req, res) => {
  const { termino } = req.query;
  connection.query(
    `SELECT * FROM configuraciones WHERE 
      clave LIKE ? OR 
      valor LIKE ? OR 
      descripcion LIKE ?`, 
    Array(3).fill(`%${termino}%`), 
    (err, results) => {
      if (err) {
        console.error('Error al buscar configuraciones:', err);
        res.status(500).json({ error: 'Error al buscar configuraciones' });
        return;
      }
      res.json(results);
    }
  );
});

//alertas
// Obtener todas las alertas
router.get('/alertas', (req, res) => {
  connection.query('SELECT * FROM alertas', (err, results) => {
    if (err) {
      console.error('Error al obtener las alertas:', err);
      res.status(500).json({ error: 'Error al obtener las alertas' });
      return;
    }
    res.json(results);
  });
});

// Obtener una alerta por ID
router.get('/alertas/:id', (req, res) => {
  const id = req.params.id;
  connection.query('SELECT * FROM alertas WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al obtener la alerta:', err);
      res.status(500).json({ error: 'Error al obtener la alerta' });
      return;
    }
    if (results.length === 0) {
      res.status(404).json({ error: 'Alerta no encontrada' });
      return;
    }
    res.json(results[0]);
  });
});

// Crear una nueva alerta
router.post('/alertas', (req, res) => {
  const { usuario_id, dispositivo_id, sensor_id, mensaje, tipo_alerta, prioridad } = req.body;
  const nuevaAlerta = { usuario_id, dispositivo_id, sensor_id, mensaje, tipo_alerta, prioridad };
  connection.query('INSERT INTO alertas SET ?', nuevaAlerta, (err, results) => {
    if (err) {
      console.error('Error al crear la alerta:', err);
      res.status(500).json({ error: 'Error al crear la alerta' });
      return;
    }
    res.status(201).json({ message: 'Alerta creada exitosamente', id: results.insertId });
  });
});

// Actualizar una alerta existente
router.put('/alertas/:id', (req, res) => {
  const id = req.params.id;
  const { usuario_id, dispositivo_id, sensor_id, mensaje, tipo_alerta, prioridad } = req.body;
  const alertaActualizada = { usuario_id, dispositivo_id, sensor_id, mensaje, tipo_alerta, prioridad };
  connection.query('UPDATE alertas SET ? WHERE id = ?', [alertaActualizada, id], (err, results) => {
    if (err) {
      console.error('Error al actualizar la alerta:', err);
      res.status(500).json({ error: 'Error al actualizar la alerta' });
      return;
    }
    res.json({ message: 'Alerta actualizada exitosamente' });
  });
});

// Eliminar una alerta
router.delete('/alertas/:id', (req, res) => {
  const id = req.params.id;
  connection.query('DELETE FROM alertas WHERE id = ?', [id], (err, results) => {
    if (err) {
      console.error('Error al eliminar la alerta:', err);
      res.status(500).json({ error: 'Error al eliminar la alerta' });
      return;
    }
    res.json({ message: 'Alerta eliminada exitosamente' });
  });
});

// Buscar alertas por cualquier campo
router.get('/alertas/buscar', (req, res) => {
  const { termino } = req.query;
  console.log("Término recibido:", termino); // Log para verificar el término

  if (!termino) {
    return res.status(400).json({ error: 'El término de búsqueda es requerido.' });
  }

  connection.query(
    `SELECT * FROM alertas WHERE 
      id LIKE ? OR 
      usuario_id LIKE ? OR 
      dispositivo_id LIKE ? OR 
      sensor_id LIKE ? OR 
      mensaje LIKE ? OR 
      tipo_alerta LIKE ? OR 
      prioridad LIKE ? OR 
      fecha_registro LIKE ?`,
    Array(8).fill(`%${termino}%`),
    (err, results) => {
      if (err) {
        console.error('Error al buscar alertas:', err);
        return res.status(500).json({ error: 'Error al buscar alertas.' });
      }

      console.log("Resultados encontrados:", results); // Log para depuración
      res.json(results);
    }
  );
});



module.exports = router;
