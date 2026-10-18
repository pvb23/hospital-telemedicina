const { Client } = require('pg');

// Aquí está tu nueva URL. ¡Recuerda cambiar [YOUR-PASSWORD] por tu contraseña real (sin los corchetes)!
const connectionString = 'postgresql://postgres.vodmbpelcfrxeklucovx:Comunion13@@@@@@@aws-1-eu-central-1.pooler.supabase.com:5432/postgres';

const client = new Client({
    connectionString: connectionString,
});

client.connect(err => {
    if (err) {
        console.error('Error conectando a Supabase (PostgreSQL):', err.stack);
    } else {
        console.log('¡Conectado con éxito a la base de datos de Supabase!');
    }
});

// Envoltorio para mantener la compatibilidad con tu código MySQL
module.exports = {
    query: function(sql, callback) {
        client.query(sql, function(err, res) {
            if (err) {
                return callback(err, null);
            }
            let resultados = res.rows || [];
            resultados.affectedRows = res.rowCount; 
            callback(null, resultados);
        });
    }
};