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
const max_vm_size = 32;
const directory = "/etc/pve/nodes/$HOSTNAME/qemu-server/";

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
	console.log("END OF RESULTS");
	res.sendStatus(200);
}

async function ssh_command(command) {
	const results = await execute_vmid(command);
}

async function ssh_commands(res, command1, command2) {
	const results = await execute_vmid(command1);
	const results2 = await execute_vmid(command2);
	console.log("END OF RESULTS");
	res.sendStatus(200);
}

async function parse_id(res){
	let new_data = await execute_vmid('ls -la ' + directory +' | awk \'{print $9}\' | awk \'NR>3\' | sed \'s/.\\{4\\}\$//\'');
	//magical awk and sed statements. print $9 will list just the .conf files, then will print from the top rows removing 
	//the . and .. from the directory, then the sed will remove the last 4 characters leaving just the . of the extension 
	//so it can be split into an array
	let vmid_list = new_data.replace(/\n/g, '').split('.').filter(Number);
	let conf_files = new_data.split('');
	let commands = [];
	let config = "";
	let text = '';

	for(i = 0; i < vmid_list.length; i++){
		let command = 'cat ' + directory + vmid_list[i] + '.conf';
		commands.push(command);
	}
	for(i=0; i < commands.length; i++){
		let args = '';
		let notes = "";
		let vmid = await execute_vmid(commands[i]);
		config = vmid.split(/\r\n|\n\r|\n|\r/);

		for(j=0; j < config.length; j++){
			index = config[j];
			if(index[0] != '#'){
				let word = index.slice(0, index.indexOf(":"));
				let value = index.slice(index.indexOf(":")+2)
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
	let new_text = '[ ' + text + ']';
	console.log("SENT");
	res.send(new_text);
}
app.get('/test', (req, res) => {
	console.log("Request");
	parse_id(res);
});

app.post('/startvm', (req, res) => {
	let start_command = "qm start " + req.body.id;
	console.log("start command", start_command);
	getHostStats(res, start_command);
});
app.post('/stopvm', (req, res) => {
	let stop_command = "qm stop " + req.body.id;
	console.log("stop command:", stop_command);
	getHostStats(res, stop_command);
});
app.post('/clonevm', (req, res) => {
	let clone_command = "qm clone " + req.body.id + " " + req.body.newVmId;// + " --full"
	let add_vnc = "echo args: -vnc 0.0.0.0:" + req.body.newVncPort + " >> " + directory + req.body.newVmId + ".conf"; 
	console.log("vnc port: ", req.body.newVncPort)
	console.log("clone command", clone_command);
	ssh_commands(res, clone_command, add_vnc);
});
app.put('/renamevm', (req, res) => {
	console.log("CORES: ", req.body.coreCount);
	if(req.body.newName.includes(' ')){
		res.sendStatus(400);

	}
	else{
		let rename_command = "qm set " + req.body.vmid + " --name " + req.body.newName + " --memory " + req.body.newMemory + " --cores " + req.body.coreCount;
		if(req.body.newNote){
			let note = req.body.newNote.slice(1,req.body.newNote.length - 1);
			let note_command = "sed -i '/^#/d' " + directory + req.body.vmid + ".conf; echo \"#" + note + "\" >> " + directory + req.body.vmid + ".conf";
			console.log("NOTES: ", note_command);
			ssh_command(note_command);
		}
		console.log("rename command", rename_command);
		getHostStats(res, rename_command);
	}
});
app.put('/editnote', (req, res) => {
	if(req.body.newNote){
		note = req.body.newNote.slice(1,req.body.newNote.length - 1);
		note_command = "sed -i '/^#/d' " + directory + req.body.vmid + ".conf; echo \"#" + note + "\" >> " + directory + req.body.vmid + ".conf";
		console.log("NOTES: ", note_command);
		ssh_command(note_command);
	}
	res.sendStatus(200);
});
app.put('/resizevm', (req, res) => {
	let requested_new_size = req.body.disk_increment + req.body.current_size;
	console.log("curr: ", req.body.current_size, "increment: ", req.body.disk_increment)
	if(max_vm_size < requested_new_size){
		let command = "qm resize " + req.body.vmid + " scsi0 +" + req.body.disk_increment + 'G';
		console.log(command);
		getHostStats(res, command);
	}
	else{
		res.sendStatus(400);
	}
});
app.listen(port, function() {
	console.log('the server is listening on ', port);
});
