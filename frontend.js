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

		data = "id=" + template_vm_id + "&newVmId=" + (parseInt(cloneVm.id) + 1);
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
	fetch(url, {
		method: 'POST',
		body: data,
		headers: {'Content-type': 'application/x-www-form-urlencoded'},
	}).then(function(response){
		response.json().then(function (data) {
			if(data == ''){
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
					if(data[0].includes("update VM")){
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

function create_running_button(tr, vm_table){
	running_td = document.createElement("td");
	running_button = document.createElement("button");
	running_button.innerHTML = 'running';
	running_button.id = temp_vm_name;
	running_button.vmid = temp_list[0];
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

function create_stopped_button(tr, stopped_vm_table){
	stopped_td = document.createElement("td");
	stopped_button = document.createElement("button");
	stopped_button.innerHTML = 'stopped';
	stopped_button.id = temp_vm_name;
	stopped_button.vmid = temp_list[0];
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
		template_table.innerHTML = ''; //clears template dropdown list to not keep duplicating upon new requests
		clear_table(vm_table); //clears running vm table to not keep duplicating upon new requests
		clear_table(stopped_vm_table);//clears stopped vm table to not keep duplicating upon new requests
		response.json().then(function (data) {
			for(i=1; i<data.length; i++){ //loops through each row of JSON sent from server
				appendedstring = "";
				tr = document.createElement("tr");
				splitdata = String(data[i].split("\t")).replace(" ", "");
				temp_list = [];

				for(j=0; j<splitdata.length; j++){ //loops through each character of a row to parse data
					if(splitdata[j] != " "){ //add the character to string if it hasn't hit a delimiter (In this case it is any whitespace)
						appendedstring += splitdata[j];
					}
					else {
						if(appendedstring != "") { //once the delimiter has been hit, make a new td element with the string text added to it, and appended to temp_list for later use. Then clear the string to add the next set of characters
							if(temp_list.length == 0 && i == data.length-2){
								last_vmid = appendedstring;
								console.log("LAST ID: ", last_vmid);
								cloneVm.id = last_vmid;
							}
							td = document.createElement("td");
							tdtext = document.createTextNode(appendedstring);
							td.appendChild(tdtext);
							tr.appendChild(td);
							temp_list.push(appendedstring);
							appendedstring = "";
						}
						else{
							appendedstring = "";
						}
					}
				} // end of for j loop
				if(temp_list[2] != undefined){ //make sure that the vm at that index exists and is valid. Weird behavior exists when cloning a vm in another instance and reloads on a different instance
					temp_vm_name = temp_list[1];
					if(temp_vm_name.slice(0,10) === "Copy-of-VM"){
						if(temp_list[2] == "running"){
							create_running_button(tr, vm_table); //creates a button in the running vm table with the onclick event to turn vm off
						}
						else if(temp_list[2] == "stopped"){
							create_stopped_button(tr, stopped_vm_table);//creates a button in the stopped vm table with the onclick event to turn vm off
						}
					}
					else if(temp_vm_name.toUpperCase().includes("TEMPLATE")){
						let option = document.createElement("option");
						option.vmid = temp_list[0];
						option.text = temp_list[1];
						template_table.add(option); //add vm name to template drop down selection
					}
					else{
						if(temp_list[2] == "running"){
							create_running_button(tr, vm_table);
						}
						else if(temp_list[2] == "stopped"){
							create_stopped_button(tr, stopped_vm_table);
						}
					}
				} //end of if(temp_list[2] != undefined){ 
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
