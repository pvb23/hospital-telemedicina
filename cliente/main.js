
var gestoractual=null;

var listaCategorias = [];
var listaModelos = [];
var listaUbicaciones = [];

var idrecursoactual=null;

var conexionWS = null;

const mapaAreas = {//
    1: "Alergología", 2: "Anestesiología", 3: "Cardiología", 4: "Cirugía General",
    5: "Dermatología", 6: "Aparato Digestivo", 7: "Endocrinología", 8: "Ginecología",
    9: "Hematología", 10: "Medicina Interna", 11: "Neumología", 12: "Neurología",
    13: "Oftalmología", 14: "Oncología", 15: "Pediatría", 16: "Psiquiatría",
    17: "Traumatología", 18: "Urología"
};


function cambiarseccion(seccion){
    document.getElementById('inicio').style.display="none";
    document.getElementById('registro').style.display="none";
    document.getElementById('aplicacion').style.display="none";
    document.getElementById('ficha-recurso').style.display="none"; 
    document.getElementById('editar-registro').style.display="none";
    document.getElementById(seccion).style.display="block";
}

function entrar(){ //
    var u = document.getElementById("usuario").value;
    var p = document.getElementById("contrasena").value;
    
    rest.post("/api/gestores/login", {usuario: u, contrasena: p}, function(estado, respuesta){
        if(estado == 200){
            gestoractual = respuesta.gestor;
            tokenGlobal = respuesta.token;

            document.getElementById("nombre-gestor-bienvenida").innerHTML = gestoractual.nombre + " " + gestoractual.apellido;
            cargardesplegables();          
            conectarAvisosGestor();
            cargarRankingMinisterio();///
            
            cambiarseccion("aplicacion");
        } else if (estado == 403) {
            alert("Usuario o contraseña incorrectos");
        } else {
            alert("ERROR DEL SERVIDOR. Estado: " + estado + ". Respuesta: " + respuesta);
        }
    });
}

function registrarse(){
    var g ={
        nombre: document.getElementById("nombre").value,
        apellido: document.getElementById("apellido").value,
        usuario: document.getElementById("usuario-registro").value,
        contrasena: document.getElementById("contrasena-registro").value
    }
    if(g.nombre=="" || g.apellido=="" || g.usuario=="" || g.contrasena==""){
        alert("Por favor, rellena todos los campos");
        return;
    }
    rest.post("/api/gestores",g,function(estado,respuesta){
        if(estado==201){
            alert("Registro completado")
            cambiarseccion('inicio')
        } else if (estado==400) {
            alert("Error: " + respuesta); 
        } else {
            alert("ERROR DEL SERVIDOR. Estado: " + estado);
        }
    })
}

function salir() { 
    if (conexionWS) {
        conexionWS.close();
    }
    document.getElementById("tabla-avisos").innerHTML = "";
    document.getElementById("usuario").value = "";
    document.getElementById("contrasena").value = "";
    cambiarseccion("inicio");
    
    console.log("Sesión y conexión de avisos cerradas");
}


function editardatosusuario(){
    if(gestoractual==null)return;
    document.getElementById("editar-usuario").value=gestoractual.usuario
    document.getElementById("editar-contrasena").value=gestoractual.contrasena
    document.getElementById("editar-nombre").value=gestoractual.nombre
    document.getElementById("editar-apellido").value=gestoractual.apellido
    cambiarseccion("editar-registro");
}

 function guardardatosusuario(){
    var g ={
        usuario: document.getElementById("editar-usuario").value,
        contrasena: document.getElementById("editar-contrasena").value,
        nombre: document.getElementById("editar-nombre").value,
        apellido: document.getElementById("editar-apellido").value
    }
    rest.put("/api/gestores/" + gestoractual.id , g, function(estado,respuesta){
        if(estado==200){
            gestoractual=respuesta
            document.getElementById("nombre-gestor-bienvenida").innerHTML= respuesta.nombre + " " + respuesta.apellido;
            cambiarseccion("aplicacion");
        }else{
            alert("El nombre de usuario ya existe")
        }
    })
}


function cargardesplegables(){
    rest.get("/api/categorias",function(estado,respuesta){
        if(estado==200){
            listaCategorias=respuesta;
            var select=document.getElementById("categoria")
            var select2=document.getElementById("categoria-ficha")
            select.innerHTML= "<option value=''>Todas</option>"
            select2.innerHTML= ""
            for(var i=0; i<respuesta.length; i++){
                select.innerHTML += "<option value='" + respuesta[i].id + "'>" + respuesta[i].nombre + "</option>";
                select2.innerHTML += "<option value='" + respuesta[i].id + "'>" + respuesta[i].nombre + "</option>";
            }
        }
        
    })
    rest.get("/api/modelos",function(estado,respuesta){
        if(estado==200){
            listaModelos=respuesta;
            var select=document.getElementById("modelo")
            var select2=document.getElementById("modelo-ficha")
            select.innerHTML= "<option value=''>Todos</option>"
            select2.innerHTML= ""
            for(var i=0; i<respuesta.length; i++){
                select.innerHTML += "<option value='" + respuesta[i].id + "'>" + respuesta[i].nombre + "</option>"
                select2.innerHTML += "<option value='" + respuesta[i].id + "'>" + respuesta[i].nombre + "</option>"
            }
        }
    })
    rest.get("/api/ubicaciones",function(estado,respuesta){
        if(estado==200){
            listaUbicaciones=respuesta;
            var select=document.getElementById("ubicacion")
            var select2=document.getElementById("ubicacion-ficha")
            select.innerHTML= "<option value=''>Todas</option>"
            select2.innerHTML= ""
            for(var i=0; i<respuesta.length; i++){
                select.innerHTML += "<option value='" + respuesta[i].id + "'>" + respuesta[i].nombre + "</option>"
                select2.innerHTML += "<option value='" + respuesta[i].id + "'>" + respuesta[i].nombre + "</option>"
            }
        }
    })
}


function buscarrecursos(){
    var categoria=document.getElementById("categoria").value
    var modelo=document.getElementById("modelo").value
    var ubicacion=document.getElementById("ubicacion").value
    var estado=document.getElementById("estado").value

    var url = "/api/recursos?";
    if(categoria!="") url += "categoria=" + categoria + "&";
    if(modelo!="") url += "modelo=" + modelo + "&";
    if(ubicacion!="") url += "ubicacion=" + ubicacion + "&";
    if(estado!="") url += "estado=" + estado + "&";

    rest.get(url,function(estado,respuesta){
        if(estado==200){
            var tabla=document.getElementById("cuerpo-tabla")
            tabla.innerHTML=""
            
            for(var i=0; i<respuesta.length; i++){
                var r=respuesta[i]
                var nombremodelo=""
                var idcategoria=""
               
                for (var j=0; j<listaModelos.length; j++){
                    if(listaModelos[j].id==r.modelo){
                        nombremodelo=listaModelos[j].nombre
                        idcategoria=listaModelos[j].categoria
                        break;
                    }
                }
                var nombrecategoria=""
                for (var j=0; j<listaCategorias.length; j++){
                    if(listaCategorias[j].id==idcategoria){
                        nombrecategoria=listaCategorias[j].nombre
                        break;
                    }
                }

                var nombreubicacion=""
                for (var j=0; j<listaUbicaciones.length; j++){
                    if(listaUbicaciones[j].id==r.ubicacion){
                        nombreubicacion=listaUbicaciones[j].nombre
                        break;
                    }
                }
                var textoestado="Operativo"
                if(r.estado==1) textoestado="Baja"
                if(r.estado==2) textoestado="Mantenimiento"

                var tr = "<tr>";
                tr += "<td>" + r.numero_serie + "</td>";
                tr += "<td>" + nombrecategoria + "</td>";
                tr += "<td>" + nombremodelo + "</td>";
                tr += "<td>" + nombreubicacion + "</td>";
                tr += "<td>" + textoestado + "</td>";
                tr += "<td><button onclick='abrirrecurso(" + r.id + ")'>Abrir</button> <button onclick='borrarrecurso(" + r.id + ")'> Borrar </button></td>";
                tr += "</tr>";

                tabla.innerHTML += tr;
            
            }
        }
    })
}

function borrarrecurso(id){
    if(confirm("¿Está seguro de que desea borrar este recurso?")){
        rest.delete("/api/recursos/" + id, function(estado,respuesta){
            if(estado==200){
                buscarrecursos();
            }else{
                alert("Error al borrar el recurso");
            }
        })
    }
}

function abrirrecurso(id){
    idrecursoactual=id;
    rest.get ("/api/recursos/"+id,function(estado,respuesta){
        if(estado==200){
            document.getElementById("nserie-ficha").value=respuesta.numero_serie
            document.getElementById("ubicacion-ficha").value = respuesta.ubicacion;
            document.getElementById("estado-ficha").value = respuesta.estado;

            var idcategoria=""
            for (var j=0; j<listaModelos.length; j++){
                if(listaModelos[j].id==respuesta.modelo){
                    idcategoria=listaModelos[j].categoria
                    break;
                }
            }
            
            document.getElementById("categoria-ficha").value=idcategoria
            filtrarModelosFicha();
            document.getElementById("modelo-ficha").value = respuesta.modelo;

            cargarreservas(id);
            cargarresenyas(id);
            cambiarseccion("ficha-recurso");
        }
    })
}

function guardarrecurso(){//WS//
    var modelo = document.getElementById("modelo-ficha").value;
    var nserie = document.getElementById("nserie-ficha").value;
    var ubicacion = document.getElementById("ubicacion-ficha").value;
    var estado = document.getElementById("estado-ficha").value;

    if(modelo == "" || nserie == "" || ubicacion == ""){
        alert("Por favor, rellena el modelo, el número de serie y la ubicación");
        return;
    }

    var nuevo={
        modelo: parseInt(modelo),
        numero_serie: nserie,
        ubicacion: parseInt(ubicacion),
        estado: parseInt(estado)
    }

    if(idrecursoactual==null){
        rest.post("/api/recursos",nuevo,function(estado,respuesta){
            if(estado==201){
                
                if (conexionWS) {
                    var idCategoriaElegida = document.getElementById("categoria-ficha").value;
                    var nombreCat = listaCategorias.find(c => c.id == idCategoriaElegida).nombre;
                    var nombreMod = listaModelos.find(m => m.id == modelo).nombre;
                    
                    conexionWS.send(JSON.stringify({
                        operacion: "avisoNuevoRecurso",
                        origen: gestoractual.nombre + " " + gestoractual.apellido,
                        texto: "SE HA CREADO UN NUEVO RECURSO " + nombreCat.toUpperCase() + 
                               " MODELO " + nombreMod.toUpperCase() + 
                               " CON CÓDIGO " + nserie
                    }));
                }

                buscarrecursos();
                cambiarseccion("aplicacion");
            }else{
                alert("Error al añadir el recurso");
            }
        })
    }else{
        rest.put("/api/recursos/" + idrecursoactual, nuevo, function(estado,respuesta){
            if(estado==200){
                buscarrecursos();
                cambiarseccion("aplicacion");
            }else{
                alert("Error al modificar el recurso");
            }
        })
    }
}

function añadirrecurso(){
    idrecursoactual=null;
    document.getElementById("categoria-ficha").value = "";
    document.getElementById("modelo-ficha").value = "";
    document.getElementById("nserie-ficha").value = "";
    document.getElementById("ubicacion-ficha").value = "";
    document.getElementById("estado-ficha").value = "0"; 

    document.getElementById("cuerpo-tabla-reservas").innerHTML = "";
    document.getElementById("cuerpo-tabla-resenas").innerHTML = "";

    filtrarModelosFicha();

    cambiarseccion("ficha-recurso");
}

function filtrarModelosFicha() {
    var idCategoriaElegida = document.getElementById("categoria-ficha").value;
    var selectModelo = document.getElementById("modelo-ficha");
    
    selectModelo.innerHTML = ""; 
    for (var i = 0; i < listaModelos.length; i++) {
        if (idCategoriaElegida == "" || listaModelos[i].categoria == idCategoriaElegida) {
            selectModelo.innerHTML += "<option value='" + listaModelos[i].id + "'>" + listaModelos[i].nombre + "</option>";
        }
    }
}


function cargarreservas(){  
    rest.get("/api/recursos/" + idrecursoactual + "/reservas", function(estado,respuesta){
        if(estado==200){
            var tabla=document.getElementById("cuerpo-tabla-reservas")
            tabla.innerHTML=""
            for(var i=0; i<respuesta.length; i++){
                var reserva=respuesta[i]

                rest.get("/api/sanitarios/" + reserva.sanitario, (function(reservaActual){
                    return function(estado2,respuesta2){
                        var nombreSanitario = "";
                        if(estado2==200){
                            nombreSanitario = respuesta2.nombre + " " + respuesta2.apellidos;
                        }

                        var color="white"
                        if(reservaActual.fecha_inicio == null){
                            color="lightgreen"
                        }else if(reservaActual.fecha_fin == null){
                            var inicio = new Date(reservaActual.fecha_inicio);
                            var ahora = new Date();
                            var horasTranscurridas = (ahora - inicio) / (1000 * 60 * 60);

                            if(horasTranscurridas > reservaActual.horas_estimadas){
                                color = "lightcoral";
                            }else{
                                color = "lightblue";
                            }
                        }
                        var fpeticion = reservaActual.fecha_peticion ? new Date(reservaActual.fecha_peticion).toLocaleString() : "";
                        var finicio = reservaActual.fecha_inicio ? new Date(reservaActual.fecha_inicio).toLocaleString() : "";
                        var ffin = reservaActual.fecha_fin ? new Date(reservaActual.fecha_fin).toLocaleString() : "";

                        var tr = "<tr style='background-color:" + color + "'>";
                        tr += "<td>" + nombreSanitario + "</td>";
                        tr += "<td>" + reservaActual.horas_estimadas + "</td>";
                        tr += "<td>" + fpeticion + "</td>";
                        tr += "<td>" + finicio + "</td>";
                        tr += "<td>" + ffin + "</td>";
                        tr += "</tr>";

                        tabla.innerHTML += tr;
                    }
                })(reserva)); 
            }
        }
    })
}
                   
function cargarresenyas(){  
    rest.get("/api/recursos/"+ idrecursoactual + "/resenyas", function(estado,respuesta){
        if(estado==200){
            var tabla=document.getElementById("cuerpo-tabla-resenas")
            tabla.innerHTML=""
            for(var i=0; i<respuesta.length; i++){
                var resenya=respuesta[i]
                
                rest.get("/api/sanitarios/" + resenya.sanitario, (function(resenyaActual){
                    return function(estado2,respuesta2){
                        var nombreSanitario = "";
                        if(estado2==200){
                            nombreSanitario = respuesta2.nombre + " " + respuesta2.apellidos;
                        }
                        var fresenya = resenyaActual.fecha ? new Date(resenyaActual.fecha).toLocaleString() : "";

                        var tr = "<tr>";
                        tr += "<td>" + fresenya + "</td>";
                        tr += "<td>" + nombreSanitario + "</td>";
                        tr += "<td>" + resenyaActual.valor + "</td>";
                        tr += "<td>" + resenyaActual.descripcion + "</td>";
                        tr += "</tr>";
                        tabla.innerHTML += tr;
                    }
                })(resenya)); 
            }
        }
    })
}

function conectarAvisosGestor() { //WS//
    conexionWS = new WebSocket("ws://localhost:4444", "hospital");
    
    conexionWS.onopen = function() {
        conexionWS.send(JSON.stringify({
            operacion: "identificar",
            id: gestoractual.id, 
            rol: "gestor", 
            nombre: gestoractual.nombre + " " + gestoractual.apellido
        }));
    };

    conexionWS.onmessage = function(evt) {
        var msg = JSON.parse(evt.data);
        var tabla = document.getElementById("tabla-avisos");
        var color = "white";
        
        if (msg.operacion === "avisoResenya") color = "green";


        var tr = "<tr style='color: " + color + "'>";
        tr += "<td>" + new Date(msg.fecha).toLocaleString() + "</td>";
        tr += "<td>" + msg.origen + "</td>";
        tr += "<td>" + msg.texto + "</td>";
        tr += "</tr>";
        
        tabla.innerHTML += tr;
    };
}

async function cargarRankingMinisterio() {///
    try {
        const respuesta = await fetch("https://undefined.ua.es/telemedicina/api/datos");
        const datosMinisterio = await respuesta.json();

        let conteoReservas = {};
        
        for (let i = 0; i < datosMinisterio.length; i++) {
            let registro = datosMinisterio[i];
            let id = registro.id_area;
            let cantidad = registro.datos ? registro.datos.length : 0;
            
            if (conteoReservas[id]) {
                conteoReservas[id] += cantidad;
            } else {
                conteoReservas[id] = cantidad;
            }
        }
        let arrayRanking = [];
        for (let id in conteoReservas) {
            arrayRanking.push({
                area: mapaAreas[id] || "Área Desconocida",
                total: conteoReservas[id]
            });
        }
        arrayRanking.sort((a, b) => b.total - a.total);

        let tbody = document.getElementById("tabla-ranking-ministerio");
        tbody.innerHTML = "";

        for (let i = 0; i < arrayRanking.length; i++) {
            let item = arrayRanking[i];
            let tr = "<tr>";
            tr += "<td>" + item.area + "</td>";
            tr += "<td>" + item.total + "</td>";
            tr += "</tr>";
            tbody.innerHTML += tr;
        }

    } catch (error) {
        console.error("Error al obtener los datos del ministerio:", error);
    }
}

async function enviarDatosMinisterio() {
    if (!gestoractual) {
        alert("Debes iniciar sesión para enviar datos.");
        return;
    }

    try {
        let resReservas = await fetch("/api/reservas?token=" + tokenGlobal);
        let reservas = await resReservas.json();

        let resRec = await fetch("/api/recursos?token=" + tokenGlobal);
        let listaRecursos = await resRec.json();

        let todosLosRegistros = [];

        for (let i = 0; i < reservas.length; i++) {
            let r = reservas[i];

            let recurso = listaRecursos.find(rec => rec.id == r.recurso);
            if(!recurso) continue;
            
            let modelo = listaModelos.find(m => m.id == recurso.modelo);
            
            // LA LÍNEA MÁGICA: Si el recurso tiene un modelo borrado o que no existe, lo saltamos para que no se rompa
            if(!modelo) continue; 

            let categoria = listaCategorias.find(c => c.id == modelo.categoria);

            let nombreSanitario = "Desconocido";
            let apellidosSanitario = "Desconocido";
            try {
                let resSanitario = await fetch("/api/sanitarios/" + r.sanitario + "?token=" + tokenGlobal);
                if(resSanitario.ok){
                    let sanitarioDB = await resSanitario.json();
                    nombreSanitario = sanitarioDB.nombre;
                    apellidosSanitario = sanitarioDB.apellidos;
                }
            } catch(e) {}

            let fPet = r.fecha_peticion ? r.fecha_peticion.split('T')[0] : "";
            let fIni = r.fecha_inicio ? r.fecha_inicio.split('T')[0] : "";
            let fFin = r.fecha_fin ? r.fecha_fin.split('T')[0] : "";

            let registroSanitario = {
                nombre: nombreSanitario,
                apellidos: apellidosSanitario,
                categoría: categoria ? categoria.nombre : "General",
                horas_estimadas: r.horas_estimadas,
                fec_pet: fPet,
                fec_ini: fIni,
                fecha_fin: fFin
            };

            todosLosRegistros.push(registroSanitario);
        }
        
        let hoy = new Date().toISOString().split('T')[0]; 
        
        let bodyMinisterio = {
            id_area: 13,
            fecha: hoy,
            datos: todosLosRegistros
        };
        
        let respuestaMin = await fetch("https://undefined.ua.es/telemedicina/api/datos", {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(bodyMinisterio)
        });
        
        if (respuestaMin.ok) {
            alert("Se han enviado los datos al Ministerio con éxito (Área 13).");
            cargarRankingMinisterio();
        } else {
            alert("Error al enviar los datos. El servidor del profesor rechazó la petición.");
        }

    } catch (error) {
        console.error("Error al enviar al ministerio:", error);
        alert("Hubo un error al enviar los datos.");
    }
}
        


cambiarseccion("inicio");