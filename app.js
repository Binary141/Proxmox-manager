const config = require("./config.json");
const express = require("express")
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

app.all('/*', function(req, res, next) {
	res.header("Access-Control-Alow-Origin", "*");
	res.header("AccessControl-Allow-Headers", "X-Requested-With");
	next();
});

function sendfunc(data, res) {
	console.log(data);
	res.send(JSON.stringify(data));
}

function executeShhCommand (host) {
  return new Promise((resolve, reject) => {
    exec('qm list', {
      user: server_username,
      host: host,
      password: server_password
    }, (err, stdout) => {
      if (err) { 
        return reject(err) 
      }
      
      result = stdout.split('\n');
      resolve(result)      
    })
  })
}

async function getHostStats(host, res) {
	const results = await executeShhCommand(host)
	console.log('Results for', host)
	console.log(results)
	sendfunc(results,res);
}

app.get('/test', (req, res) => {
	getHostStats(v_host, res);
	console.log("request");
	//vm('qm list');
	console.log("output: ", output);
	//res.send(JSON.stringify(output));
	//console.log("response sent");
})


app.listen(port, function() {
	console.log('the server is listening on ', port);
	//exec('qm list', {
	//	user: server_username,
	//	host: '192.168.1.207',
	//	password: server_password
	//}, (err, stdout) => {
	//	if (err) { 
	//		return reject(err) 
	//	}
	//	result = stdout.split('\n');
	//	resolve(result)      
	//})
})


