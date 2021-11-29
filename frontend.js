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
		//console.log("the vm is: ", template_vm_id);

		data = "id=" + template_vm_id;
		if(confirm("Are you sure you want to clone the vm " + template_vm_id)){

			fetch(CLONE_VM_URL, {
				method: 'POST',
				body: data,
				headers: {
					'Content-type': 'application/x-www-form-urlencoded'
				},

			}).then(function(response){
				response.json().then(function (data) {
					//console.log("data is: ", data);
					if(data == ''){
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
		headers: {
			'Content-type': 'application/x-www-form-urlencoded'
		},
	}).then(function(response){
		response.json().then(function (data) {
			//console.log("data is: ", data);
			if(data == ''){
				load_urls();
			}
		})
	});
}

function edit_vm(that){ // that is the 'this' for the edit button
	if(that.innerHTML == "EDIT"){
		that.innerHTML = "SAVE";

		//console.log("vm_table length: ", stopped_vm_table.rows[that.row].cells.length);

		for(var cellindex = 1; cellindex < stopped_vm_table.rows[that.row].cells.length-3; cellindex++){
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
			that.innerHTML = "EDIT";
		}
		else{
			for(var cellindex = 1; cellindex < stopped_vm_table.rows[that.row].cells.length-3; cellindex++){
				if(cellindex != 2){
					temp_td = document.createElement("td");
					temp_td.innerText = stopped_vm_table.rows[that.row].cells[cellindex].querySelector('input').value;
					stopped_vm_table.rows[that.row].cells[cellindex].replaceWith(temp_td);
				}
			}
			that.innerHTML = "EDIT";
		}
	}
}	

function load_urls(){
	fetch(REQUEST_URL, {
		method: 'GET',
		headers: {},
	}).then(function(response){
		for(let i = vm_table.rows.length; i > 1; i--){ //clears the table after each fetch request to keep it from increasing in size
			vm_table.deleteRow(i-1);
		}
		response.json().then(function (data) {
			for(i=0; i<data.length; i++){
				appendedstring = "";
				tr = document.createElement("tr");
				splitdata = String(data[i].split("\t")).replace(" ", "");
				temp_list = [];

				for(j=0; j<splitdata.length; j++){
					if(splitdata[j] != " "){
						appendedstring += splitdata[j];
					}
					else {
						if(appendedstring != "") {
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
				} // end of for loop

				if(temp_list[2] != undefined && i != 0){
					temp_vm_name = temp_list[1];
					if(temp_vm_name.toUpperCase().includes("TEMPLATE")){
						//console.log("Template");
						let option = document.createElement("option");
						option.vmid = temp_list[0];
						option.text = temp_list[1];
						template_table.add(option);
					}
					else{
						if(temp_list[2] == "running"){
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
						else if(temp_list[2] == "stopped"){
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

					}

				} //end of if(temp_list[2] != undefined){ 
			} //end of for(i) loop

			for(let i=1; i < stopped_vm_table.rows.length; i++){
				edit_td = document.createElement("td");
				edit_button = document.createElement("button");
				edit_button.innerHTML = "EDIT";
				edit_button.vmid = stopped_vm_table.rows[i].cells[0].innerText;
				edit_button.row = i;

				edit_button.onclick = function(){
					//console.log("hello there");
					edit_vm(this);
				}

				edit_td.appendChild(edit_button);
				stopped_vm_table.rows[i].appendChild(edit_td);
			}
	}); //end of response.json()
}); //end of .then(function)
}
load_urls();
