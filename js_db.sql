/*
SQLyog Ultimate v11.11 (64 bit)
MySQL - 5.5.5-10.4.28-MariaDB : Database - js_db
*********************************************************************
*/


/*!40101 SET NAMES utf8 */;

/*!40101 SET SQL_MODE=''*/;

/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;
USE DATABASE hidro_trak;
SELECT * FROM `hidro_trak`;
DROP DATABASE hidro_trak;

CREATE DATABASE hidro_trak;
USE hidro_trak;

-- Tabla de roles
CREATE TABLE roles_passwords (
    rol VARCHAR(50),
    role_password VARCHAR(255) NULL -- Contraseña para admins y técnicos
);

-- Tabla de usuarios (principal)

CREATE TABLE usuarios (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    email VARCHAR(100) UNIQUE,
    PASSWORD VARCHAR(255),
    telefono VARCHAR(20),
    direccion_completa TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    activo BOOLEAN DEFAULT TRUE,
    rol VARCHAR(50) -- Cambio de INT a VARCHAR para roles descriptivos
);
-- Tabla de dispositivos
CREATE TABLE dispositivos (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nombre VARCHAR(100),
    tipo VARCHAR(50),
    ubicacion TEXT,
    estado VARCHAR(50),
    usuario_id INT,
    fecha_instalacion DATETIME,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
);

-- Tabla de sensores
CREATE TABLE sensores (
    id INT PRIMARY KEY AUTO_INCREMENT,
    tipo VARCHAR(50),
    unidad_medida VARCHAR(50),
    rango_min FLOAT,
    rango_max FLOAT,
    dispositivo_id INT,
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
);

-- Tabla de registros
CREATE TABLE registros (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    dispositivo_id INT,
    sensor_id INT,
    accion TEXT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    detalles TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id),
    FOREIGN KEY (sensor_id) REFERENCES sensores(id)
);

-- Tabla de alertas
CREATE TABLE alertas (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    dispositivo_id INT,
    sensor_id INT,
    mensaje TEXT,
    tipo_alerta VARCHAR(50),
    prioridad VARCHAR(20),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id),
    FOREIGN KEY (sensor_id) REFERENCES sensores(id)
);

-- Tabla de historial de consumo
CREATE TABLE historial_consumo (
    id INT PRIMARY KEY AUTO_INCREMENT,
    usuario_id INT,
    dispositivo_id INT,
    consumo FLOAT,
    periodo VARCHAR(50),
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    comentarios TEXT,
    FOREIGN KEY (usuario_id) REFERENCES usuarios(id),
    FOREIGN KEY (dispositivo_id) REFERENCES dispositivos(id)
);

-- Tabla de registro de mediciones
CREATE TABLE registro_mediciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    sensor_id INT,
    valor FLOAT,
    fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP,
    calidad_dato VARCHAR(50),
    FOREIGN KEY (sensor_id) REFERENCES sensores(id)
);

-- Tabla de configuraciones
CREATE TABLE configuraciones (
    id INT PRIMARY KEY AUTO_INCREMENT,
    clave VARCHAR(100),
    valor TEXT,
    descripcion TEXT
);




SELECT * FROM usuarios;
SELECT * FROM sensores;
SELECT * FROM registros;
SELECT * FROM registro_mediciones;
SELECT * FROM historial_consumo;
SELECT * FROM dispositivos;
SELECT * FROM configuraciones;
SELECT * FROM alertas;
SELECT * FROM roles_passwords;


INSERT INTO roles_passwords (rol, role_password)
VALUES 
('admin', 'admin1'),
('tecnico', 'tecnico1');



