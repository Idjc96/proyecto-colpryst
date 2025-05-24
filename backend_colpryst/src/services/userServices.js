const db = require('../config/database'); // base de datos
const Usuario = require('../models/userModel'); // modelo de usuario
const reconocimientoService = require('./reconocimientoServices'); // servicio de reconocimiento
const bcrypt = require('bcrypt'); // bcrypt para encriptar contraseñas

const usuarioService = {
    // Obtener todos los usuarios 
    getAllUsers: async () => {
        const query = 'SELECT * FROM usuario';
        try {
            //console.log("Ejecutando consulta SQL:", query);
            const [results] = await db.query(query); // Cambiado: db.promise().query -> db.query
            //console.log("Resultados de la consulta:", results);

            const usuarios = results.map(row => 
                new Usuario( row.id_usuario, row.tipo_documento, row.numero_documento, row.nombre_empleado, 
                    row.direccion_empleado, row.telefono_empleado, row.email_empleado, row.eps_empleado, 
                    row.usuarioadmin, row.contrasenia, row.id_cargo)
            );

            return usuarios;
        } catch (err) {
            console.error("❌ Error en getAllUsers (Service):", err);
            throw new Error("Error al obtener los usuarios.");
        }
    },

    // Obtener usuario mediante documento, incluyendo el nombre del cargo
    getCargoByDocument: async (numero_documento) => {
        const queryUser = 'SELECT * FROM usuario WHERE numero_documento = ?';
        const queryCargo = `
            SELECT c.nombre_cargo AS cargo_user
            FROM usuario u 
            INNER JOIN cargo c ON u.id_cargo = c.id_cargo 
            WHERE u.numero_documento = ?;
        `;

        try {
            // Ejecutar consulta de usuario
            const [userResult] = await db.execute(queryUser, [numero_documento]); // Cambiado: db.promise().execute -> db.execute

            if (userResult.length === 0) return null; // Si el usuario no existe

            // Ejecutar consulta de cargo
            const [cargoResult] = await db.execute(queryCargo, [numero_documento]); // Cambiado: db.promise().execute -> db.execute

            // Verificar si se encontró un cargo
            const cargoUser = cargoResult.length > 0 ? cargoResult[0].cargo_user : null;

            console.log("Resultados de la consulta nombre cargo:", cargoUser);

            return {
                id_usuario: userResult[0].id_usuario,
                tipo_documento: userResult[0].tipo_documento,
                numero_documento: userResult[0].numero_documento,
                nombre_empleado: userResult[0].nombre_empleado,
                direccion_empleado: userResult[0].direccion_empleado,
                telefono_empleado: userResult[0].telefono_empleado,
                email_empleado: userResult[0].email_empleado,
                eps_empleado: userResult[0].eps_empleado,
                usuarioadmin: userResult[0].usuarioadmin,
                contrasenia:userResult[0].contrasenia,
                id_cargo:userResult[0].id_cargo,
                cargo_user: cargoUser 
            };

        } catch (err) {
            throw err;
        }
    },

    // Nuevo usuario
    createUser: async (usuarioData) => {
        // La validación de datos únicos (documento, email, usuarioadmin) ya se hace aquí dentro.
        try {
            console.log("📡 [DEBUG] Datos recibidos en el servicio:", {
                ...usuarioData,
                foto: usuarioData.foto ? `[Buffer de ${usuarioData.foto.data.length} bytes]` : null,
                embedding: usuarioData.embedding ? `[Array de ${usuarioData.embedding.length} elementos]` : null,
                contrasenia: '[PROTEGIDO]'
            });
    
            // 1. Validar número de documento
            const [existingDocumento] = await db.query( // Cambiado: db.promise().query -> db.query
                'SELECT id_usuario FROM usuario WHERE numero_documento = ?',
                [usuarioData.numero_documento]
            );
            if (existingDocumento.length > 0) {
                console.log("❌ [DEBUG] Documento ya existe:", usuarioData.numero_documento);
                throw new Error("DOCUMENTO_EXISTS");
            }
    
            // 2. Validar email
            const [existingEmail] = await db.query( // Cambiado: db.promise().query -> db.query
                'SELECT id_usuario FROM usuario WHERE email_empleado = ?',
                [usuarioData.email_empleado]
            );
            if (existingEmail.length > 0) {
                console.log("❌ [DEBUG] Email ya existe:", usuarioData.email_empleado);
                throw new Error("EMAIL_EXISTS");
            }
    
            // 3. Validar usuarioadmin
            const [existingUsuarioAdmin] = await db.query( // Cambiado: db.promise().query -> db.query
                'SELECT id_usuario FROM usuario WHERE usuarioadmin = ?',
                [usuarioData.usuarioadmin]
            );
            if (existingUsuarioAdmin.length > 0) {
                console.log("❌ [DEBUG] Usuario admin ya existe:", usuarioData.usuarioadmin);
                throw new Error("USUARIO_EXISTS"); // Asegúrate que este error se maneje en el controller
            }
    
            // 4. Encriptar contraseña
            const hashedPassword = await bcrypt.hash(usuarioData.contrasenia, 10);
            console.log("🔐 [DEBUG] Contraseña hasheada correctamente");
    
            // 5. Procesamiento de la foto y obtención de embedding
            // Si se proporciona una foto, procesarla
            let fotoBuffer = null;
            let embeddingData = null;
    
            if (usuarioData.foto) {
                // Aquí puedes agregar la lógica para procesar la foto si es necesario
                // Por ejemplo, redimensionar, cambiar formato, etc.
                fotoBuffer = usuarioData.foto.data; // Suponiendo que la foto es un buffer
    
                // También puedes generar el embedding aquí si es necesario
                // embeddingData = await generarEmbedding(fotoBuffer);
            }
    
            // 6. Iniciar transacción
            const connection = await db.getConnection(); // Obtener una conexión del pool
            await connection.beginTransaction();

            try {
                // Insertar en la tabla 'usuario'
                const queryUsuario = `INSERT INTO usuario (tipo_documento, numero_documento, nombre_empleado, direccion_empleado, telefono_empleado, email_empleado, eps_empleado, usuarioadmin, contrasenia, id_cargo, foto, embedding) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
                const valuesUsuario = [
                    usuarioData.tipo_documento,
                    usuarioData.numero_documento,
                    usuarioData.nombre_empleado,
                    usuarioData.direccion_empleado,
                    usuarioData.telefono_empleado,
                    usuarioData.email_empleado,
                    usuarioData.eps_empleado,
                    usuarioData.usuarioadmin,
                    hashedPassword, // Usar la contraseña encriptada
                    usuarioData.id_cargo,
                    usuarioData.foto ? usuarioData.foto.data : null, // Asegúrate de que esto es lo que quieres guardar
                    usuarioData.embedding ? JSON.stringify(usuarioData.embedding) : null // Convertir embedding a JSON String
                ];
                const [resultUsuario] = await connection.query(queryUsuario, valuesUsuario); // Usar connection.query
                const idUsuario = resultUsuario.insertId;

                // ... Lógica para insertar en 'reconocimiento_facial' si es necesario ...
                // (Esta parte parece estar comentada o manejada por el servicio de reconocimiento)

                await connection.commit(); // Confirmar transacción
                console.log("✅ [DEBUG] Usuario creado con ID:", idUsuario);
                return { id_usuario: idUsuario, ...usuarioData };

            } catch (error) {
                await connection.rollback(); // Revertir transacción en caso de error
                console.error("❌ [DEBUG] Error durante la transacción:", error);
                if (error.message === "DOCUMENTO_EXISTS" || error.message === "EMAIL_EXISTS" || error.message === "USUARIOADMIN_EXISTS" || error.message === "CARGO_NOT_FOUND" || error.message === "ERROR_PROCESANDO_FOTO" || error.message === "ERROR_GUARDANDO_FOTO_EMBEDDING") {
                    throw error;
                } else {
                    throw new Error("Error al crear el usuario en la base de datos.");
                }
            } finally {
                connection.release(); // Liberar la conexión al pool
            }
        } catch (err) {
            console.error("❌ Error en createUser (Service):", err.message);
            throw err; // Re-lanzar el error para el controlador
        }
    },

    // Función separada para validar datos únicos, si prefieres mantenerla así en el servicio
    // aunque ya está integrada en createUser. Si la llamas desde el controller, asegúrate que
    // los errores que lanza (DOCUMENTO_EXISTS, EMAIL_EXISTS, USUARIO_EXISTS) sean manejados.
    validarDatosUnicos: async (usuarioData) => {
        // 1. Validar número de documento
        const [existingDocumento] = await db.query(
            'SELECT id_usuario FROM usuario WHERE numero_documento = ?',
            [usuarioData.numero_documento]
        );
        if (existingDocumento.length > 0) {
            console.log("❌ [DEBUG] Documento ya existe:", usuarioData.numero_documento);
            throw new Error("DOCUMENTO_EXISTS");
        }

        // 2. Validar email
        const [existingEmail] = await db.query(
            'SELECT id_usuario FROM usuario WHERE email_empleado = ?',
            [usuarioData.email_empleado]
        );
        if (existingEmail.length > 0) {
            console.log("❌ [DEBUG] Email ya existe:", usuarioData.email_empleado);
            throw new Error("EMAIL_EXISTS");
        }

        // 3. Validar usuarioadmin
        const [existingUsuarioAdmin] = await db.query(
            'SELECT id_usuario FROM usuario WHERE usuarioadmin = ?',
            [usuarioData.usuarioadmin]
        );
        if (existingUsuarioAdmin.length > 0) {
            console.log("❌ [DEBUG] Usuario admin ya existe:", usuarioData.usuarioadmin);
            throw new Error("USUARIO_EXISTS");
        }
        // Si todo está bien, no retorna nada o retorna true
        return true;
    },

    // Actualizar usuario
    updateUser: async (id_usuario, usuarioData) => {
        try {
            const userExists = "SELECT id_usuario FROM usuario WHERE id_usuario = ?";
            // 1. Verificar si el usuario existe
            const [checkUserExists] = await db.execute(userExists, [id_usuario]);
            
            if (checkUserExists.length === 0) {
                throw new Error("USER_NOT_FOUND");
            }

            // 2. Validaciones de datos únicos (excepto para el usuario actual)
            
            // Verificar si el número de documento ya existe en otro usuario
            if (usuarioData.numero_documento) {
                const checkDocumentoQuery = `SELECT id_usuario FROM usuario     
                                            WHERE numero_documento = ? AND id_usuario != ?`;
                const [existingDocumento] = await db.query(checkDocumentoQuery, 
                                [usuarioData.numero_documento, id_usuario]);
                
                if (existingDocumento.length > 0) {
                    throw new Error("DOCUMENTO_EXISTS");
                }
            }

            // Verificar si el correo electrónico ya existe en otro usuario
            if (usuarioData.email_empleado) {
                const checkEmailQuery = `SELECT id_usuario FROM usuario 
                                        WHERE email_empleado = ? AND id_usuario != ?`;
                const [existingEmail] = await db.query(checkEmailQuery, 
                                [usuarioData.email_empleado, id_usuario]);
                
                if (existingEmail.length > 0) {
                    throw new Error("EMAIL_EXISTS");
                }
            }

            // Verificar si el nombre de usuario ya existe en otro usuario (si se proporciona)
            if (usuarioData.usuarioadmin) {
                const checkUsuarioQuery = 'SELECT id_usuario FROM usuario WHERE usuarioadmin = ? AND id_usuario != ?';
                const [existingUsuario] = await db.query(checkUsuarioQuery, 
                                [usuarioData.usuarioadmin, id_usuario]);
                
                if (existingUsuario.length > 0) {
                    throw new Error("USUARIO_EXISTS");
                }
            }

            // 3. Manejo de la contraseña
            let hashedPassword;
            
            if (usuarioData.contrasenia && usuarioData.contrasenia.trim() !== "") {
                // Si se proporcionó nueva contraseña: Hashear
                hashedPassword = await bcrypt.hash(usuarioData.contrasenia, 10);
            } else {
                // Si NO se proporcionó contraseña: Obtener la actual
                const [rows] = await db.execute(
                    "SELECT contrasenia FROM usuario WHERE id_usuario = ?", 
                    [id_usuario]
                );
                hashedPassword = rows[0].contrasenia;
            }

            // 4. Consulta SQL de actualización
            // Se actualizan foto y embedding si se proporcionan en usuarioData
            const query = `UPDATE usuario SET 
                tipo_documento = COALESCE(?, tipo_documento), 
                numero_documento = COALESCE(?, numero_documento), 
                nombre_empleado = COALESCE(?, nombre_empleado),
                direccion_empleado = COALESCE(?, direccion_empleado), 
                telefono_empleado = COALESCE(?, telefono_empleado), 
                email_empleado = COALESCE(?, email_empleado), 
                eps_empleado = COALESCE(?, eps_empleado), 
                usuarioadmin = COALESCE(?, usuarioadmin),
                contrasenia = ?, 
                id_cargo = COALESCE(?, id_cargo),
                foto = COALESCE(?, foto),
                embedding = COALESCE(?, embedding)
                WHERE id_usuario = ?`;

            // 5. Ejecutar la actualización
            const [result] = await db.execute(query, [
                usuarioData.tipo_documento,
                usuarioData.numero_documento,
                usuarioData.nombre_empleado,
                usuarioData.direccion_empleado,
                usuarioData.telefono_empleado,
                usuarioData.email_empleado,
                usuarioData.eps_empleado,
                usuarioData.usuarioadmin,
                hashedPassword, // Usa la contraseña hasheada (nueva o anterior)
                usuarioData.id_cargo,
                usuarioData.foto ? usuarioData.foto.data : null, // Actualiza la foto si se proporciona
                usuarioData.embedding ? JSON.stringify(usuarioData.embedding) : null, // Actualiza el embedding si se proporciona
                id_usuario
            ]);

            // 6. [OPCIONAL] Si necesitas procesar el reconocimiento después:
            // await reconocimientoService.updateReconocimiento(id_usuario, usuarioData.embedding);
            // Si se proporciona un nuevo embedding, actualizarlo (esto ya se hace en el controller si es necesario)
            // if (usuarioData.embedding) {
            //     await reconocimientoService.updateReconocimiento(id_usuario, usuarioData.embedding);
            // }

            return result;

        } catch (error) {
            console.error("❌ Error en updateUser (Service):", error);
            throw error;
        }
    },

    // ELIMINAR USUARIO
    deleteUser: async (id_usuario) => {
        const connection = await db.getConnection(); // Obtener conexión del pool
        await connection.beginTransaction();
        try {
            // Eliminar registros relacionados en reconocimiento_facial
            await connection.query('DELETE FROM reconocimiento_facial WHERE id_usuario = ?', [id_usuario]); // Usar connection.query
            
            // Eliminar el usuario
            const [result] = await connection.query('DELETE FROM usuario WHERE id_usuario = ?', [id_usuario]); // Usar connection.query
            
            await connection.commit();
            return result.affectedRows > 0;
        } catch (err) {
            await connection.rollback();
            console.error("❌ Error en deleteUser (Service):", err);
            throw err;
        } finally {
            connection.release();
        }
    }
};

module.exports = usuarioService; // Exportamos el servicio