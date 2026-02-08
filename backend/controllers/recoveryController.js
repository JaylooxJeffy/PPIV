const pool = require('../config/database');
const { sendRecoveryEmail } = require('../config/email');
const crypto = require('crypto');

const buscarCuenta = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'El email es requerido'
      });
    }

    const result = await pool.query(
      'SELECT id, username as nombre_completo, email, fecha_creacion as fecha_registro, ultimo_acceso, activo FROM usuarios WHERE email = $1',
      [email.toLowerCase()]
    );

    if (result.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Si existe una cuenta con este email, recibiras un correo con las instrucciones.',
        emailExists: false
      });
    }

    const usuario = result.rows[0];

    if (!usuario.activo) {
      return res.status(403).json({
        success: false,
        message: 'Esta cuenta esta desactivada. Contacta al administrador.'
      });
    }

    const actividadResult = await pool.query(
      'SELECT COUNT(*) as total_reportes, MAX(fecha_creacion) as ultimo_reporte FROM reportes WHERE creado_por = $1',
      [usuario.id]
    );

    const actividad = actividadResult.rows[0];
    const preguntas = [];

    if (usuario.fecha_registro) {
      const fechaRegistro = new Date(usuario.fecha_registro);
      const opciones = generarOpcionesFecha(fechaRegistro);
      preguntas.push({
        id: 'fecha_registro',
        pregunta: 'En que mes y año te registraste?',
        tipo: 'opciones',
        respuestaCorrecta: fechaRegistro.getMonth() + '-' + fechaRegistro.getFullYear(),
        opciones: opciones
      });
    }

    preguntas.push({
      id: 'nombre',
      pregunta: 'Cual es tu nombre de usuario registrado?',
      tipo: 'texto',
      respuestaCorrecta: usuario.nombre_completo.toLowerCase()
    });

    if (actividad.total_reportes !== undefined) {
      preguntas.push({
        id: 'actividad',
        pregunta: 'Aproximadamente cuantos reportes has creado?',
        tipo: 'opciones',
        respuestaCorrecta: getRangoReportes(parseInt(actividad.total_reportes)),
        opciones: [
          { valor: '0', texto: 'Ninguno' },
          { valor: '1-5', texto: 'Entre 1 y 5' },
          { valor: '6-10', texto: 'Entre 6 y 10' },
          { valor: '11+', texto: 'Mas de 10' }
        ]
      });
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await pool.query(
      'INSERT INTO tokens_recuperacion (usuario_id, token, expira_en, usado) VALUES ($1, $2, $3, false)',
      [usuario.id, verificationToken, expiresAt]
    );

    res.status(200).json({
      success: true,
      emailExists: true,
      preguntas: preguntas,
      token: verificationToken,
      message: 'Por favor responde las preguntas de verificacion.'
    });

  } catch (error) {
    console.error('Error al buscar cuenta:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la solicitud'
    });
  }
};

const verificarIdentidad = async (req, res) => {
  try {
    const { email, token, respuestas } = req.body;

    if (!email || !token || !respuestas) {
      return res.status(400).json({
        success: false,
        message: 'Datos incompletos'
      });
    }

    const tokenResult = await pool.query(
      'SELECT tr.*, u.id as usuario_id, u.username as nombre_completo, u.email, u.fecha_creacion as fecha_registro FROM tokens_recuperacion tr JOIN usuarios u ON tr.usuario_id = u.id WHERE tr.token = $1 AND u.email = $2 AND tr.usado = false AND tr.expira_en > NOW()',
      [token, email.toLowerCase()]
    );

    if (tokenResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Token invalido o expirado'
      });
    }

    const usuario = tokenResult.rows[0];

    const actividadResult = await pool.query(
      'SELECT COUNT(*) as total_reportes FROM reportes WHERE creado_por = $1',
      [usuario.usuario_id]
    );

    const totalReportes = parseInt(actividadResult.rows[0].total_reportes);

    let respuestasCorrectas = 0;
    let totalPreguntas = 0;

    for (const respuesta of respuestas) {
      totalPreguntas++;
      
      if (respuesta.id === 'fecha_registro') {
        const fechaRegistro = new Date(usuario.fecha_registro);
        const respuestaEsperada = fechaRegistro.getMonth() + '-' + fechaRegistro.getFullYear();
        if (respuesta.valor === respuestaEsperada) {
          respuestasCorrectas++;
        }
      }
      
      if (respuesta.id === 'nombre') {
        if (respuesta.valor.toLowerCase().trim() === usuario.nombre_completo.toLowerCase().trim()) {
          respuestasCorrectas++;
        }
      }
      
      if (respuesta.id === 'actividad') {
        const rangoReal = getRangoReportes(totalReportes);
        if (respuesta.valor === rangoReal) {
          respuestasCorrectas++;
        }
      }
    }

    const umbralMinimo = totalPreguntas === 2 ? 2 : 2;
    
    if (respuestasCorrectas < umbralMinimo) {
      return res.status(401).json({
        success: false,
        message: 'Las respuestas no coinciden con nuestros registros. Por favor intenta nuevamente o contacta al administrador.'
      });
    }

    const nuevaPassword = generarPasswordTemporal();
    const bcrypt = require('bcrypt');
    const passwordHash = await bcrypt.hash(nuevaPassword, 10);

    await pool.query(
      'UPDATE usuarios SET password_hash = $1 WHERE id = $2',
      [passwordHash, usuario.usuario_id]
    );

    await pool.query(
      'UPDATE tokens_recuperacion SET usado = true, fecha_uso = NOW() WHERE token = $1',
      [token]
    );

    await pool.query(
      'INSERT INTO auditoria (usuario_id, accion, tabla_afectada, detalles) VALUES ($1, $2, $3, $4)',
      [usuario.usuario_id, 'Recuperacion de credenciales', 'usuarios', JSON.stringify({ email: usuario.email, metodo: 'verificacion_preguntas' })]
    );

    const emailEnviado = await sendRecoveryEmail(
      usuario.email,
      usuario.nombre_completo,
      nuevaPassword,
      totalReportes,
      new Date(usuario.fecha_registro)
    );

    if (!emailEnviado) {
      return res.status(500).json({
        success: false,
        message: 'Error al enviar el correo de recuperacion'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Credenciales recuperadas exitosamente',
      info: {
        nombre: usuario.nombre_completo,
        email: usuario.email,
        fecha_registro: usuario.fecha_registro,
        actividad: totalReportes + ' reporte(s) creado(s)'
      }
    });

  } catch (error) {
    console.error('Error al verificar identidad:', error);
    res.status(500).json({
      success: false,
      message: 'Error al procesar la verificacion'
    });
  }
};

function generarOpcionesFecha(fechaReal) {
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  
  const mesReal = fechaReal.getMonth();
  const anioReal = fechaReal.getFullYear();
  
  const opciones = [
    {
      valor: mesReal + '-' + anioReal,
      texto: meses[mesReal] + ' ' + anioReal
    }
  ];
  
  for (let i = 0; i < 3; i++) {
    let mesFalso = (mesReal + (i + 1) * 3) % 12;
    let anioFalso = anioReal + Math.floor((mesReal + (i + 1) * 3) / 12);
    
    opciones.push({
      valor: mesFalso + '-' + anioFalso,
      texto: meses[mesFalso] + ' ' + anioFalso
    });
  }
  
  return opciones.sort(function() { return Math.random() - 0.5; });
}

function getRangoReportes(cantidad) {
  if (cantidad === 0) return '0';
  if (cantidad <= 5) return '1-5';
  if (cantidad <= 10) return '6-10';
  return '11+';
}

function generarPasswordTemporal() {
  const caracteres = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < 12; i++) {
    password += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
  }
  return password;
}

module.exports = {
  buscarCuenta,
  verificarIdentidad
};
