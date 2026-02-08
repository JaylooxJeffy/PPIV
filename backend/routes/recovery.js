const express = require('express');
const router = express.Router();
const recoveryController = require('../controllers/recoveryController');

/**
 * @route POST /api/recovery/buscar
 * @desc Buscar cuenta por email y generar preguntas de verificación
 * @access Public
 */
router.post('/buscar', recoveryController.buscarCuenta);

/**
 * @route POST /api/recovery/verificar
 * @desc Verificar respuestas de seguridad y enviar credenciales recuperadas
 * @access Public
 */
router.post('/verificar', recoveryController.verificarIdentidad);

module.exports = router;
