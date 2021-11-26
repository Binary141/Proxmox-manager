// qm config <VMID> | grep ^args ; this will show the vnc port that is configured for a vm
REQUEST_URL = getURL();
STOP_VM_URL = getStopVmUrl();
START_VM_URL = getStartVmUrl();
CLONE_VM_URL = getCloneVmUrl();


var vm_table = document.getElementById("vms");
var template_table = document.getElementById("templates");
var cloneVm = document.getElementById("cloneVm");

cloneVm.onclick = function(){
	if(template_table.value != ""){
		let template_vm_id = template_table[template_table.selectedIndex].vmid
		console.log("the vm is: ", template_vm_id);

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
					console.log("data is: ", data);
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
			console.log("data is: ", data);
			if(data == ''){
				load_urls();
			}
		})
	});
}


function load_urls(){
	fetch(REQUEST_URL, {
		method: 'GET',
		headers: {
		},
	}).then(function(response){
		for(var i = vm_table.rows.length; i > 1; i--){
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
				}
				
				if(temp_list[2] != undefined){
					temp_vm_name = temp_list[1];

					if(temp_vm_name.toUpperCase().includes("TEMPLATE")){
						console.log("Template");
						let option = document.createElement("option");
						option.vmid = temp_list[0];
						option.text = temp_list[1];
						template_table.add(option);

					}
					else{
						if(temp_list[2] == "running"){

							running_button = document.createElement("button");
							running_button.innerHTML = 'running';
							running_button.id = temp_vm_name;
							running_button.vmid = temp_list[0];
							running_button.style.background = "Green";

							running_button.onclick = function(){
								if(confirm("Are you sure you want to stop the vm " + this.id)){
									console.log("VM ", this.vmid ,"is running");
									change_state(this.vmid, STOP_VM_URL);
								};
							}
							tr.appendChild(running_button);
							vm_table.appendChild(tr);
						}
						else if(temp_list[2] == "stopped"){

							stopped_button = document.createElement("button");
							stopped_button.innerHTML = 'stopped';
							stopped_button.id = temp_vm_name;
							stopped_button.vmid = temp_list[0];
							stopped_button.style.background = "Red";

							stopped_button.onclick = function(){
								if(confirm("Are you sure you want to start the vm " + this.id)){
									console.log("VM ", this.vmid ,"is stopped");
									change_state(this.vmid, START_VM_URL);
								};
							}

							tr.appendChild(stopped_button);
							vm_table.appendChild(tr);
						}
						else{
							console.log("some error has occured with the vm ", temp_list[1]);
						}
					}
				}
			}
		});
	});
}
load_urls();
