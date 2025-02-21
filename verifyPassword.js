const bcrypt = require('bcryptjs');

const hashedPassword = '$2b$10$OeHYqU9jnM7b57q6g37to.bktvDYO/9OGxQtCSaBUUUabOqT3jYtO'; // El hash de tu base de datos
const plainPassword = 'Ochodeagostodel2001%'; // La contraseña que intentas comparar

bcrypt.compare(plainPassword, hashedPassword, (err, isMatch) => {
  if (err) {
    console.error('Error al comparar contraseñas:', err);
  } else {
    console.log('La contraseña es correcta:', isMatch);
  }
});
