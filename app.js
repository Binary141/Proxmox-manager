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

const server = http.createServer(app)
const exec = require('ssh-exec')
const v_host = config.ip
const server_password = config.password
const server_username = config.username;
const privKey = config.privKey;

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
	console.log("DATA: ", data)
	res.send(data); //JSON.stringify(data));
}

async function execute_vmid(command){
	await ssh.connect({
		host: v_host,
		username: server_username,
		privateKey: readFileSync(privKey, 'utf8')
	})
	const result = await ssh.execCommand(command);
	return result.stdout;
}

async function getHostStats(res, command) {
	console.log("HOSTSTATS: ", command);
	const results = await execute_vmid(command);
	console.log(results)
	res.send('200');
	//sendfunc(results,res);
}

async function parse_id(res){
	let new_data = await execute_vmid('ls -la /etc/pve/nodes/pve/qemu-server/ | awk \'{print $9}\'');
	let array = new_data.split('');
	let temp = [];
	let temp_str = "";
	let vmid_list = [];
	let commands = [];
	let config = "";
	let response = {};
	let text = '';

	for(i in array){
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
			vmid_list.push(temp[i].slice(1))
		}
	}
	//console.log("VMID: ", vmid_list);

	for(i = 0; i < vmid_list.length; i++){
		command = 'cat /etc/pve/nodes/pve/qemu-server/' + vmid_list[i] + '.conf';
		commands.push(command);
	}
	for(i=0; i < commands.length; i++){
		let args = '';
		let notes = "";
		vmid = await execute_vmid(commands[i]);
		config = vmid.split(/\r\n|\n\r|\n|\r/);

		for(j=0; j < config.length; j++){
			index = config[j];
			if(index[0] != '#'){
				word = index.slice(0, index.indexOf(":"));
				value = index.slice(index.indexOf(":")+2)
				args += '"' +  word.toString() + '"' + ':' + '"' + value.toString() + '",\n';
			}
			else{
				if(j == 0){
					notes += index.slice(1);
				}
				else{
					notes += ',' + index.slice(1);

				}
			}
		}

		args += '"notes":"' + notes + '",\n';

		await execute_vmid("ps aux | grep -i \"id " + vmid_list[i] + "\" | grep kvm | awk \'{ print \$1 }\'").then( (result) => {
			if(result.length > 4) {
				//console.log("VM: ", vmid_list[i], "is ALIVE");
				args += '"is_active":"1"'
			}
			else{
				//console.log("VM: ", vmid_list[i], "is DEAD");
				args += '"is_active":"0"'
			}
		});

		if(i < (commands.length - 1)){
			text += '{ "id": "' + vmid_list[i].toString() + '",' + args + '\n},\n';
		}
		else{
			text += '{ "id": "' + vmid_list[i].toString() + '",' + args + '\n}\n';
		}

	}
	new_text = '[ ' + text + ']';
	console.log("SENT");
	sendfunc(new_text, res);
}
app.get('/test', (req, res) => {
	console.log("Request");
	parse_id(res);
})

app.post('/startvm', (req, res) => {
	start_command = "qm start " + req.body.id;
	console.log("start command", start_command);
	getHostStats(res, start_command);
})
app.post('/stopvm', (req, res) => {
	stop_command = "qm stop " + req.body.id;
	console.log("stop command:", stop_command);
	getHostStats(res, stop_command);
})
app.post('/clonevm', (req, res) => {
	start_command = "qm clone " + req.body.id + " " + req.body.newVmId + " --full"
	console.log("stop command", start_command);
	getHostStats(res, start_command);
})
app.put('/renamevm', (req, res) => {
	start_command = "qm set " + req.body.vmid + " --name " + req.body.newName;
	console.log("rename command", start_command);
	getHostStats(res, start_command);
})
app.listen(port, function() {
	console.log('the server is listening on ', port);
})
