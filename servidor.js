
var express=require("express");
var app=express();

app.use(express.static("cliente"));
app.use(express.json())

require("./servidor_rest.js")(app); 
require("./servidor_rpc.js")();
var ws = require("./servidor_ws.js")();

app.listen(3000, function() {
    console.log("Servidor principal iniciado en el puerto 3000");
});

//http://localhost:8080/phpmyadmin
//http://localhost:3000/  
//http://localhost:3000/sanitario.html

//cd C:\Users\P4c0V1v4nc05\AppData\Local\Android\sdk\platform-tools
//.\adb reverse tcp:3501 tcp:3501
//.\adb reverse tcp:4444 tcp:4444

//cd "C:\Users\P4c0V1v4nc05\Downloads\Ano 4\1 cuatri\telemedicina\proyectoTm\Proyecto\appSanitarios"
//cordova run android

