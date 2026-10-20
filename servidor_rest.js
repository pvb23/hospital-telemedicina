module.exports = function(app) { 

    var conexion = require("./conexion_mysql.js");
    var jwt = require('jwt-simple');//
    var clave = 'secretoHospital';//


    app.post("/api/gestores/login",function(req,res){//
        var body = req.body || {}; 
        var usuario = body.usuario ? String(body.usuario).trim() : null;
        var contrasena = body.contrasena ? String(body.contrasena).trim() : null;

        if (!usuario || !contrasena) {
            return res.status(400).json("Los datos llegaron vacíos al servidor");
        }

        var sql = "SELECT * FROM gestores WHERE usuario = '" + usuario + "' AND contrasena = '" + contrasena + "'";

        conexion.query(sql, function (err, resultados) {///
            if (err) return res.status(500).json("Error en la base de datos");
            
            if (resultados.length > 0) {//
                var contenido = {
                    usuario: resultados[0].id,
                    expira: Date.now() + (2 * 60 * 60 * 1000) 
                };
                var tokenJWT = jwt.encode(contenido, clave);
                res.status(200).json({ gestor: resultados[0], token: tokenJWT });
                
            } else {
                res.status(403).json("Usuario o contraseña incorrectos");
            }
        });
    });

    app.post("/api/gestores",function(req,res){
        var nuevo = req.body || {};
        
        if (!nuevo.usuario) {
            return res.status(400).json("Los datos llegaron vacíos al servidor");
        }
        var usuarioLimpio = String(nuevo.usuario).trim();
        nuevo.usuario = String(nuevo.usuario).trim();

        conexion.query("SELECT id FROM gestores WHERE usuario = '" + usuarioLimpio + "'", function(err, resultados){
            if (err) return res.status(500).json("Error al comprobar usuario");
            
            if (resultados.length > 0) {
                return res.status(400).json("El usuario ya existe de verdad");
            }
            var sqlInsert = "INSERT INTO gestores (usuario, contrasena, nombre, apellido) VALUES ('" 
                          + usuarioLimpio + "', '" 
                          + nuevo.contrasena + "', '" 
                          + nuevo.nombre + "', '" 
                          + nuevo.apellido + "')";
                          
            conexion.query(sqlInsert, function(err, result){
                if (err) return res.status(500).json("Error al insertar el gestor");
                res.status(201).json("añadido");
            });
        });
    });

    app.use("/api", function (req, res, next) {///
    var token = req.query.token; 
    
    if (!token) {
        return res.status(401).json("Acceso denegado. No se ha proporcionado un token.");
    }

    var contenidoToken;
    try {
        var tokenLimpio = String(token).trim();
        contenidoToken = jwt.decode(tokenLimpio, clave); 
    } catch (error) {
        return res.status(401).json("Error: " + error.message + " | Recibí esto: " + tokenLimpio);
    }

    if (contenidoToken.expira < Date.now()) {
        return res.status(401).json("El token ha expirado. Inicia sesión de nuevo.");
    }
    
    next(); 
});

    app.put("/api/gestores/:id",function(req,res){
        var id = parseInt(req.params.id)
        var nuevo=req.body
        conexion.query("SELECT id FROM gestores WHERE usuario = '" + nuevo.usuario + "' AND id != " + id, function(err, resultados){
            if (err) return res.status(500).json("Error al validar usuario");
            
            if (resultados.length > 0) {
                return res.status(400).json("El usuario ya existe");
            }
            var sqlUpdate = "UPDATE gestores SET usuario = '" + nuevo.usuario 
                          + "', contrasena = '" + nuevo.contrasena 
                          + "', nombre = '" + nuevo.nombre 
                          + "', apellido = '" + nuevo.apellido 
                          + "' WHERE id = " + id;
                          
            conexion.query(sqlUpdate, function(err, result){
                if (err) return res.status(500).json("Error al actualizar");
                if (result.affectedRows > 0) {
                    nuevo.id = id;
                    res.status(200).json(nuevo);
                } else {
                    res.status(404).json("Gestor no encontrado");
                }
            });
        });
    });

    app.get("/api/categorias",function(req,res){
        conexion.query("SELECT * FROM categorias", function(err, resultados){
            if (err) return res.status(500).json("Error en BD");
            res.status(200).json(resultados);
        });
    });
    app.get("/api/modelos",function(req,res){
        conexion.query("SELECT * FROM modelos", function(err, resultados){
            if (err) return res.status(500).json("Error en BD");
            res.status(200).json(resultados);
        });
    });
    app.get("/api/ubicaciones",function(req,res){
        conexion.query("SELECT * FROM ubicaciones", function(err, resultados){
            if (err) return res.status(500).json("Error en BD");
            res.status(200).json(resultados);
        });
    });

    app.get("/api/recursos",function(req,res){
        var categoria=req.query.categoria
        var modelo=req.query.modelo
        var ubicacion=req.query.ubicacion
        var estado=req.query.estado

        var sql = "SELECT * FROM recursos WHERE 1=1";

        if (modelo) {
            sql += " AND modelo = " + modelo;
        }
        if (ubicacion) {
            sql += " AND ubicacion = " + ubicacion;
        }
        if (estado) {
            sql += " AND estado = " + estado;
        }
        if (categoria) {
            sql += " AND modelo IN (SELECT id FROM modelos WHERE categoria = " + categoria + ")";
        }
        conexion.query(sql, function(err, filtrados){
            if (err) {
                console.log("Error al filtrar recursos:", err);
                return res.status(500).json("Error en la base de datos");
            }
            res.status(200).json(filtrados);
        });
    });

    app.delete("/api/recursos/:id",function(req,res){
        var id = parseInt(req.params.id)
        conexion.query("DELETE FROM recursos WHERE id = " + id, function(err, resultado){
            if (err) {
                console.log("Error al borrar recurso:", err);
                return res.status(500).json("Error en la base de datos");
            }
            if (resultado.affectedRows > 0) {
                res.status(200).json("Recurso borrado");
            } else {
                res.status(404).json("Recurso no encontrado");
            }
        });
    });

    app.get("/api/recursos/:id",function(req,res){
        var id = parseInt(req.params.id)
        conexion.query("SELECT * FROM recursos WHERE id = " + id, function(err, resultados){
            if (err) return res.status(500).json("Error en BD");
            if (resultados.length > 0) res.status(200).json(resultados[0]);
            else res.status(404).json("Recurso no encontrado");
        });
    });


    app.post("/api/recursos",function(req,res){ 
        var nuevo=req.body
        var sql = "INSERT INTO recursos (modelo, numero_serie, ubicacion, estado) VALUES (" 
                + nuevo.modelo + ", '" 
                + nuevo.numero_serie + "', " 
                + nuevo.ubicacion + ", " 
                + nuevo.estado + ")";
        conexion.query(sql, function(err, resultado){
            if (err) {
                console.log("Error al insertar recurso:", err);
                return res.status(500).json("Error al crear el recurso");
            }
            res.status(201).json("Recurso añadido");
        });
    });

    app.put("/api/recursos/:id",function(req,res){ 
        var id = parseInt(req.params.id)
        var nuevo=req.body
        var sql = "UPDATE recursos SET modelo = " + nuevo.modelo 
                + ", numero_serie = '" + nuevo.numero_serie 
                + "', ubicacion = " + nuevo.ubicacion 
                + ", estado = " + nuevo.estado 
                + " WHERE id = " + id;

        conexion.query(sql, function(err, resultado){
            if (err) {
                console.log("Error al actualizar recurso:", err);
                return res.status(500).json("Error al actualizar");
            }
            if (resultado.affectedRows > 0) {
                nuevo.id = id;
                res.status(200).json(nuevo);
            } else {
                res.status(404).json("Recurso no encontrado");
            }
        });
    });


    app.get("/api/recursos/:id/reservas", function(req, res){
        var id = parseInt(req.params.id);
        conexion.query("SELECT * FROM reservas WHERE recurso = " + id, function(err, resultados){
            if (err) return res.status(500).json("Error en BD");
            res.status(200).json(resultados);
        });
    });

    app.get("/api/reservas", function(req, res){///
        conexion.query("SELECT * FROM reservas", function(err, resultados){
            if (err) return res.status(500).json("Error en BD");
            res.status(200).json(resultados);
        });
    });

    app.get("/api/recursos/:id/resenyas", function(req, res){
        var id = parseInt(req.params.id);
        conexion.query("SELECT * FROM resenas WHERE recurso = " + id, function(err, resultados){
            if (err) return res.status(500).json("Error en BD");
            res.status(200).json(resultados);
        });
    });

    app.get("/api/sanitarios/:id", function(req, res){
        var id = parseInt(req.params.id);
        conexion.query("SELECT id, nombre, apellidos FROM sanitarios WHERE id = " + id, function(err, resultados){
            if (err) return res.status(500).json("Error en BD");
            if (resultados.length > 0) res.status(200).json(resultados[0]);
            else res.status(404).json("Sanitario no encontrado");
        });
    });

    app.get("/api/gestores/:id", function(req, res){
        var id = parseInt(req.params.id);
        conexion.query("SELECT id, nombre, apellido, usuario FROM gestores WHERE id = " + id, function(err, resultados){
            if (err) return res.status(500).json("Error en BD");
            if (resultados.length > 0) res.status(200).json(resultados[0]);
            else res.status(404).json("Gestor no encontrado");
        });
    });
};