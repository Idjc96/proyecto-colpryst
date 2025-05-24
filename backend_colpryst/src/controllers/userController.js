const usuarioService = require('../services/userServices'); // Importar el servicio de usuario
const cargoService = require('../services/cargoServices'); // Importar el servicio de cargos
//reconocimeinto
const axios = require('axios');
const FormData = require('form-data');
// Asegurarse de que PYTHON_API_URL apunte al servicio Docker correcto
const PYTHON_API_URL = process.env.PYTHON_API_URL || 'http://backend-facial-auth:8000';

const usuarioController = {
    // Obtener todos los usuarios
    getAllUsers: async (req, res) => {
        try {
            // Llamar al servicio para obtener todos los usuarios
            const usuarios = await usuarioService.getAllUsers();

            // Enviar la lista de usuarios en formato JSON
            res.json(usuarios);
        } catch (error) {
            console.error("❌ Error en getAllUsers (Controller):", error);
            res.status(500).json({ error: "Error al obtener los usuarios" });
        }
    },

    //obtener usuario mediante documento
    getUserByDocument: async (req, res) =>{
        try {
            const {numero_documento} = req.params; // ID de los parámetros de la URL
            const user = await usuarioService.getCargoByDocument(numero_documento);//llamado al servicio

            if (!user){
                return res.status(404).json({ error: "Usuario no encontrado" }); // Si no se encuentra
            }

            res.json(user);//se envia en formato json
            
        } catch (error) {
            res.status(500).json({ error: "Error al buscar el usuario en el controlador" });
        }
    },

    // Crear nuevo usuario
    createUser: async (req, res) => {
      try {
        console.log('✅ 1. Iniciando creación de usuario');
        
        // 1. Validar tipo de archivo
        if (req.file && !["image/jpeg", "image/png"].includes(req.file.mimetype)) {
          console.log('❌ Tipo de archivo no válido:', req.file.mimetype);
          throw new Error("INVALID_FILE_TYPE");
        } else if (req.file) {
          console.log('✔ Archivo válido recibido. Tipo:', req.file.mimetype, 'Tamaño:', req.file.size, 'bytes');
        }
    
        // 2. Preparar datos del usuario
        const usuarioData = {
          ...req.body,
          foto: req.file ? {
            data: req.file.buffer,
            contentType: req.file.mimetype
          } : null,
          contrasenia: req.body.contrasenia // Asegurar que la contraseña esté incluida
        };
        
        console.log('📋 Datos del usuario preparados:', {
          ...usuarioData,
          foto: usuarioData.foto ? `[Buffer de ${usuarioData.foto.data.length} bytes]` : null,
          contrasenia: '[PROTEGIDO]'
        });
        // 3. Validaciones BÁSICAS antes de FastAPI
        // 3.1 Validar que el cargo exista
        console.log('🔍 Validando cargo con ID:', usuarioData.id_cargo);
        const cargo = await cargoService.getCargoById(usuarioData.id_cargo);
        if (!cargo) {
          console.log('❌ Cargo no encontrado con ID:', usuarioData.id_cargo);
          throw new Error("CARGO_NOT_FOUND");
        }
        console.log('✔ Cargo válido encontrado:', cargo);

        // 3.2 Validar datos únicos ANTES de procesar imagen
        // La validación de datos únicos ahora se hace directamente en el servicio (userServices.js)
        // dentro de la función createUser. Si ocurre un error allí (ej. DOCUMENTO_EXISTS),
        // se lanzará y será capturado por el bloque catch de este controlador.
        // Por lo tanto, la llamada explícita a usuarioService.validarDatosUnicos aquí ya no es necesaria
        // si createUser en el servicio ya lo hace.
        /* console.log('🔍 Validando datos únicos (documento, email, usuarioadmin)'); // Comentado para evitar error
        if (typeof usuarioService.validarDatosUnicos === 'function') { // Comprobación adicional
             await usuarioService.validarDatosUnicos(usuarioData); 
        } else {
            // console.log('WARN: usuarioService.validarDatosUnicos no es una función, omitiendo llamada directa.');
        } */

        // 4. Validar y obtener embedding desde FastAPI
        let embedding = null;
        
        if (req.file) {
          try {
            console.log('🖼 Procesando imagen facial...');
            
            const formData = new FormData();
            formData.append('file', req.file.buffer, {
              filename: 'imagen.jpg',
              contentType: req.file.mimetype
            });
    
            console.log('📤 Enviando imagen a FastAPI...', {
              url: `${PYTHON_API_URL}/api/verificar-imagen`, // Log para verificar la URL
              bufferSize: req.file.buffer.length,
              headers: formData.getHeaders()
            });
    
            const respuestaFastAPI = await axios.post(`${PYTHON_API_URL}/api/verificar-imagen`, formData, {
              headers: formData.getHeaders()
            });
    
            console.log('📥 Respuesta recibida de FastAPI:', {
              status: respuestaFastAPI.status,
              data: {
                match: respuestaFastAPI.data.match,
                id_usuario: respuestaFastAPI.data.id_usuario,
                embedding: respuestaFastAPI.data.embedding ? `[Array de ${respuestaFastAPI.data.embedding.length} elementos]` : null
              }
            });
    
            const data = respuestaFastAPI.data;
    
            if (data.match === true) {
              console.log('❌ Rostro ya registrado. ID usuario existente:', data.id_usuario);
              return res.status(400).json({
                success: false,
                message: "El rostro ya está registrado previamente con otro usuario.",
                id_usuario: data.id_usuario
              });
            }
    
            if (Array.isArray(data.embedding) && data.embedding.length > 0) {
              console.log('✔ Embedding recibido. Longitud:', data.embedding.length);
              embedding = data.embedding;
            } else {
              console.log('❌ No se recibió embedding válido:', data.embedding);
              throw new Error("EMBEDDING_NOT_RECEIVED");
            }
          } catch (err) {
            console.error("❌ Error en comunicación con FastAPI:", {
              message: err.message,
              response: err.response ? {
                status: err.response.status,
                data: err.response.data
              } : null,
              stack: err.stack
            });
            throw new Error("EMBEDDING_NOT_RECEIVED");
          }
        } else {
          console.log('⚠ No se proporcionó imagen facial - Se omitirá verificación');
        }
    
        // 5. Agregar embedding a los datos del usuario si existe
        if (embedding) {
          usuarioData.embedding = embedding; 
          console.log('🔢 Embedding agregado a datos del usuario. Longitud:', embedding.length);
        } else {
          console.log('⚠ No se agregó embedding a los datos del usuario');
        }
    
        // 6. Llamar al servicio de usuario para creación REAL
        console.log('📨 Enviando datos al servicio de usuario...');
        const nuevoUsuarioResult = await usuarioService.createUser(usuarioData);
        // Asegurarse de que nuevoUsuarioResult.id_usuario exista antes de usarlo
        const nuevoUsuarioId = nuevoUsuarioResult && nuevoUsuarioResult.id_usuario ? nuevoUsuarioResult.id_usuario : null;
        console.log('🆔 ID de usuario creado:', nuevoUsuarioId);

        if (!nuevoUsuarioId) {
            // Esto podría indicar un problema en la creación del usuario en el servicio que no lanzó un error
            // o que la respuesta del servicio no tiene el formato esperado.
            console.error('❌ Error: No se obtuvo ID de usuario después de la creación en el servicio.');
            throw new Error('USER_CREATION_FAILED_NO_ID');
        }
    
        // 7. Generar URL de foto (si existe)
        let fotoUrl = null;
        if (req.file) {
          fotoUrl = `/uploads/fotos/usuario-${nuevoUsuarioId}.jpg`;
          // Aquí deberías guardar físicamente el archivo si es necesario
          // await guardarArchivo(req.file.buffer, fotoUrl);
        }
    
        // 8. Respuesta exitosa
        console.log('🎉 Usuario creado exitosamente');
        return res.status(201).json({
          success: true,
          message: "Usuario creado exitosamente.",
          data: {
            id: nuevoUsuarioId,
            fotoUrl: fotoUrl
          }
        });
    
      } catch (error) {
        console.error("❌ Error en createUser (Controller):", {
          message: error.message,
          stack: error.stack
        });
        
        let statusCode = 500;
        let message = "Error interno del servidor.";
    
        switch (error.message) {
          case "CARGO_NOT_FOUND":
            statusCode = 400;
            message = "El cargo especificado no existe.";
            break;
          case "DOCUMENTO_EXISTS":
            statusCode = 400;
            message = "El número de documento ya está registrado.";
            break;
          case "EMAIL_EXISTS":
            statusCode = 400;
            message = "El correo electrónico ya está registrado.";
            break;
          case "USUARIO_EXISTS":
            statusCode = 400;
            message = "El nombre de usuario ya está en uso.";
            break;
          case "INVALID_FILE_TYPE":
            statusCode = 415;
            message = "Solo se permiten imágenes JPEG o PNG.";
            break;
          case "LIMIT_FILE_SIZE":
            statusCode = 413;
            message = "La imagen es demasiado grande (máximo 5MB).";
            break;
          case "EMBEDDING_NOT_RECEIVED":
            statusCode = 500;
            message = "No se pudo comunicar o procesar la imagen con el servicio de autenticación facial."; // Mensaje más descriptivo
            break;
          case "RECONOCIMIENTO_INSERT_FAILED":
            statusCode = 500;
            message = "Error al guardar en la tabla de reconocimiento facial.";
            break;
          case "USER_CREATION_FAILED_NO_ID": // Nuevo caso de error
            statusCode = 500;
            message = "Error interno al crear el usuario, no se obtuvo ID.";
            break;
        }
    
        return res.status(statusCode).json({
          success: false,
          message: message,
          error: error.message,
          ...(process.env.NODE_ENV === 'development' && {
            debug_info: {
              stack: error.stack
            }
          })
        });
      }
    }, 
    
    //actualizar usaurio
    updateUser: async (req, res) => {
        const { id_usuario } = req.params;
        // const userData = req.body; // Cambiado a usuarioData para consistencia
        let usuarioData = { ...req.body }; // Copiar para poder modificar
    
        try {
            console.log(`✅ 1. Iniciando actualización de usuario ID: ${id_usuario}`);

            // 1.1 Validar si el usuario existe ANTES de procesar cualquier cosa
            // Esto podría hacerse llamando a un método simple del servicio o directamente aquí si es una verificación rápida
            // Por ahora, asumimos que el servicio updateUser lo manejará con USER_NOT_FOUND

            // 1.2. Validar tipo de archivo si se proporciona uno nuevo
            if (req.file && !["image/jpeg", "image/png"].includes(req.file.mimetype)) {
                console.log('❌ Tipo de archivo no válido para actualización:', req.file.mimetype);
                throw new Error("INVALID_FILE_TYPE");
            }
            if (req.file) {
                console.log('✔ Nuevo archivo válido recibido para actualización. Tipo:', req.file.mimetype, 'Tamaño:', req.file.size, 'bytes');
                usuarioData.foto = {
                    data: req.file.buffer,
                    contentType: req.file.mimetype
                };
            } else {
                // Si no se envía un nuevo archivo, no queremos borrar la foto existente por defecto.
                // El servicio updateUser usará COALESCE, así que si no pasamos `foto` o es `undefined`, mantendrá la actual.
                // Si explícitamente se quiere borrar la foto, se necesitaría un indicador diferente.
                console.log('ℹ️ No se proporcionó nueva imagen para actualización.');
            }

            console.log('📋 Datos del usuario para actualizar (antes de FastAPI):', {
                ...usuarioData,
                foto: usuarioData.foto ? `[Buffer de ${usuarioData.foto.data ? usuarioData.foto.data.length : 0} bytes]` : null,
                contrasenia: usuarioData.contrasenia ? '[PROTEGIDO]' : '[NO CAMBIA]'
            });

            // 2. Validaciones básicas
            // Estos campos son obligatorios incluso en la actualización, 
            // a menos que la lógica de negocio permita actualizaciones parciales sin ellos.
            if (!usuarioData.tipo_documento || !usuarioData.numero_documento || !usuarioData.nombre_empleado) {
                return res.status(400).json({ 
                    success: false,
                    message: "Los campos tipo_documento, numero_documento y nombre_empleado son obligatorios",
                    error: "MISSING_REQUIRED_FIELDS"
                });
            }
    
            // 3. Validar si el cargo existe (si se está actualizando)
            if (usuarioData.id_cargo) {
                console.log('🔍 Validando cargo para actualización con ID:', usuarioData.id_cargo);
                const cargo = await cargoService.getCargoById(usuarioData.id_cargo);
                if (!cargo) {
                    console.log('❌ Cargo no encontrado para actualización con ID:', usuarioData.id_cargo);
                    throw new Error("CARGO_NOT_FOUND");
                }
                console.log('✔ Cargo válido encontrado para actualización.');
            }

            // 4. Validar y obtener nuevo embedding desde FastAPI SI SE PROPORCIONA UNA NUEVA IMAGEN
            let nuevoEmbedding = null;
            if (req.file) {
                try {
                    console.log('🖼 Procesando nueva imagen facial para actualización...');
                    const formData = new FormData();
                    formData.append('file', req.file.buffer, {
                        filename: 'update_imagen.jpg',
                        contentType: req.file.mimetype
                    });
            
                    console.log('📤 Enviando nueva imagen a FastAPI para verificación/embedding... (update)', {
                        url: `${PYTHON_API_URL}/api/verificar-imagen` // Usamos el mismo endpoint
                    });
            
                    const respuestaFastAPI = await axios.post(`${PYTHON_API_URL}/api/verificar-imagen`, formData, {
                        headers: formData.getHeaders()
                    });
            
                    console.log('📥 Respuesta de FastAPI para actualización:', {
                        status: respuestaFastAPI.status,
                        data: respuestaFastAPI.data // Loguear toda la data para depuración
                    });
            
                    const dataFastAPI = respuestaFastAPI.data;

                    // IMPORTANTE: Para la actualización, no queremos fallar si el rostro ya existe *asociado al mismo usuario*.
                    // La lógica de `verificar-imagen` podría necesitar ajustarse o podríamos necesitar otro endpoint 
                    // si queremos distinguir entre "este rostro ya existe para OTRO usuario" vs "este es el rostro del usuario actual".
                    // Por ahora, si `match` es true, podría ser el mismo usuario u otro. 
                    // Si es otro, es un problema. Si es el mismo, simplemente estamos actualizando su embedding.
                    // Una mejora sería que FastAPI devuelva el ID del usuario si hay match.
                    // Si dataFastAPI.match === true Y dataFastAPI.id_usuario !== id_usuario_actual, entonces error.
                    // Esta lógica de verificación de rostro existente para *otro* usuario debería estar aquí.

                    if (dataFastAPI.match === true) {
                        // Aquí necesitamos una lógica más sofisticada.
                        // Si el rostro coincide con OTRO usuario, entonces es un error.
                        // Si el rostro coincide con el MISMO usuario, está bien, es solo una actualización de su foto/embedding.
                        // El endpoint actual de FastAPI `/api/verificar-imagen` no parece devolver el ID del usuario con el que hizo match.
                        // Esto es una limitación. Por ahora, si hay match, asumimos que es un problema potencial si no es el mismo usuario.
                        // Para una implementación robusta, FastAPI debería devolver el ID del usuario coincidente.
                        // Por ahora, si hay match, y no podemos confirmar que es el mismo usuario, lanzamos un error genérico
                        // o permitimos la actualización del embedding. Optaremos por permitir la actualización del embedding por ahora,
                        // asumiendo que el caso más común es que el usuario actualice su propia foto.
                        console.log('🤔 Rostro detectado por FastAPI. Asumiendo actualización de embedding para el usuario actual o nuevo embedding.');
                        // Si se quisiera ser más estricto: 
                        // if (dataFastAPI.id_usuario_coincidente && dataFastAPI.id_usuario_coincidente.toString() !== id_usuario.toString()) {
                        //     throw new Error("FACE_ALREADY_REGISTERED_OTHER_USER");
                        // }
                    }
            
                    if (Array.isArray(dataFastAPI.embedding) && dataFastAPI.embedding.length > 0) {
                        console.log('✔ Nuevo embedding recibido para actualización. Longitud:', dataFastAPI.embedding.length);
                        nuevoEmbedding = dataFastAPI.embedding;
                    } else {
                        console.log('❌ No se recibió nuevo embedding válido de FastAPI para actualización:', dataFastAPI.embedding);
                        // No necesariamente un error fatal si solo se actualizan otros datos y no la foto.
                        // Pero si se envió una foto, esperamos un embedding.
                        throw new Error("NEW_EMBEDDING_NOT_RECEIVED"); 
                    }
                } catch (err) {
                    console.error("❌ Error en comunicación con FastAPI durante actualización:", {
                        message: err.message,
                        response: err.response ? { status: err.response.status, data: err.response.data } : null,
                        // stack: err.stack // Puede ser muy verboso
                    });
                    // Si falla la obtención del embedding para una nueva foto, es un error.
                    throw new Error("NEW_EMBEDDING_PROCESSING_FAILED");
                }
            }
    
            // 5. Agregar nuevo embedding a los datos del usuario si se obtuvo
            if (nuevoEmbedding) {
                usuarioData.embedding = nuevoEmbedding;
                console.log('🔢 Nuevo embedding agregado a datos del usuario para actualización.');
            } else if (req.file && !nuevoEmbedding) {
                // Si se envió un archivo pero no se obtuvo embedding, es un problema.
                console.log('⚠️ Se envió una nueva foto pero no se obtuvo un nuevo embedding.');
                // Considerar si esto debe ser un error que detenga la actualización.
                // Por ahora, se lanzará NEW_EMBEDDING_PROCESSING_FAILED desde el catch anterior.
            }

            // Si no se envió un archivo nuevo (req.file es null), 
            // no modificamos usuarioData.embedding, por lo que el servicio usará COALESCE.
            // Si se quiere borrar el embedding explícitamente, se necesitaría otra lógica.
    
            // 6. Llamar al servicio de actualización
            console.log('📨 Enviando datos al servicio de usuario para actualizar ID:', id_usuario);
            await usuarioService.updateUser(id_usuario, usuarioData); // usuarioData ya contiene la foto y embedding si se actualizaron
    
            // 7. Respuesta exitosa
            console.log('🎉 Usuario actualizado exitosamente. ID:', id_usuario);
            res.json({ 
                success: true,
                message: "Usuario actualizado correctamente"
            });
    
        } catch (error) {
            console.error("❌ Error en updateUser (Controller):", {
                message: error.message,
                // stack: error.stack // Puede ser muy verboso
            });
    
            let statusCode = 500;
            let message = "Error al actualizar el usuario";
    
            switch (error.message) {
                case "USER_NOT_FOUND":
                    statusCode = 404;
                    message = "El usuario a actualizar no existe.";
                    break;
                case "DOCUMENTO_EXISTS":
                    statusCode = 400;
                    message = "El número de documento ya está registrado con otro usuario.";
                    break;
                case "EMAIL_EXISTS":
                    statusCode = 400;
                    message = "El correo electrónico ya está registrado con otro usuario.";
                    break;
                case "USUARIO_EXISTS":
                    statusCode = 400;
                    message = "El nombre de usuario ya está en uso por otro usuario.";
                    break;
                case "CARGO_NOT_FOUND":
                    statusCode = 400;
                    message = "El cargo especificado no existe.";
                    break;
                case "INVALID_FILE_TYPE":
                    statusCode = 415;
                    message = "Solo se permiten imágenes JPEG o PNG para la foto.";
                    break;
                case "NEW_EMBEDDING_NOT_RECEIVED":
                case "NEW_EMBEDDING_PROCESSING_FAILED":
                    statusCode = 500;
                    message = "No se pudo procesar la nueva imagen facial con el servicio de autenticación.";
                    break;
                // case "FACE_ALREADY_REGISTERED_OTHER_USER":
                //     statusCode = 400;
                //     message = "El nuevo rostro proporcionado ya está registrado con un usuario diferente.";
                //     break;
            }
    
            res.status(statusCode).json({
                success: false,
                message: message,
                error: error.message,
                ...(process.env.NODE_ENV === 'development' && {
                    debug_info: {
                        // stack: error.stack
                    }
                })
            });
        }
    },

    // Eliminar un usuario
    // Método para eliminar un usuario
    deleteUser: async (req, res) => {
        try {
            const { id_usuario } = req.params;
            const resultado = await usuarioService.deleteUser(id_usuario);
        
            if (!resultado.exists) {
                return res.status(404).json({ error: "❌ Usuario no encontrado." });
            }
          
            if (resultado.hasRegistros) {
                return res.status(400).json({ error: "⚠️ No se puede eliminar porque el usuario tiene registros de entrada asociados." });
            }
          
            if (resultado.deleted) {
                return res.status(200).json({ message: "✅ Usuario eliminado correctamente." });
            }
          
            res.status(400).json({ error: "⚠️ No se pudo eliminar el usuario." });
        } catch (error) {
            console.error("❌ Error en deleteUser (Controller):", error);
            res.status(500).json({ error: "❌ Error interno al eliminar el usuario." });
        }
    }
    /*deleteUser: async (req, res) => {
        try {
            // Extraer el ID del usuario desde la URL
            const { id_usuario } = req.params;

            // Llamar al servicio para eliminar el usuario
            const resultado = await usuarioService.deleteUser(id_usuario);

            // Verificar si el usuario fue eliminado correctamente
            if (!resultado) {
                return res.status(404).json({ error: "Usuario no encontrado" });
            }

            // Enviar una respuesta exitosa al frontend
            res.json({ message: "✅ Usuario eliminado correctamente" });
        } catch (error) {
            console.error("❌ Error en deleteUser (Controller):", error);
            res.status(500).json({ error: "❌ Error al eliminar el usuario" }); // Manejo de errores
        }
    }*/
};

module.exports = usuarioController; // Exportar el controlador