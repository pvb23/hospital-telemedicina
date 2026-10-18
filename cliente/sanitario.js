var sanitarioActual = null;
var idRecursoResena = null;
var listaCategorias = [];
var listaModelos = [];
var listaRecursos = [];
var listaUbicaciones = [];
var listaResenas = [];
var conexionWS = null;//WS//

var rpcCliente = rpc("localhost", 3501, "hospital");

var loginSanitario = rpcCliente.procedure("loginSanitario");
var obtenerSanitario = rpcCliente.procedure("obtenerSanitario");
var crearSanitario = rpcCliente.procedure("crearSanitario");
var actualizarSanitario = rpcCliente.procedure("actualizarSanitario");
var obtenerReservas = rpcCliente.procedure("obtenerReservas");
var obtenerCategorias = rpcCliente.procedure("obtenerCategorias");
var obtenerModelos = rpcCliente.procedure("obtenerModelos");
var obtenerRecursos = rpcCliente.procedure("obtenerRecursos");
var obtenerUbicaciones = rpcCliente.procedure("obtenerUbicaciones");
var iniciarReservaRPC = rpcCliente.procedure("iniciarReserva");
var finalizarReservaRPC = rpcCliente.procedure("finalizarReserva");
var cancelarReservaRPC = rpcCliente.procedure("cancelarReserva");
var crearResenyaRPC = rpcCliente.procedure("crearResenya");
var obtenerResenyas = rpcCliente.procedure("obtenerResenyas");
var reservarRecursoRPC = rpcCliente.procedure("reservarRecurso");
var tiempoPendiente = rpcCliente.procedure("tiempoPendiente");

function cambiarseccion(seccion){
    document.getElementById('inicio').style.display="none";
    document.getElementById('registro').style.display="none";
    document.getElementById('aplicacion').style.display="none";
    document.getElementById('editar-registro').style.display="none";
    document.getElementById('nueva-reserva').style.display="none";
    document.getElementById('nueva-resena').style.display="none";
    
    document.getElementById(seccion).style.display="block";

    var menu = document.getElementById('menu-inferior');
    if (menu) {
        if (seccion === 'inicio' || seccion === 'registro') {
            menu.style.display = "none";
        } else {
            menu.style.display = "flex";
        }
    }
}

function entrar(){//WS//
    var u = document.getElementById("usuario").value;
    var p = document.getElementById("contrasena").value;

    loginSanitario(u, p, function(idDevuelto){
        if(idDevuelto != null){
            obtenerSanitario(idDevuelto, function(respuesta){
                sanitarioActual = respuesta;
                document.getElementById("nombre-sanitario-bienvenida").innerHTML = respuesta.nombre + " " + respuesta.apellidos;
                
                cargarDatosApoyo(function() {
                    cargarTablas(); 
                    conectarAvisos(); 
                    cambiarseccion("aplicacion");
                });
            });
        } else {
            alert("Usuario o contraseña incorrectos");
        }
    });
}

function registrarse() {
    var s = {
        nombre: document.getElementById("nombre").value,
        apellidos: document.getElementById("apellido").value,
        usuario: document.getElementById("usuario-registro").value,
        password: document.getElementById("contrasena-registro").value
    };

    if (s.nombre == "" || s.apellidos == "" || s.usuario == "" || s.password == "") {
        alert("Por favor, rellena todos los campos");
        return;
    }

    crearSanitario(s, function(idRecibido) {
        if (idRecibido != null) {
            alert("Registro completado con éxito");
            cambiarseccion('inicio'); 
        } else {
            alert("El nombre de usuario ya existe");
        }
    });
}

function editardatosusuario() {
    document.getElementById("editar-usuario").value = sanitarioActual.usuario;
    document.getElementById("editar-contrasena").value = sanitarioActual.password;
    document.getElementById("editar-nombre").value = sanitarioActual.nombre;
    document.getElementById("editar-apellido").value = sanitarioActual.apellidos;
    cambiarseccion("editar-registro");
}

function guardardatosusuario() {
    var datosNuevos = {
        usuario: document.getElementById("editar-usuario").value,
        password: document.getElementById("editar-contrasena").value,
        nombre: document.getElementById("editar-nombre").value,
        apellidos: document.getElementById("editar-apellido").value
    };

    actualizarSanitario(sanitarioActual.id, datosNuevos, function(exito) {
        if (exito) {
            alert("Datos actualizados correctamente");
            sanitarioActual.usuario = datosNuevos.usuario;
            sanitarioActual.password = datosNuevos.password;
            sanitarioActual.nombre = datosNuevos.nombre;
            sanitarioActual.apellidos = datosNuevos.apellidos;

            document.getElementById("nombre-sanitario-bienvenida").innerHTML = sanitarioActual.nombre + " " + sanitarioActual.apellidos;
            cambiarseccion("aplicacion");
        } else {
            alert("Error al actualizar los datos");
        }
    });
}
function salir() {//WS//
    if (conexionWS) {
        conexionWS.close(); 
    }
    document.getElementById("tabla-avisos").innerHTML = ""; 
    
    sanitarioActual = null;
    document.getElementById("usuario").value = "";
    document.getElementById("contrasena").value = "";
    cambiarseccion("inicio");
    console.log("Sesión y conexión cerradas correctamente");
}


function cargarDatosApoyo(callbackFinal) {
    obtenerCategorias(function(resCat) {
        listaCategorias = resCat;
        obtenerModelos(function(resMod) {
            listaModelos = resMod;
            obtenerRecursos(null, function(resRec) {
                listaRecursos = resRec;
                obtenerUbicaciones(function(resUbi) {
                    listaUbicaciones = resUbi;
                    obtenerResenyas(null, function(resRes) {
                        listaResenas = resRes;
                        if(callbackFinal) callbackFinal();
                    });
                });
            });
        });
    });
}

function cargarTablas() {
    obtenerReservas(sanitarioActual.id, function(lista) {
        var tablaPendientes = document.getElementById("cuerpo-tabla-reservas-pendientes");
        var tablaRealizadas = document.getElementById("cuerpo-tabla-reservas-realizadas"); 
        
        tablaPendientes.innerHTML = ""; 
        tablaRealizadas.innerHTML = ""; 

       for (let i = 0; i < lista.length; i++) {
            let r = lista[i];
            
            let recurso = listaRecursos.find(rec => rec.id == r.recurso);
            let modelo = listaModelos.find(m => m.id == recurso.modelo);
            let categoria = listaCategorias.find(c => c.id == modelo.categoria);

            if (r.fecha_inicio == null) {
                let ubicacion = listaUbicaciones.find(u => u.id == recurso.ubicacion);
                
                tiempoPendiente(recurso.id, function(hRest) {
                    var tr = "<tr>";
                    tr += "<td data-label='Categoría'>" + (categoria ? categoria.nombre : "-") + "</td>";
                    tr += "<td data-label='Modelo'>" + (modelo ? modelo.nombre : "-") + "</td>";
                    tr += "<td data-label='N.Serie'>" + recurso.numero_serie + "</td>";
                    tr += "<td data-label='Ubic.'>" + (ubicacion ? ubicacion.nombre : "-") + "</td>";
                    tr += "<td data-label='F.Pet.'>" + (r.fecha_peticion ? new Date(r.fecha_peticion).toLocaleString() : "-") + "</td>";
                    
                    tr += "<td data-label='H.Rest.'>" + hRest + "</td>"; 
                    
                    var celdaRetirar = (hRest === 0) ? "<button onclick='retirarRecurso(" + r.id + ")'>Retirar</button>" : "";
                    var celdaX = "<button translate='no' onclick='cancelarReserva(" + r.id + ")'> X </button>";
                    
                    tr += "<td data-label='Acción'>" + celdaRetirar + "</td>";
                    tr += "<td data-label='Cancelar'>" + celdaX + "</td>";
                    
                    tr += "</tr>";
                    tablaPendientes.innerHTML += tr;
                });
            }
            else {
                var tr = "<tr>";
                tr += "<td data-label='Categoría'>" + (categoria ? categoria.nombre : "-") + "</td>";
                tr += "<td data-label='Modelo'>" + (modelo ? modelo.nombre : "-") + "</td>";
                tr += "<td data-label='N.Serie'>" + recurso.numero_serie + "</td>";
                tr += "<td data-label='Horas.E'>" + r.horas_estimadas + "h</td>";
                tr += "<td data-label='F.Ini'>" + new Date(r.fecha_inicio).toLocaleString() + "</td>";

                if (r.fecha_fin == null) {
                    tr += "<td data-label='F.Fin'><button onclick='devolverRecurso(" + r.id + ")'>Devolver</button></td>";
                } else {
                    tr += "<td data-label='F.Fin'>" + new Date(r.fecha_fin).toLocaleString() + "</td>";
                }

                tr += "<td data-label='Valoración'><button onclick='prepararResena(" + r.recurso + ", \"" + recurso.numero_serie + "\")'>Reseña</button></td>";
                tr += "</tr>";
                
                tablaRealizadas.innerHTML += tr;
            }
        }
    });
}


function retirarRecurso(id) { //WS//
    if (confirm("¿Desea retirar este recurso ahora?")) {
        iniciarReservaRPC(id, function(exito) {
            if (exito) {
                
                obtenerReservas(sanitarioActual.id, function(lista) {
                    let r = lista.find(res => res.id == id);
                    let recurso = listaRecursos.find(rec => rec.id == r.recurso);
                    let modelo = listaModelos.find(m => m.id == recurso.modelo);
                    let categoria = listaCategorias.find(c => c.id == modelo.categoria);

                    conexionWS.send(JSON.stringify({
                        operacion: "avisoReserva",
                        idRecurso: recurso.id, 
                        origen: sanitarioActual.nombre + " " + sanitarioActual.apellidos,
                        texto: "SE HA INICIADO LA RESERVA DEL " + categoria.nombre.toUpperCase() + 
                               " MODELO " + modelo.nombre.toUpperCase() + 
                               " CON CÓDIGO " + recurso.numero_serie
                    }));
                });

                cargarTablas();
            } else {
                alert("Error al retirar el recurso");
            }
        });
    }
}
function cancelarReserva(id) {
    if (confirm("¿Estás seguro de que quieres cancelar esta reserva?")) {
        cancelarReservaRPC(id, function(exito) {
            if (exito) {
                cargarTablas(); 
            } else {
                alert("No se pudo cancelar la reserva");
            }
        });
    }
}
function devolverRecurso(id) { //WS//
    if (confirm("¿Desea devolver el recurso y finalizar la reserva?")) {
        finalizarReservaRPC(id, function(exito) {
            if (exito) {

                obtenerReservas(sanitarioActual.id, function(lista) {
                    let r = lista.find(res => res.id == id);
                    let recurso = listaRecursos.find(rec => rec.id == r.recurso);
                    let modelo = listaModelos.find(m => m.id == recurso.modelo);
                    let categoria = listaCategorias.find(c => c.id == modelo.categoria);

                    conexionWS.send(JSON.stringify({
                        operacion: "avisoReserva",
                        idRecurso: recurso.id,
                        origen: sanitarioActual.nombre + " " + sanitarioActual.apellidos,
                        texto: "SE HA FINALIZADO LA RESERVA DEL " + categoria.nombre.toUpperCase() + 
                               " MODELO " + modelo.nombre.toUpperCase() + 
                               " CON CÓDIGO " + recurso.numero_serie
                    }));
                });

                cargarTablas(); 
            } else {
                alert("Error al devolver el recurso");
            }
        });
    }
}
function prepararResena(idRecurso, numeroSerie) {
    idRecursoResena = idRecurso;     
    document.getElementById("Recurso").innerHTML = numeroSerie;
    document.getElementById("Valoracion").value = "5";
    document.getElementById("Texto").value = "";
    cambiarseccion("nueva-resena");
}

function guardarnuevaresena() { //WS//
    var valoracion = document.getElementById("Valoracion").value;
    var comentario = document.getElementById("Texto").value;

    if (comentario.trim() === "") {
        alert("Por favor, escribe un comentario para la reseña.");
        return;
    }

    crearResenyaRPC(idRecursoResena, sanitarioActual.id, parseInt(valoracion), comentario, function(idDevuelto) {
        if (idDevuelto != null) {
            let recurso = listaRecursos.find(rec => rec.id == idRecursoResena);
            let modelo = listaModelos.find(m => m.id == recurso.modelo);
            let categoria = listaCategorias.find(c => c.id == modelo.categoria);

            conexionWS.send(JSON.stringify({
                operacion: "avisoResenya",
                origen: sanitarioActual.nombre + " " + sanitarioActual.apellidos,
                texto: "SE HA CREADO UNA RESEÑA PARA EL " + categoria.nombre.toUpperCase() + 
                       " MODELO " + modelo.nombre.toUpperCase() + 
                       " CON CÓDIGO " + recurso.numero_serie + 
                       " Y PUNTUACIÓN " + valoracion
            }));

            alert("Reseña guardada correctamente. ¡Gracias!");
            cambiarseccion("aplicacion"); 
        } else {
            alert("Error al guardar la reseña.");
        }
    });
}


function nuevareserva() {
    document.getElementById("cuerpo-tabla-nueva-reserva").innerHTML = "";
    
    var selectCat = document.getElementById("categoria");
    selectCat.innerHTML = "<option value=''>Seleccione categoría...</option>";
    
    for (var i = 0; i < listaCategorias.length; i++) {
        selectCat.innerHTML += "<option value='" + listaCategorias[i].id + "'>" + listaCategorias[i].nombre + "</option>";
    }
    document.getElementById("modelo").innerHTML = "<option value=''>Seleccione modelo...</option>";
    document.getElementById("Tiempo").value = "1";

    cambiarseccion("nueva-reserva");
}
function filtrarModelos() {
    var idCat = document.getElementById("categoria").value;
    var selectMod = document.getElementById("modelo");
    
    selectMod.innerHTML = "<option value=''>Seleccione modelo...</option>";
    document.getElementById("cuerpo-tabla-nueva-reserva").innerHTML = ""; 

    if (idCat != "") {
        var modelosFiltrados = listaModelos.filter(m => m.categoria == idCat);
        for (var i = 0; i < modelosFiltrados.length; i++) {
            selectMod.innerHTML += "<option value='" + modelosFiltrados[i].id + "'>" + modelosFiltrados[i].nombre + "</option>";
        }
    }
}


function buscarreserva() {
    var idModelo = document.getElementById("modelo").value;
    var tbody = document.getElementById("cuerpo-tabla-nueva-reserva");
    tbody.innerHTML = ""; 

    if (idModelo === "") {
        alert("Por favor, selecciona un modelo primero.");
        return;
    }
    var recursosFiltrados = listaRecursos.filter(r => r.modelo == idModelo);

    if (recursosFiltrados.length === 0) {
        tbody.innerHTML = "<tr><td colspan='5'>No hay recursos de este modelo.</td></tr>";
        return;
    }

    var i = 0;
    function procesarSiguiente() {
        if (i >= recursosFiltrados.length) return; 

        var recurso = recursosFiltrados[i];
        var ubicacion = listaUbicaciones.find(u => u.id == recurso.ubicacion);

        tiempoPendiente(recurso.id, function(hRest) {
            var tr = "<tr>";
            // Añadimos data-label a la búsqueda
            tr += "<td data-label='N.Serie'>" + recurso.numero_serie + "</td>";
            tr += "<td data-label='Ubicación'>" + (ubicacion ? ubicacion.nombre : "-") + "</td>";

            var textoHRest = (hRest === 0) ? "Disponible" : hRest;
            tr += "<td data-label='H.Rest.'>" + textoHRest + "</td>";
            
            var resenasAparato = listaResenas.filter(res => res.recurso == recurso.id);
            var valoracionMedia = "-"; 
            
            if (resenasAparato.length > 0) {
                var suma = 0;
                for (var j = 0; j < resenasAparato.length; j++) {
                    suma += resenasAparato[j].valor;
                }
                valoracionMedia = (suma / resenasAparato.length).toFixed(1);
            }
            
            tr += "<td data-label='Valoración'>" + valoracionMedia + "</td>";

            tr += "<td data-label='Acciones'>";
            if (hRest === 0) {
                tr += "<button onclick='ejecutarPeticion(" + recurso.id + ", \"retirar\")'>Retirar</button>";
            } else {
                tr += "<button translate='no' onclick='ejecutarPeticion(" + recurso.id + ", \"reservar\")'>Reservar</button>";
            }
            tr += "</td>";

            tr += "</tr>";
            tbody.innerHTML += tr;

            i++;
            procesarSiguiente();
        });
    }
    procesarSiguiente(); 
}

function ejecutarPeticion(idRecurso, accion) {
    var horas = document.getElementById("Tiempo").value;
    if (horas === "" || horas < 1) {
        alert("Por favor, introduce un tiempo estimado válido.");
        return;
    }
    var mensaje = (accion === "retirar") 
        ? "¿Deseas retirar este recurso ahora mismo por " + horas + " horas?"
        : "¿Deseas reservar este recurso por " + horas + " horas para cuando esté libre?";

    if (confirm(mensaje)) {
        reservarRecursoRPC(idRecurso, sanitarioActual.id, horas, function(idReserva) {
            if (idReserva != null) {
                if (accion === "retirar") {
                    iniciarReservaRPC(idReserva, function(exito) {
                        alert("¡Recurso retirado con éxito!");
                        cargarTablas();
                        cambiarseccion("aplicacion");
                    });
                } else {
                    alert("¡Recurso reservado con éxito! Está en tu lista de pendientes.");
                    cargarTablas();
                    cambiarseccion("aplicacion");
                }
            } else {
                alert("Error al procesar la solicitud.");
            }
        });
    }
}

function conectarAvisos() {//WS//
    conexionWS = new WebSocket("ws://localhost:4444", "hospital");
    
    conexionWS.onopen = function() {
        conexionWS.send(JSON.stringify({
            operacion: "identificar",
            id: sanitarioActual.id,
            rol: "sanitario",
            nombre: sanitarioActual.nombre + " " + sanitarioActual.apellidos
        }));
    };

    conexionWS.onmessage = function(evt) {
        var msg = JSON.parse(evt.data);
        var tabla = document.getElementById("tabla-avisos");
        var color = "white"; 
        
        if (msg.operacion === "avisoReserva") color = "red";
        if (msg.operacion === "avisoNuevoRecurso") color = "blue";
        if (msg.operacion === "avisoResenya") color = "green";

        var tr = "<tr style='color: " + color + "'>";
        tr += "<td data-label='Fecha'>" + new Date(msg.fecha).toLocaleString() + "</td>";
        tr += "<td data-label='Origen'>" + msg.origen + "</td>";
        tr += "<td data-label='Aviso'>" + msg.texto + "</td>";
        tr += "</tr>";
        
        tabla.innerHTML += tr;
    };
}
















