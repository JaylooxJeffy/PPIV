const Usuario = require('../models/Usuario');
const Solicitud = require('../models/Solicitud');
const CodigoAcceso = require('../models/CodigoAcceso');
const { generarToken } = require('../middleware/auth');
const { sendNewRequestNotification } = require('../config/email');

class AuthController {
  static async registroConsultor(req, res) {
    const { username, email, password } = req.body;

    try {
      if (!username || !email || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }

      const usuarioExistente = await Usuario.buscarPorEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
      }

      const usernameExistente = await Usuario.buscarPorUsername(username);
      if (usernameExistente) {
        return res.status(400).json({ error: 'Ya existe un usuario con ese nombre de usuario' });
      }

      const passwordHash = await Usuario.hashPassword(password);
      const nuevoUsuario = await Usuario.crear(username, email, passwordHash, 'consultor');
      const token = generarToken(nuevoUsuario);

      res.status(201).json({
        mensaje: 'Usuario consultor registrado exitosamente',
        usuario: {
          id: nuevoUsuario.id,
          username: nuevoUsuario.username,
          email: nuevoUsuario.email,
          rol: nuevoUsuario.rol
        },
        token
      });
    } catch (error) {
      console.error('Error en registro consultor:', error);
      res.status(500).json({ error: 'Error al registrar usuario consultor' });
    }
  }

  static async solicitarRegistro(req, res) {
    const { username, email, rol } = req.body;

    try {
      if (!username || !email || !rol) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }

      if (rol !== 'analista' && rol !== 'administrador') {
        return res.status(400).json({ error: 'Rol inválido' });
      }

      const usuarioExistente = await Usuario.buscarPorEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
      }

      const solicitudExistente = await Solicitud.buscarPorEmail(email, 'pendiente');
      if (solicitudExistente) {
        return res.status(400).json({ error: 'Ya tienes una solicitud pendiente' });
      }

      const nuevaSolicitud = await Solicitud.crear(email, username, rol);
      await sendNewRequestNotification(nuevaSolicitud);

      res.status(201).json({
        mensaje: 'Solicitud enviada exitosamente',
        solicitud: {
          id: nuevaSolicitud.id,
          email: nuevaSolicitud.email,
          rol_solicitado: nuevaSolicitud.rol_solicitado,
          estado: nuevaSolicitud.estado
        }
      });
    } catch (error) {
      console.error('Error en solicitud:', error);
      res.status(500).json({ error: 'Error al procesar solicitud' });
    }
  }

  static async completarRegistro(req, res) {
    const { email, codigo, password } = req.body;

    try {
      if (!email || !codigo || !password) {
        return res.status(400).json({ error: 'Todos los campos son obligatorios' });
      }

      const verificacion = await CodigoAcceso.verificarValidez(codigo, email);
      
      if (!verificacion.valido) {
        return res.status(400).json({ error: verificacion.mensaje });
      }

      const solicitud = await Solicitud.buscarPorId(verificacion.codigo.id_solicitud);
      
      if (!solicitud || solicitud.estado !== 'aprobada') {
        return res.status(400).json({ error: 'Solicitud no válida' });
      }

      const usuarioExistente = await Usuario.buscarPorEmail(email);
      if (usuarioExistente) {
        return res.status(400).json({ error: 'Ya existe un usuario con ese email' });
      }

      const passwordHash = await Usuario.hashPassword(password);
      const nuevoUsuario = await Usuario.crear(solicitud.nombre_usuario, email, passwordHash, verificacion.codigo.rol);
      await CodigoAcceso.marcarComoUsado(verificacion.codigo.id);

      const token = generarToken(nuevoUsuario);

      res.status(201).json({
        mensaje: 'Registro completado exitosamente',
        usuario: {
          id: nuevoUsuario.id,
          username: nuevoUsuario.username,
          email: nuevoUsuario.email,
          rol: nuevoUsuario.rol
        },
        token
      });
    } catch (error) {
      console.error('Error al completar registro:', error);
      res.status(500).json({ error: 'Error al completar el registro' });
    }
  }

  static async login(req, res) {
    const { email, password } = req.body;

    try {
      if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
      }

      const usuario = await Usuario.buscarPorEmail(email);
      
      if (!usuario) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      if (!usuario.activo) {
        return res.status(401).json({ error: 'Usuario desactivado' });
      }

      const passwordValido = await Usuario.verificarPassword(password, usuario.password_hash);
      
      if (!passwordValido) {
        return res.status(401).json({ error: 'Credenciales inválidas' });
      }

      const token = generarToken(usuario);

      res.json({
        mensaje: 'Login exitoso',
        usuario: {
          id: usuario.id,
          username: usuario.username,
          email: usuario.email,
          rol: usuario.rol
        },
        token
      });
    } catch (error) {
      console.error('Error en login:', error);
      res.status(500).json({ error: 'Error al iniciar sesión' });
    }
  }

  static async verificarSolicitud(req, res) {
    const { email } = req.params;

    try {
      const solicitud = await Solicitud.buscarPorEmail(email, 'pendiente');
      
      if (!solicitud) {
        return res.status(404).json({ mensaje: 'No hay solicitudes pendientes' });
      }

      res.json({ solicitud });
    } catch (error) {
      console.error('Error al verificar solicitud:', error);
      res.status(500).json({ error: 'Error al verificar solicitud' });
    }
  }
}

module.exports = AuthController;