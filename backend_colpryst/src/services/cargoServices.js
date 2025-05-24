const db = require('../config/database'); // Importa la conexión a la base de datos
const Cargo = require('../models/cargoModel'); // Importa el modelo Cargo

const cargoService = {
    // Obtener todos los cargos
    getAllCargos: async () => {
        const query = 'SELECT * FROM cargo'; 
        try {
            const [results] = await db.query(query); // Cambiado: db.promise().query -> db.query
            // Converti cada fila del resultado en una instancia de Cargo
            return results.map(row => new Cargo(row.id_cargo, row.nombre_cargo, row.descripcion)); 
        } catch (err) {
            throw err; // error,lo maneje el controlador
        }
    },

    // Obtener un cargo por ID
    getCargoById: async (id_cargo) => {
        const queryCargo = 'SELECT * FROM cargo WHERE id_cargo = ?'; 
        const queryUserCount = 'SELECT COUNT(*) AS total_usuarios FROM usuario WHERE id_cargo = ?';
    
        try {
            const [cargoResults] = await db.query(queryCargo, [id_cargo]); // Cambiado: db.promise().query -> db.query
            if (cargoResults.length === 0) return null; // Si no existe el cargo, retorna null
    
            const [countResults] = await db.query(queryUserCount, [id_cargo]); // Cambiado: db.promise().query -> db.query
            const totalUsuarios = countResults[0].total_usuarios;
            console.log("Resultados de la consulta nuemro empleados:", totalUsuarios);
    
            return {
                id_cargo: cargoResults[0].id_cargo,
                nombre_cargo: cargoResults[0].nombre_cargo,
                descripcion: cargoResults[0].descripcion,
                total_usuarios: totalUsuarios
            };
        } catch (err) {
            throw err; 
        }
    },

   // Crear 
   createCargo: async (cargoData) => {
    const query = 'INSERT INTO cargo (nombre_cargo, descripcion) VALUES (?, ?)'; 
    try {
        // Insertar valores usando los getters
        const [result] = await db.query(query, [cargoData.getNombreCargo(), cargoData.getDescripcion()]); // Cambiado: db.promise().query -> db.query
        // Crea un nuevo objeto con el ID generado
        return new Cargo(result.insertId, cargoData.getNombreCargo(), cargoData.getDescripcion());
  
    } catch (err) {
        console.error("❌ Error en createCargo (Service):", err);
        throw err; // error
    }
    },

    //actualizar
    updateCargo: async (id_cargo, nombre_cargo, descripcion) => {
        const query = `UPDATE cargo SET nombre_cargo = ?, descripcion = ? WHERE id_cargo = ?`;
       
        try {
            const [result] = await db.query(query, [nombre_cargo, descripcion, id_cargo]); // Cambiado: db.promise().query -> db.query
            return result; // Retorna el resultado de la consulta
        } catch (err) {
            console.error("❌ Error en updateCargo (Service):", err);
            throw err;
        }
    },

    deleteCargo: async (id_cargo) => {
        const queryCheckCargo = 'SELECT id_cargo FROM cargo WHERE id_cargo = ?';
        const queryCheckUsers = 'SELECT COUNT(*) AS total FROM usuario WHERE id_cargo = ?';
        const queryDelete = 'DELETE FROM cargo WHERE id_cargo = ?';
    
        try {
            // Verificar si el cargo existe antes de eliminar
            const [cargoResult] = await db.query(queryCheckCargo, [parseInt(id_cargo)]); // Cambiado: db.promise().query -> db.query
            if (cargoResult.length === 0) {
                console.log(`❌ Cargo con ID ${id_cargo} no encontrado en la base de datos.`);
                return { exists: false };
            }
    
            // Verificar si hay usuarios asignados al cargo
            const [userResult] = await db.query(queryCheckUsers, [parseInt(id_cargo)]); // Cambiado: db.promise().query -> db.query
            if (userResult[0].total > 0) {
                console.log(`⚠️ No se puede eliminar el cargo ${id_cargo}, tiene ${userResult[0].total} usuarios asignados.`);
                return { exists: true, hasUsers: true };
            }
    
            // Intentar eliminar el cargo
            const [deleteResult] = await db.query(queryDelete, [parseInt(id_cargo)]); // Cambiado: db.promise().query -> db.query
    
            if (deleteResult.affectedRows > 0) {
                console.log(`✅ Cargo con ID ${id_cargo} eliminado correctamente.`);
                return { exists: true, deleted: true };
            } else {
                console.log(`⚠️ Cargo con ID ${id_cargo} no se eliminó.`);
                return { exists: true, deleted: false };
            }
        } catch (err) {
            console.error("❌ Error en deleteCargo (Service):", err);
            throw err;
        }
    }
};

// Exporta el servicio para que pueda ser utilizado en otros archivos
module.exports = cargoService;
