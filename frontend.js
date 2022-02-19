// qm config <VMID> | grep ^args ; this will show the vnc port that is configured for a vm
REQUEST_URL = getURL();
STOP_VM_URL = getStopVmUrl();
START_VM_URL = getStartVmUrl();
CLONE_VM_URL = getCloneVmUrl();
RENAME_VM_URL = getRenameVmUrl();

var vm_table = document.getElementById("started_vms");
var stopped_vm_table = document.getElementById("stopped_vms");
var template_table = document.getElementById("templates");
var cloneVm = document.getElementById("cloneVm");

cloneVm.onclick = function(){
	if(template_table.value != ""){
		let template_vm_id = template_table[template_table.selectedIndex].vmid
		let vmids = [];
		let clone_id;

		for(i = 1; i < vm_table.rows.length; i++){//row in vm_table.rows){
			vmids.push(vm_table.rows[i].cells[0].innerText);
		}
		for(i = 1; i < stopped_vm_table.rows.length; i++){//row in vm_table.rows){
			vmids.push(stopped_vm_table.rows[i].cells[0].innerText);
		}
		for(i=0; i < template_table.length; i++){
			vmids.push(template_table[i].id);
		}
		console.log("IDS: ", vmids);

		for(i = 100; i <= 999; i++){ //finds the lowest number that isn't in the list of vmids
			if(!vmids.includes(String(i))){ //if the number is not in the list, that will be the new id of the cloned vm
				clone_id = i;
				break;
			}
		}

		data = "id=" + template_vm_id + "&newVmId=" + clone_id;
		console.log("DATA: ", data);
		if(confirm("Are you sure you want to clone the vm " + template_vm_id)){

			fetch(CLONE_VM_URL, {
				method: 'POST',
				body: data,
				headers: {'Content-type': 'application/x-www-form-urlencoded'},
			}).then(function(response){
				response.json().then(function (data) {
					if(data){ //server responds with empty string on success
						load_urls(); 
					}
				})
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
		response.json().then(function (data) {
			if(data == '200'){
				load_urls();
			}
		})
	});
}

function edit_vm(that){ // that is the 'this' for the edit button
	if(that.innerHTML == "EDIT"){
		that.innerHTML = "SAVE";
		for(var cellindex = 1; cellindex < 4; cellindex++){ //converts td into editable field with the values preset that can be changed
			input_element = document.createElement("input");
			input_element.value = stopped_vm_table.rows[that.row].cells[cellindex].innerText;
			temp_td = document.createElement("td");
			temp_td.appendChild(input_element);
			stopped_vm_table.rows[that.row].cells[cellindex].replaceWith(temp_td);
		}
	}
	else if(that.innerHTML == "SAVE"){
		if(confirm("Do you want to save these settings?")){
			data = "vmid=" + that.vmid + "&newName=\"" + stopped_vm_table.rows[that.row].cells[1].querySelector('input').value + "\"";
			that.innerHTML = "EDIT";
			fetch(RENAME_VM_URL, {
				method: 'PUT',
				body: data,
				headers: {'Content-type': 'application/x-www-form-urlencoded'},
			}).then(function(response){
				response.json().then(function (data) {
					if(data == '200'){//[0].includes("update VM")){
						load_urls();
					}
				})
			});
		}
		else{ //revert back to table and 'EDIT' text in button on cancel
			that.innerHTML = "EDIT";
			for(var cellindex = 1; cellindex < 4; cellindex++){ //changes the input field for the editable fields back into a regular text td
				temp_td = document.createElement("td");
				temp_td.innerText = stopped_vm_table.rows[that.row].cells[cellindex].querySelector('input').value;
				stopped_vm_table.rows[that.row].cells[cellindex].replaceWith(temp_td);
			}
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
function load_urls(){
	const wanted_json = ['id','name','memory','scsi0']
	fetch(REQUEST_URL, {
		method: 'GET',
		headers: {},
	}).then(function(response){
		console.log('Response: ', response);
		template_table.innerHTML = ''; //clears template dropdown list to not keep duplicating upon new requests
		clear_table(vm_table); //clears running vm table to not keep duplicating upon new requests
		clear_table(stopped_vm_table);//clears stopped vm table to not keep duplicating upon new requests
		response.json().then(function (data) {
			for(i=0; i<data.length - 1; i++){ //loops through each row of JSON sent from server
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
						vm_id_tr = document.createElement("td");
						vm_id = document.createTextNode((parseInt(curr_vm.args.split(':')[1])+5900));
						vm_id_tr.appendChild(vm_id);
						tr.appendChild(vm_id_tr);
						tr.id = curr_vm.id;
					}
					else if(!curr_vm.args){ //if no args are present, create a blank td. Used for the VNC port
						vm_id_tr = document.createElement("td");
						vm_id = document.createTextNode("");
						vm_id_tr.appendChild(vm_id);
						tr.appendChild(vm_id_tr);
						tr.id = curr_vm.id;
						
					}
					if(curr_vm.notes){
						vm_id_tr = document.createElement("td");
						vm_id = document.createTextNode(curr_vm.notes);
						vm_id_tr.appendChild(vm_id);
						tr.appendChild(vm_id_tr);
						tr.id = curr_vm.id;
					}
					else if(!curr_vm.notes){ //if no args are present, create a blank td. Used for the VNC port
						vm_id_tr = document.createElement("td");
						vm_id = document.createTextNode("");
						vm_id_tr.appendChild(vm_id);
						tr.appendChild(vm_id_tr);
						tr.id = curr_vm.id;
						
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

			for(let i=1; i < stopped_vm_table.rows.length; i++){ //creates the edit button for stopped vms
				edit_td = document.createElement("td");
				edit_button = document.createElement("button");
				edit_button.innerHTML = "EDIT";
				edit_button.vmid = stopped_vm_table.rows[i].cells[0].innerText;
				edit_button.row = i;

				edit_button.onclick = function(){
					edit_vm(this);
				}

				edit_td.appendChild(edit_button);
				stopped_vm_table.rows[i].appendChild(edit_td);
			}
	}); //end of response.json()
}); //end of .then(function)
}
load_urls();
