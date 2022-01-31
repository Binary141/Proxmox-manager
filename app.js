const config = require("./config.json");
const express = require("express")
const bodyParser = require("body-parser");
const app = express()
const port = 8080
const http = require('http')
const cors = require('cors')
const db = require('./db.js');
const { Client } = require('ssh2');
const { readFileSync } = require('fs');
const conn = new Client();
const { NodeSSH } = require('node-ssh');
const ssh = new NodeSSH();

var server = http.createServer(app)
var exec = require('ssh-exec')
var v_host = config.ip
var server_password = config.password
var server_username = config.username;
var privKey = config.privKey;

db.query("Select * from vminfo", function (err, result) {
	if (err) throw err;
	console.log(result);
});

// ------- Express setup -------
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.all('/*', function(req, res, next) {
	res.header("Access-Control-Alow-Origin", "*");
	res.header("AccessControl-Allow-Headers", "X-Requested-With");
	next();
});
// ----- End Express setup ----


function sendfunc(data, res) {
	res.send(JSON.stringify(data));
}

async function getHostStats(host, res, command) {
	const results = await executeSshCommand(host, command);
	console.log(results)
	sendfunc(results,res);
}

async function execute_vmid(command){
	return new Promise((resolve, reject) => {
		ssh.connect({
			host: v_host,
			username: server_username,
			privateKey: readFileSync(privKey, 'utf8')
		}).then(function() {
			ssh.execCommand(command).then(function(result) {
				console.log("STDOUT: " + result.stdout);
				console.log('STDERR: ' + result.stderr)
				resolve(result.stdout);
			})
		})
	
	})

}

async function parse_id(){
	new_data = await execute_vmid('ls -la /etc/pve/nodes/pve/qemu-server/ | awk \'{print $9}\'');
	var array = new_data.split('');
	var temp = [];
	var temp_str = "";
	var vmid = [];
	var commands = [];

	for(i in new_data.split('')){
		if(isNaN(array[i])){
			temp.push(temp_str);
			temp_str = "";
		}
		else{
			temp_str += array[i];
		}
	}
	for(i in temp){
		if(temp[i] != "conf" && temp[i].length >= 3){
			vmid.push(temp[i].slice(1))
		}
	}
	console.log("VMID: ", vmid);
	
	for(i = 0; i < vmid.length; i++){
		command = 'cat /etc/pve/nodes/pve/qemu-server/' + vmid[i] + '.conf';
		console.log(command);
		commands.push(command);
	}
	for(i=0; i < commands.length; i++){
		vmid = await execute_vmid(commands[i]);
	}
	console.log("END");
}
app.get('/test', (req, res) => {
	console.log("Request");
	vmid = parse_id();

	sendfunc(vmid, res);
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
	start_command = "qm clone " + req.body.id + " " + req.body.newVmId + " --full"
	console.log("stop command", start_command);
	getHostStats(v_host, res, start_command);
})
app.put('/renamevm', (req, res) => {
	start_command = "qm set " + req.body.vmid + " --name " + req.body.newName;
	console.log("rename command", start_command);
	getHostStats(v_host, res, start_command);
})
app.listen(port, function() {
	console.log('the server is listening on ', port);
})
