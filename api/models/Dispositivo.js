const { Sequelize, DataTypes } = require('sequelize');
const sequelize = require('../db'); // Asegúrate de que db.js está correctamente configurado

const Dispositivo = sequelize.define('Dispositivo', {
    nombre: {
        type: DataTypes.STRING,
        allowNull: false
    },
    tipo: {
        type: DataTypes.STRING,
        allowNull: false
    },
    ubicacion: {
        type: DataTypes.STRING
    },
    estado: {
        type: DataTypes.STRING
    },
    usuario_id: {
        type: DataTypes.INTEGER
    },
    fecha_instalacion: {
        type: DataTypes.DATE
    }
}, {
    tableName: 'dispositivos',
    timestamps: false
});

module.exports = Dispositivo;
