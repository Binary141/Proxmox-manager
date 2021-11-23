REQUEST_URL = getURL();


vm_table = document.getElementById("vms");
template_table = document.getElementById("templates");

console.log(template_table);;

fetch(REQUEST_URL, {
	method: 'GET',
	headers: {
	},
}).then(function(response){
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
					template_table.appendChild(tr);
				}
				else{
					if(temp_list[2] == "running"){

						running_button = document.createElement("button");
						running_button.innerHTML = 'running';
						running_button.id = temp_vm_name;
						running_button.vmid = temp_list[0];
						running_button.style.background = "Green";

						running_button.onclick = function(){
							console.log("VM ", this.vmid ,"is running");
							alert("Are you sure you want to stop the vm " + this.id);
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

							console.log("VM ", this.vmid ,"is stopped");
							alert("Are you sure you want to start the vm " + this.id);
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
