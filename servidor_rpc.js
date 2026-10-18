var rpc = require("./rpc.js");

module.exports = function() {
    var conexion = require("./conexion_mysql.js");////

    var servidorRPC = rpc.server(3501, function() {
        console.log("Servidor RPC iniciado en el puerto 3501");
    });
    var appRPC = servidorRPC.createApp("hospital");
    

    
    
    appRPC.registerAsync("loginSanitario", function(u, p, callback) {
        var sql = "SELECT id FROM sanitarios WHERE usuario = '" + u + "' AND password = '" + p + "'";
        conexion.query(sql, function(err, resultados) {
            if (err || resultados.length === 0) callback(null);
            else callback(resultados[0].id);
        });
    });

    appRPC.registerAsync("obtenerSanitario", function(id, callback) {
        conexion.query("SELECT * FROM sanitarios WHERE id = " + id, function(err, resultados) {
            if (err || resultados.length === 0) callback(null);
            else callback(resultados[0]);
        });
    });

    appRPC.registerAsync("crearSanitario", function(nuevoSanitario, callback) {
    conexion.query("SELECT id FROM sanitarios WHERE usuario = '" + nuevoSanitario.usuario + "'", function(err, resultados) {
            if (err || resultados.length > 0) {
                callback(null);
            } else {
                var sql = "INSERT INTO sanitarios (nombre, apellidos, usuario, password) VALUES ('" 
                        + nuevoSanitario.nombre + "', '" 
                        + nuevoSanitario.apellidos + "', '" 
                        + nuevoSanitario.usuario + "', '" 
                        + nuevoSanitario.password + "')";
                conexion.query(sql, function(err2, resultado) {
                    if (err2) callback(null);
                    else {
                        console.log("Nuevo sanitario registrado:", nuevoSanitario.usuario);
                        callback(resultado.insertId);
                    }
                });
            }
        });
    });

    appRPC.registerAsync("actualizarSanitario", function(id, datosNuevos, callback) {
     var sql = "UPDATE sanitarios SET usuario = '" + datosNuevos.usuario 
                + "', password = '" + datosNuevos.password 
                + "', nombre = '" + datosNuevos.nombre 
                + "', apellidos = '" + datosNuevos.apellidos 
                + "' WHERE id = " + id;
        conexion.query(sql, function(err, resultado) {
            if (err || resultado.affectedRows === 0) callback(false);
            else {
                console.log("Datos actualizados para el ID:", id);
                callback(true);
            }
        });
     });

    

    appRPC.registerAsync("obtenerCategorias", function(callback) {
        conexion.query("SELECT * FROM categorias", function(err, res) { callback(err ? [] : res); });
    });

    appRPC.registerAsync("obtenerModelos", function(callback) {
        conexion.query("SELECT * FROM modelos", function(err, res) { callback(err ? [] : res); });
    });

    appRPC.registerAsync("obtenerRecursos", function(idModelo, callback) {
        var sql = idModelo == null 
            ? "SELECT * FROM recursos" 
            : "SELECT * FROM recursos WHERE modelo = " + idModelo + " AND estado = 0";
        conexion.query(sql, function(err, res) { callback(err ? [] : res); });
    });
    
    appRPC.registerAsync("obtenerUbicaciones", function(callback) {
        conexion.query("SELECT * FROM ubicaciones", function(err, res) { callback(err ? [] : res); });
    });

    appRPC.registerAsync("obtenerResenyas", function(idRecurso, callback) {
        var sql = idRecurso == null 
            ? "SELECT * FROM resenas" 
            : "SELECT * FROM resenas WHERE recurso = " + idRecurso;
        conexion.query(sql, function(err, res) { callback(err ? [] : res); });
    });
    


    
    appRPC.registerAsync("obtenerReservas", function(idSanitario, callback) {
        conexion.query("SELECT * FROM reservas WHERE sanitario = " + idSanitario, function(err, res) { 
            callback(err ? [] : res); 
        });
    });

    appRPC.registerAsync("iniciarReserva", function(idReserva, callback) {
        conexion.query("SELECT recurso FROM reservas WHERE id = " + idReserva, function(err, res) {
            if (err || res.length === 0) return callback(false);
            var idRecurso = res[0].recurso;
            
            conexion.query("UPDATE reservas SET fecha_inicio = NOW() WHERE id = " + idReserva, function(err2) {
                if (err2) return callback(false);
                conexion.query("UPDATE recursos SET estado = 1 WHERE id = " + idRecurso, function(err3) {
                    if (!err3) console.log("Recurso retirado para la reserva:", idReserva);
                    callback(!err3);
                });
            });
        });
    });

    appRPC.registerAsync("cancelarReserva", function(idReserva, callback) {
        conexion.query("DELETE FROM reservas WHERE id = " + idReserva, function(err, resultado) {
            if (!err && resultado.affectedRows > 0) console.log("Reserva eliminada ID:", idReserva);
            callback(!err && resultado.affectedRows > 0);
        });
    });

    appRPC.registerAsync("finalizarReserva", function(idReserva, callback) {
        conexion.query("SELECT recurso FROM reservas WHERE id = " + idReserva, function(err, res) {
            if (err || res.length === 0) return callback(false);
            var idRecurso = res[0].recurso;
            
            conexion.query("UPDATE reservas SET fecha_fin = NOW() WHERE id = " + idReserva, function(err2) {
                if (err2) return callback(false);
                conexion.query("UPDATE recursos SET estado = 0 WHERE id = " + idRecurso, function(err3) {
                    if (!err3) console.log("Recurso devuelto para la reserva:", idReserva);
                    callback(!err3);
                });
            });
        });
    });

    appRPC.registerAsync("crearResenya", function(idRecurso, idSanitario, valoracion, descripcion, callback) {
        var sql = "INSERT INTO resenas (recurso, sanitario, fecha, valor, descripcion) VALUES (" 
                + idRecurso + ", " + idSanitario + ", NOW(), " + parseInt(valoracion) + ", '" + descripcion + "')";
        conexion.query(sql, function(err, resultado) {
            if (!err) console.log("Nueva reseña guardada, ID:", resultado.insertId);
            callback(err ? null : resultado.insertId);
        });
    });


    


    appRPC.registerAsync("reservarRecurso", function(idRecurso, idSanitario, horasEstimadas, callback) {
        var sql = "INSERT INTO reservas (recurso, sanitario, horas_estimadas, fecha_peticion) VALUES (" 
                + idRecurso + ", " + idSanitario + ", " + parseInt(horasEstimadas) + ", NOW())";
        conexion.query(sql, function(err, resultado) {
            callback(err ? null : resultado.insertId);
        });
    });


    appRPC.registerAsync("tiempoPendiente", function(idRecurso, callback) {
        var sql = "SELECT horas_estimadas FROM reservas WHERE recurso = " + idRecurso 
                + " AND fecha_inicio IS NOT NULL AND fecha_fin IS NULL";
        
        conexion.query(sql, function(err, resultados) {
            if (err || resultados.length === 0) {
                callback(0);
            } else {
                callback(resultados[0].horas_estimadas);
            }
        });
    });
};





   
 


