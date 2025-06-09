const mysql = require('mysql2')

const pool = mysql.createPool({
    host: process.env.DB_HOST, 
    user: process.env.DB_USER, 
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});

pool.getConnection((err, conn) => {
    if (err) {
        // Logs removidos para evitar poluição do console com dados brutos
        // console.log(err)
    } else {
        // Logs removidos para evitar poluição do console com dados brutos
        // console.log("Conectado ao SGBD!")
    }
})

module.exports = pool.promise()
