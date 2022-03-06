// qm config <VMID> | grep ^args ; this will show the vnc port that is configured for a vm
REQUEST_URL = getURL();
STOP_VM_URL = getStopVmUrl();
START_VM_URL = getStartVmUrl();
CLONE_VM_URL = getCloneVmUrl();
RENAME_VM_URL = getRenameVmUrl();
EDIT_NOTE_URL = getEditNoteUrl();
DISK_VM_URL = getDiskVmUrl();

var vm_table = document.getElementById("started_vms");
var stopped_vm_table = document.getElementById("stopped_vms");
var template_table = document.getElementById("templates");
var cloneVm = document.getElementById("cloneVm");

// These are the column indexes in the tables
const vmidIndex = 0;
const coresIndex = 1;
const nameIndex = 2;
const memoryIndex = 3;
const diskIndex = 4;
const vncIndex = 5;
const notesIndex = 6;
const totalLength = 8; //this is the number of columns (vmid, cores, name, etc) plus 2 (the running status and edit button is where the 2 is calculated), this starts counting at 0

cloneVm.onclick = function(){
	if(template_table.value != ""){
		let template_vm_id = template_table[template_table.selectedIndex].vmid
		let vmids = [];
		let vncPorts = [];
		let clone_id;
		let newVncPort;

		// ------ Finds all the vm id numbers from all the tables
		for(i = 1; i < vm_table.rows.length; i++){//row in vm_table.rows){
			vmids.push(vm_table.rows[i].cells[vmidIndex].innerText);
			vncPorts.push(vm_table.rows[i].cells[vncIndex].innerText);
		}
		for(i = 1; i < stopped_vm_table.rows.length; i++){//row in vm_table.rows){
			vmids.push(stopped_vm_table.rows[i].cells[vmidIndex].innerText);
			vncPorts.push(stopped_vm_table.rows[i].cells[vncIndex].innerText);
		}
		for(i=0; i < template_table.length; i++){
			vmids.push(template_table[i].id);
			//vncPorts.push(template_table[i].id);
		}
		// ------------------

		console.log("IDS: ", vmids);
		console.log("VNC: ", vncPorts.filter(Number));

		for(i = 100; i <= 999; i++){ //finds the lowest number that isn't in the list of vmids
			if(!vmids.includes(String(i))){ //if the number is not in the list, that will be the new id of the cloned vm
				clone_id = i;
				break;
			}
		}

		for(i = 5900; i <= 7000; i++){
			if(!vncPorts.filter(Number).includes(String(i))){ //if the number is not in the list, that will be the new id of the cloned vm
				newVncPort = i-5900; //Proxmox will automatically add 5900 to the port number so we need to adjust the new port
				break;
			}
		}
		console.log("NEW VNC PORT: ", newVncPort);

		data = "id=" + template_vm_id + "&newVmId=" + clone_id + "&newVncPort=" + newVncPort;
		console.log("DATA: ", data);
		if(confirm("Are you sure you want to clone the vm " + template_vm_id)){

			fetch(CLONE_VM_URL, {
				method: 'POST',
				body: data,
				headers: {'Content-type': 'application/x-www-form-urlencoded'},
			}).then(function(response){
				if(response.status == 200){
					alert("200");
					load_urls();
				}
				else{
					alert("Something went wrong");
				}
			});
		};
	}
}

function change_state(id, url){
	data = "id=" + id;
	console.log("DATA: ", data);
	fetch(url, {
		method: 'POST',
		body: data,
		headers: {'Content-type': 'application/x-www-form-urlencoded'},
	}).then(function(response){
		if(response.status == 200){
			load_urls();
		}
	});
}

function create_td(that, table, index, dictionary, text){
	console.log("DICTIONARY: ", dictionary);
	let temp_td = document.createElement("td");
	temp_td.innerText = text;
	table.rows[that.row].cells[index].replaceWith(temp_td);
}

function edit_vm(that, stopped_notes_dictionary, name_dictionary, memory_dictionary, boot_dictionary){ // that is the 'this' for the edit button
	if(that.innerHTML == "EDIT"){
		that.innerHTML = "SAVE";
		let memory_options = ['512', '1024', '2048', '4096'];
		let vm_mem = stopped_vm_table.rows[that.row].cells[memoryIndex].innerText;

		let disk_options = ['4G', '8G', '16G', '32G'];
		let vm_disk = stopped_vm_table.rows[that.row].cells[diskIndex].innerText;
		for(var cellindex = nameIndex; cellindex < vncIndex; cellindex++){ //converts td into editable fields with the current values
			input_element = document.createElement("input");
			input_element.value = stopped_vm_table.rows[that.row].cells[cellindex].innerText;
			temp_td = document.createElement("td");
			temp_td.appendChild(input_element);
			stopped_vm_table.rows[that.row].cells[cellindex].replaceWith(temp_td);
		}

		// makes the first element in the list the current memory of the vm
		select_element = document.createElement("select");
		select_element.id = "id";

		option = document.createElement("option");
		option.value = vm_mem;
		option.text = vm_mem;

		select_element.appendChild(option);
		
		// creates a list of memory options without the current vm memory in it
		for(mem in memory_options){
			if(memory_options[mem] != vm_mem){
				option = document.createElement("option");
				option.value = memory_options[mem];
				option.text = memory_options[mem];

				select_element.appendChild(option);
			}
		}
		let temp_td2 = document.createElement("td");
		temp_td2.appendChild(select_element);
		stopped_vm_table.rows[that.row].cells[memoryIndex].replaceWith(temp_td2);

		select_element = document.createElement("select");
		select_element.id = "id";

		option = document.createElement("option");
		option.value = vm_disk;
		option.text = vm_disk;

		select_element.appendChild(option);
		
		// creates a list of memory options without the current vm memory in it
		vm_gb = vm_disk.split('G')[0];
		for(capacity in disk_options){
			if(disk_options[capacity] != vm_disk){
				option_gb = disk_options[capacity].split('G')[0];
				if(parseInt(vm_gb) < parseInt(option_gb)){
					option = document.createElement("option");
					option.value = disk_options[capacity];
					option.text = disk_options[capacity];

					select_element.appendChild(option);
				}
			}
		}
		let temp_td3 = document.createElement("td");
		temp_td3.appendChild(select_element);
		stopped_vm_table.rows[that.row].cells[diskIndex].replaceWith(temp_td3);

		stopped_vm_table.rows[that.row].cells[diskIndex-1].replaceWith(temp_td2);

		input_element = document.createElement("input");
		input_element.value = stopped_vm_table.rows[that.row].cells[notesIndex].innerText;
		temp_td = document.createElement("td");
		temp_td.appendChild(input_element);
		stopped_vm_table.rows[that.row].cells[notesIndex].replaceWith(temp_td);

	}
	else if(that.innerHTML == "SAVE"){
		if(confirm("Do you want to save these settings?")){
			console.log("SELECT: ", stopped_vm_table.rows[that.row].cells[notesIndex].querySelector('input').value);
			let vm_name = stopped_vm_table.rows[that.row].cells[nameIndex].querySelector('input').value;
			let vm_mem = stopped_vm_table.rows[that.row].cells[memoryIndex].querySelector('select').value;
			let vm_boot = stopped_vm_table.rows[that.row].cells[diskIndex].querySelector('select').value;
			let vm_note = stopped_vm_table.rows[that.row].cells[notesIndex].querySelector('input').value;
			let curr_disk = boot_dictionary[that.row].split('G')[0];


			let data = "vmid=" + that.vmid + "&newName=\"" + vm_name + "\"" + 
				"&newMemory=" + vm_mem +
				"&newNote=" + "'" + vm_note + "'" + "&current_size=" + curr_disk;
			console.log("NOTE DICTIONARY: ", stopped_notes_dictionary[that.row]);
			console.log("VM_NAME: ", vm_name)

			//temp_td.innerText = name_dictionary[that.row];
			if(name_dictionary[that.row] == vm_name && memory_dictionary[that.row] == vm_mem && boot_dictionary[that.row] == vm_boot){
				//if the note was the only thing that changed, only request that change
				if(stopped_notes_dictionary[that.row] != vm_note){
					console.log("Change needed");
					//If the note was modified, make the request
					fetch(EDIT_NOTE_URL, {
						method: 'PUT',
						body: data,
						headers: {'Content-type': 'application/x-www-form-urlencoded'},
					}).then(function(response){
						if(response.status == 200){
							that.innerHTML = "EDIT";
							console.log("HOWDY");
							create_td(that, stopped_vm_table, notesIndex, stopped_notes_dictionary);
							temp_td = document.createElement("td");
							temp_td.innerText = vm_note;
							stopped_notes_dictionary[that.row] = vm_note;
							stopped_vm_table.rows[that.row].cells[notesIndex].replaceWith(temp_td);
						}
						else{
							alert("Name is")
						}
					});
				}
				that.innerHTML = "EDIT";
				create_td(that, stopped_vm_table, nameIndex, name_dictionary, name_dictionary[that.row]);
				create_td(that, stopped_vm_table, memoryIndex, memory_dictionary, memory_dictionary[that.row]);
				create_td(that, stopped_vm_table, diskIndex, boot_dictionary, boot_dictionary[that.row]);
				create_td(that, stopped_vm_table, notesIndex, stopped_notes_dictionary, stopped_notes_dictionary[that.row]);
			}
			else{
				fetch(RENAME_VM_URL, {
					method: 'PUT',
					body: data,
					headers: {'Content-type': 'application/x-www-form-urlencoded'},
				}).then(function(response){
					if(response.status == 400){
						alert("Name")
					}
					else if(response.status == 200){
						console.log("HELLO THERE");

						if(boot_dictionary[that.row] != vm_boot){
							console.log("vm_boot: ", vm_boot.split('G')[0]);
							console.log("curr_disk: ", curr_disk);
							data = "vmid=" + that.vmid + "&disk_increment=" + (parseInt(vm_boot.split('G')[0])-curr_disk) + "&current_size=" + curr_disk;
							fetch(DISK_VM_URL, {
								method: 'PUT',
								body: data,
								headers: {'Content-type': 'application/x-www-form-urlencoded'},
							}).then(function(response){
								if(response.status == 400){
									alert("Something went wrong")
								}
								else if(response.status == 200){
									console.log("HELLO");
									load_urls();
								}
							});
						}

						load_urls();
					}

				});
			}
		}
		else{ //revert back to table and 'EDIT' text in button on cancel
			that.innerHTML = "EDIT";
			create_td(that, stopped_vm_table, nameIndex, name_dictionary, name_dictionary[that.row]);
			create_td(that, stopped_vm_table, memoryIndex, memory_dictionary, memory_dictionary[that.row]);
			create_td(that, stopped_vm_table, diskIndex, boot_dictionary, boot_dictionary[that.row]);
			create_td(that, stopped_vm_table, notesIndex, stopped_notes_dictionary, stopped_notes_dictionary[that.row]);
		}
}
}	

function edit_note(that, current_note){ // that is the 'this' for the edit button
	if(that.innerHTML == "EDIT"){
		that.innerHTML = "SAVE";
		input_element = document.createElement("input");
		input_element.value = vm_table.rows[that.row].cells[notesIndex].innerText;
		temp_td = document.createElement("td");
		temp_td.appendChild(input_element);
		vm_table.rows[that.row].cells[notesIndex].replaceWith(temp_td);
	}
	else if(that.innerHTML == "SAVE"){
		if(confirm("Do you want to save these settings?")){
			if(vm_table.rows[that.row].cells[notesIndex].querySelector('input').value != current_note[that.row]){
				//Don't send change request if the data hasn't changed
				data = "vmid=" + that.vmid +
					"&newNote=" + "'" + vm_table.rows[that.row].cells[notesIndex].querySelector('input').value + "'";
				console.log("DATA: ", data)

				fetch(EDIT_NOTE_URL, {
					method: 'PUT',
					body: data,
					headers: {'Content-type': 'application/x-www-form-urlencoded'},
				}).then(function(response){
					if(response.status == 200){
						that.innerHTML = "EDIT";
						current_note[that.row] = vm_table.rows[that.row].cells[notesIndex].querySelector('input').value;
						create_td(that, vm_table, notesIndex, current_note, vm_table.rows[that.row].cells[notesIndex].querySelector('input').value);


					}
					else{
						alert("Name i")
					}
				});
			}
			else{
				that.innerHTML = "EDIT";
				create_td(that, vm_table, notesIndex, current_note, current_note[that.row]);
				create_buttons();
			}
		}
		else{ //revert back to table and 'EDIT' text in button on cancel
			that.innerHTML = "EDIT";
			create_td(that, vm_table, notesIndex, current_note, current_note[that.row]);
			create_buttons();
		}
	}
}	

function create_status_button(tr, vm_table, vm_id, vm_status){
	status_td = document.createElement("td");
	status_button = document.createElement("button");
	status_button.innerHTML = vm_status;
	status_button.id = vm_id;
	status_button.vmid = vm_id;
	if(vm_status == "running"){
		status_button.style.background = "Green";

		status_button.onclick = function(){
			if(confirm("Are you sure you want to stop the vm " + this.id)){
				change_state(this.vmid, STOP_VM_URL);
			};
		}
	}
	if(vm_status == "stopped"){
		status_button.style.background = "Red";

		status_button.onclick = function(){
			if(confirm("Are you sure you want to start the vm " + this.id)){
				change_state(this.vmid, START_VM_URL);
			};
		}
	}
	status_td.appendChild(status_button);
	tr.appendChild(status_td);
	vm_table.appendChild(tr);
}


function clear_table(table){
	for(let i = table.rows.length; i > 1; i--){
		table.deleteRow(i-1);
	}
}

function create_buttons(){
	let notes_dictionary = {};
	let stopped_notes_dictionary = {};
	let name_dictionary = {};
	let memory_dictionary = {};
	let boot_dictionary = [];
	for(let i=1; i < stopped_vm_table.rows.length; i++){ //creates the edit button for stopped vms
		if(stopped_vm_table.rows[i].cells.length > totalLength){ 
			//this will just remove the edit button of each row. 
			//Used to regenerate the dictionaries to keep track of the current data in the columns to allow 
			//the cancel button to fill in the old data
			stopped_vm_table.rows[i].deleteCell(totalLength);
		}
		edit_td = document.createElement("td");
		edit_button = document.createElement("button");
		edit_button.innerHTML = "EDIT";
		edit_button.vmid = stopped_vm_table.rows[i].cells[vmidIndex].innerText;
		edit_button.row = i;
		stopped_notes_dictionary[i] = stopped_vm_table.rows[i].cells[notesIndex].innerText;
		name_dictionary[i] = stopped_vm_table.rows[i].cells[nameIndex].innerText;
		memory_dictionary[i] = stopped_vm_table.rows[i].cells[memoryIndex].innerText;
		boot_dictionary[i] = stopped_vm_table.rows[i].cells[diskIndex].innerText;

		edit_button.onclick = function(){
			edit_vm(this, stopped_notes_dictionary, name_dictionary, memory_dictionary, boot_dictionary);
		}

		edit_td.appendChild(edit_button);
		stopped_vm_table.rows[i].appendChild(edit_td);
	}
	for(let i=1; i < vm_table.rows.length; i++){ //creates the edit button for running vms
		if(vm_table.rows[i].cells.length > totalLength){
			//this will just remove the edit button of each row. 
			//Used to regenerate the dictionaries to keep track of the current data in the columns to allow 
			//the cancel button to fill in the old data
			vm_table.rows[i].deleteCell(totalLength);
		}
		edit_td = document.createElement("td");
		edit_button = document.createElement("button");
		edit_button.innerHTML = "EDIT";
		edit_button.vmid = vm_table.rows[i].cells[vmidIndex].innerText;
		edit_button.row = i;

		notes_dictionary[i] = vm_table.rows[i].cells[notesIndex].innerText;

		edit_button.onclick = function(){
			edit_note(this, notes_dictionary);
		}

		edit_td.appendChild(edit_button);
		vm_table.rows[i].appendChild(edit_td);
	}
}

function create_tr_item(tr, text, curr_id){
	vm_id_tr = document.createElement("td");
	vm_id = document.createTextNode(text);
	vm_id_tr.appendChild(vm_id);
	tr.appendChild(vm_id_tr);
	tr.id = curr_vm.id;
}

function load_urls(){
	const wanted_json = ['id','name','memory','scsi0', 'cores']
	fetch(REQUEST_URL, {
		method: 'GET',
		headers: {},
	}).then(function(response){
		console.log('Response: ', response);
		template_table.innerHTML = ''; //clears template dropdown list to not keep duplicating upon new requests
		clear_table(vm_table); //clears running vm table to not keep duplicating upon new requests
		clear_table(stopped_vm_table);//clears stopped vm table to not keep duplicating upon new requests
		response.json().then(function (data) {
			for(i=0; i<data.length; i++){ //loops through each row of JSON sent from server
				curr_vm = data[i];
				appendedstring = "";

				tr = document.createElement("tr");

				if(curr_vm.template == null){ //the template field is not inserted into the config file if vm is not a template

					for(json_key in curr_vm){
						if(wanted_json.includes(json_key)){
							vm_id_tr = document.createElement("td");
							vm_id = document.createTextNode(curr_vm[json_key]);
							switch(json_key){
								case "memory":
									vm_id = document.createTextNode(curr_vm.name);
									break;
								case "name":
									vm_id = document.createTextNode(curr_vm.memory);
									break;
								case "scsi0":
									vm_id = document.createTextNode(curr_vm[json_key].split(',')[1].split('=')[1]);
									break;
							}

							vm_id_tr.appendChild(vm_id);
							tr.appendChild(vm_id_tr);
							tr.id = curr_vm.id;
						}
					}

					if(curr_vm.args){
						create_tr_item(tr, (parseInt(curr_vm.args.split(':')[1])+5900), curr_vm.id)
					}
					else if(!curr_vm.args){ //if no args are present, create a blank td. Used for the VNC port
						create_tr_item(tr, "", curr_vm.id)
					}

					if(curr_vm.notes){
						create_tr_item(tr, curr_vm.notes, curr_vm.id)
					}
					else if(!curr_vm.notes){ //if no args are present, create a blank td. Used for the notes
						create_tr_item(tr, "", curr_vm.id)
					}

					if(curr_vm.is_active == 1){
						create_status_button(tr, vm_table, curr_vm.id, "running");
					}
					else{
						create_status_button(tr, stopped_vm_table, curr_vm.id, "stopped");
					}
				}
				else{
						let vm_template = document.createElement("option");
						vm_template.vmid = curr_vm.id;
						vm_template.id = curr_vm.id;
						vm_template.text = curr_vm.name;
						template_table.add(vm_template); //add vm name to template drop down selection

				}
			} //end of for(i) loop
			create_buttons();

	}); //end of response.json()
}); //end of .then(function)
}
load_urls();
