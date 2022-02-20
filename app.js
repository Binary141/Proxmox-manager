// --------- Require Setups ---------------
const config = require("./config.json");
const express = require("express")
const bodyParser = require("body-parser");
const http = require('http')
const cors = require('cors')
const { readFileSync } = require('fs');
const { NodeSSH } = require('node-ssh');
const exec = require('ssh-exec')

// ------- Variable Assignments ---------------
const app = express()
const port = 8080
const ssh = new NodeSSH();
const server = http.createServer(app)
const v_host = config.ip
const server_password = config.password
const server_username = config.username;
const privKey = config.privKey;

// ------- Express setup -------
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));

app.all('/*', function(req, res, next) {
	res.header("Access-Control-Alow-Origin", "*");
	res.header("AccessControl-Allow-Headers", "X-Requested-With");
	next();
});
// ----- End Express setup ----


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
	const results = await execute_vmid(command);
	res.sendStatus(200);
}

async function ssh_command(command) {
	const results = await execute_vmid(command);
}

async function parse_id(res){
	let new_data = await execute_vmid('ls -la /etc/pve/nodes/pve/qemu-server/ | awk \'{print $9}\' | awk \'NR>3\' | sed \'s/.\\{4\\}\$//\'');
	//magical awk and sed statements. print $9 will list just the .conf files, then will print from the top rows removing 
	//the . and .. from the directory, then the sed will remove the last 4 characters leaving just the . of the extension 
	//so it can be split into an array
	let vmid_list = new_data.replace(/\n/g, '').split('.');
	let conf_files = new_data.split('');
	let commands = [];
	let config = "";
	let text = '';

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
				notes += index.slice(1);
			}
		}

		args += '"notes":"' + notes + '",\n';

		await execute_vmid("ps aux | grep -i \"id " + vmid_list[i] + "\" | grep kvm | awk \'{ print \$1 }\'").then( (result) => {
			if(result.length > 4) {
				args += '"is_active":"1"'
			}
			else{
				args += '"is_active":"0"'
			}
		});

		if(i < (commands.length - 1)){ //checks if i is at the end of the list, if it is a ',' is not needed for proper json
			text += '{ "id": "' + vmid_list[i].toString() + '",' + args + '\n},\n';
		}
		else{
			text += '{ "id": "' + vmid_list[i].toString() + '",' + args + '\n}\n';
		}
	}
	new_text = '[ ' + text + ']';
	console.log("SENT");
	res.send(new_text);
}
app.get('/test', (req, res) => {
	console.log("Request");
	parse_id(res);
});

app.post('/startvm', (req, res) => {
	start_command = "qm start " + req.body.id;
	console.log("start command", start_command);
	getHostStats(res, start_command);
});
app.post('/stopvm', (req, res) => {
	stop_command = "qm stop " + req.body.id;
	console.log("stop command:", stop_command);
	getHostStats(res, stop_command);
});
app.post('/clonevm', (req, res) => {
	clone_command = "qm clone " + req.body.id + " " + req.body.newVmId// + " --full"
	console.log("clone command", clone_command);
	getHostStats(res, clone_command);
});
app.put('/renamevm', (req, res) => {
	path = "/etc/pve/nodes/pve/qemu-server/"
	if(req.body.newName.includes(' ')){
		res.sendStatus(400);

	}
	else{
		rename_command = "qm set " + req.body.vmid + " --name " + req.body.newName + " --memory " + req.body.newMemory;
		if(req.body.newNote){
			note = req.body.newNote.slice(1,req.body.newNote.length - 1);
			note_command = "sed -i '/^#/d' " + path + req.body.vmid + ".conf; echo \"#" + note + "\" >> " + path + req.body.vmid + ".conf";
			console.log("NOTES: ", note_command);
			ssh_command(note_command);
		}
		console.log("rename command", rename_command);
		getHostStats(res, rename_command);
	}
});
app.put('/editnote', (req, res) => {
	path = "/etc/pve/nodes/pve/qemu-server/"
	if(req.body.newNote){
		note = req.body.newNote.slice(1,req.body.newNote.length - 1);
		note_command = "sed -i '/^#/d' " + path + req.body.vmid + ".conf; echo \"#" + note + "\" >> " + path + req.body.vmid + ".conf";
		console.log("NOTES: ", note_command);
		ssh_command(note_command);
	}
	res.sendStatus(200);
});
app.listen(port, function() {
	console.log('the server is listening on ', port);
});
