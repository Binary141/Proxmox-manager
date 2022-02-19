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
		for(var cellindex = 1; cellindex < stopped_vm_table.rows[that.row].cells.length-3; cellindex++){ //converts td into editable field with the values preset that can be changed
			if(cellindex != 2){
				input_element = document.createElement("input");
				input_element.value = stopped_vm_table.rows[that.row].cells[cellindex].innerText;
				temp_td = document.createElement("td");
				temp_td.appendChild(input_element);
				stopped_vm_table.rows[that.row].cells[cellindex].replaceWith(temp_td);
			}
		}
	}
	else if(that.innerHTML == "SAVE"){
		if(confirm("Do you want to save these settings?")){
			data = "vmid=" + that.vmid + "&newName=" + stopped_vm_table.rows[that.row].cells[1].querySelector('input').value;
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
			for(var cellindex = 1; cellindex < stopped_vm_table.rows[that.row].cells.length-3; cellindex++){ //changes the input field for the editable fields back into a regular text td
				if(cellindex != 2){
					temp_td = document.createElement("td");
					temp_td.innerText = stopped_vm_table.rows[that.row].cells[cellindex].querySelector('input').value;
					stopped_vm_table.rows[that.row].cells[cellindex].replaceWith(temp_td);
				}
			}
		}
	}
}	

function create_running_button(tr, vm_table, vm_id){
	running_td = document.createElement("td");
	running_button = document.createElement("button");
	running_button.innerHTML = 'running';
	running_button.id = vm_id;
	running_button.vmid = vm_id;
	running_button.style.background = "Green";
	running_button.onclick = function(){
		if(confirm("Are you sure you want to stop the vm " + this.id)){
			change_state(this.vmid, STOP_VM_URL);
		};
	}
	running_td.appendChild(running_button);
	tr.appendChild(running_td);
	vm_table.appendChild(tr);
}

function create_stopped_button(tr, stopped_vm_table, vm_id){
	stopped_td = document.createElement("td");
	stopped_button = document.createElement("button");
	stopped_button.innerHTML = 'stopped';
	stopped_button.id = vm_id;
	stopped_button.vmid = vm_id;
	stopped_button.style.background = "Red";
	stopped_button.onclick = function(){
		if(confirm("Are you sure you want to start the vm " + this.id)){
			change_state(this.vmid, START_VM_URL);
		};
	}
	stopped_td.appendChild(stopped_button);
	tr.appendChild(stopped_td);
	stopped_vm_table.appendChild(tr);
}

function clear_table(table){
	for(let i = table.rows.length; i > 1; i--){
		table.deleteRow(i-1);
	}
}
function load_urls(){
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
				//console.log("data[i] id: ", data[i].id);
				tr = document.createElement("tr");

				if(curr_vm.template == null){ //the template field is not inserted into the config file if vm is not a template
					vm_id_tr = document.createElement("td");
					vm_name_tr = document.createElement("td");
					vm_mem_tr = document.createElement("td");
					vm_status_tr = document.createElement("td");
					vm_disk_size_tr = document.createElement("td");

					vm_id = document.createTextNode(curr_vm.id);
					vm_id_tr.appendChild(vm_id);

					vm_name = document.createTextNode(curr_vm.name);
					vm_name_tr.appendChild(vm_name);

					vm_memory = document.createTextNode(curr_vm.memory);
					vm_mem_tr.appendChild(vm_memory);

					vm_disk_size = document.createTextNode(curr_vm.scsi0.split(',')[1].split('=')[1]);
					vm_disk_size_tr.appendChild(vm_disk_size);

					tr.appendChild(vm_id_tr);
					tr.appendChild(vm_name_tr);
					tr.appendChild(vm_mem_tr);
					tr.appendChild(vm_disk_size_tr);
					tr.id = curr_vm.id;

					if(curr_vm.is_active == 1){
						vm_status = document.createTextNode("Running");
						vm_status_tr.appendChild(vm_status);
						//console.log("TR: ", tr);
						create_running_button(tr, vm_table, curr_vm.id);
					}
					else{
						vm_status = document.createTextNode("Stopped");
						vm_status_tr.appendChild(vm_status);
						//console.log("TR: ", tr);
						create_stopped_button(tr, stopped_vm_table, curr_vm.id);
					}
				}
				else{
					//console.log('VM ', curr_vm.id, 'is a template');
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
