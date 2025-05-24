const mysql = require('mysql2/promise'); // Cambiado a mysql2/promise

// Se elimina createConnection y connection.connect()

const pool = mysql.createPool({
    host: process.env.DATABASE_HOST || 'mysql-db', // Usar variable de entorno o valor por defecto
    user: process.env.DATABASE_USER || 'colpryst_user', // Usar variable de entorno o valor por defecto
    password: process.env.DATABASE_PASSWORD || 'user_password123', // Usar variable de entorno o valor por defecto
    database: process.env.DATABASE_NAME || 'colpryst_db', // Usar variable de entorno o valor por defecto
    waitForConnections: true, // Esperar si no hay conexiones disponibles
    connectionLimit: 10,      // Límite de conexiones en el pool
    queueLimit: 0             // Sin límite en la cola de espera de conexiones
});

// Opcional: Para verificar que el pool se crea e intenta conectar (puede ayudar en la depuración)
// pool.getConnection()
// .then(conn => {
//   console.log('MySQL Pool: Conexión de prueba exitosa.');
//   conn.release();
// })
// .catch(err => {
//   console.error('MySQL Pool: Error al obtener conexión de prueba:', err.message);
// });

module.exports = pool; // Exportar el pool directamente