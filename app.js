const config = require("./config.json");
const express = require("express")
const bodyParser = require("body-parser");
const app = express()
const port = 8080
const http = require('http')
const cors = require('cors')
var server = http.createServer(app)
var exec = require('ssh-exec')
var v_host = config.ip
var server_password = config.password
var server_username = config.username;

output = "";

app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.all('/*', function(req, res, next) {
	res.header("Access-Control-Alow-Origin", "*");
	res.header("AccessControl-Allow-Headers", "X-Requested-With");
	next();
});

function sendfunc(data, res) {
	res.send(JSON.stringify(data));
}

function executeSshCommand (host, command) {
  return new Promise((resolve, reject) => {
    exec(command, {//'qm list', {
      user: server_username,
      host: host,
      password: server_password
    }, (err, stdout) => {
      if (err) { 
        console.log("THE ERROR IS: ", err);
      }
      
      result = stdout.split('\n');
      resolve(result)      
    })
  })
}

async function getHostStats(host, res, command) {
	const results = await executeSshCommand(host, command);
	console.log(results)
	sendfunc(results,res);
}

app.get('/test', (req, res) => {
	getHostStats(v_host, res, "qm list");
})

app.post('/startvm', (req, res) => {
	start_command = "qm start " + req.body.id;
	console.log("start command", start_command);
	getHostStats(v_host, res, start_command);
})

app.post('/stopvm', (req, res) => {
	start_command = "qm stop " + req.body.id;
	console.log("stop command", start_command);
	getHostStats(v_host, res, start_command);
})

app.post('/clonevm', (req, res) => {
	start_command = "qm clone " + req.body.id + " 119 --full --name clone1"
	console.log("stop command", start_command);
	getHostStats(v_host, res, start_command);
})

app.put('/renamevm', (req, res) => {
	start_command = "qm set " + req.body.id + " --name " + req.body.newName;
	console.log("rename command", start_command);
	//getHostStats(v_host, res, start_command);
})

app.listen(port, function() {
	console.log('the server is listening on ', port);
})


