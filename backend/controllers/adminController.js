const Solicitud = require('../models/Solicitud');
const CodigoAcceso = require('../models/CodigoAcceso');
const Usuario = require('../models/Usuario');
const { sendAccessCode, sendRejectionEmail } = require('../config/email');

class AdminController {
  static async listarSolicitudesPendientes(req, res) {
    try {
      const solicitudes = await Solicitud.listarPendientes();
      res.json({ total: solicitudes.length, solicitudes });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al obtener solicitudes' });
    }
  }

  static async listarTodasSolicitudes(req, res) {
    try {
      const solicitudes = await Solicitud.listarTodas();
      res.json({ total: solicitudes.length, solicitudes });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al obtener solicitudes' });
    }
  }

  static async aprobarSolicitud(req, res) {
    const { id } = req.params;

    try {
      const solicitud = await Solicitud.buscarPorId(id);
      
      if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      if (solicitud.estado !== 'pendiente') {
        return res.status(400).json({ error: 'Solicitud ya procesada' });
      }

      const usuarioExistente = await Usuario.buscarPorEmail(solicitud.email);
      if (usuarioExistente) {
        return res.status(400).json({ error: 'Ya existe un usuario con este email' });
      }

      await CodigoAcceso.invalidarCodigosAnteriores(solicitud.email);
      const codigoData = await CodigoAcceso.crear(solicitud.email, solicitud.rol_solicitado, id);
      await Solicitud.aprobar(id);
      await sendAccessCode(solicitud.email, codigoData.codigo, solicitud.rol_solicitado);

      res.json({
        mensaje: 'Solicitud aprobada y código enviado',
        solicitud: { id: solicitud.id, email: solicitud.email, estado: 'aprobada' },
        codigo: { codigo: codigoData.codigo, expira_en: codigoData.fecha_expiracion }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al aprobar solicitud' });
    }
  }

  static async rechazarSolicitud(req, res) {
    const { id } = req.params;

    try {
      const solicitud = await Solicitud.buscarPorId(id);
      
      if (!solicitud) {
        return res.status(404).json({ error: 'Solicitud no encontrada' });
      }

      if (solicitud.estado !== 'pendiente') {
        return res.status(400).json({ error: 'Solicitud ya procesada' });
      }

      await Solicitud.rechazar(id);
      await sendRejectionEmail(solicitud.email, solicitud.nombre_usuario);

      res.json({
        mensaje: 'Solicitud rechazada',
        solicitud: { id: solicitud.id, email: solicitud.email, estado: 'rechazada' }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al rechazar solicitud' });
    }
  }

  static async regenerarCodigo(req, res) {
    const { id } = req.params;

    try {
      const solicitud = await Solicitud.buscarPorId(id);
      
      if (!solicitud || solicitud.estado !== 'aprobada') {
        return res.status(400).json({ error: 'Solo para solicitudes aprobadas' });
      }

      await CodigoAcceso.invalidarCodigosAnteriores(solicitud.email);
      const codigoData = await CodigoAcceso.crear(solicitud.email, solicitud.rol_solicitado, id);
      await sendAccessCode(solicitud.email, codigoData.codigo, solicitud.rol_solicitado);

      res.json({
        mensaje: 'Nuevo código generado',
        codigo: { codigo: codigoData.codigo, expira_en: codigoData.fecha_expiracion }
      });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al regenerar código' });
    }
  }

  static async listarUsuarios(req, res) {
    try {
      const usuarios = await Usuario.listarTodos();
      res.json({ total: usuarios.length, usuarios });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al obtener usuarios' });
    }
  }

  static async desactivarUsuario(req, res) {
    const { id } = req.params;

    try {
      const usuario = await Usuario.desactivar(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json({ mensaje: 'Usuario desactivado', usuario });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al desactivar usuario' });
    }
  }

  static async activarUsuario(req, res) {
    const { id } = req.params;

    try {
      const usuario = await Usuario.activar(id);
      if (!usuario) {
        return res.status(404).json({ error: 'Usuario no encontrado' });
      }
      res.json({ mensaje: 'Usuario activado', usuario });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al activar usuario' });
    }
  }

  static async contarPendientes(req, res) {
    try {
      const total = await Solicitud.contarPendientes();
      res.json({ total_pendientes: total });
    } catch (error) {
      console.error('Error:', error);
      res.status(500).json({ error: 'Error al contar solicitudes' });
    }
  }
}

module.exports = AdminController;