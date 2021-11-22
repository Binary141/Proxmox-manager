REQUEST_URL = getURL();
console.log("The url is: ", REQUEST_URL);

console.log("made it");
fetch(REQUEST_URL, {
	method: 'GET',
	headers: {
	},
}).then(function(response){
	console.log("response portion");
	response.json().then(function (data) {
		for(i=0; i<data.length; i++){
			//console.log("data: ", data[i]);
			appendedstring = "";
			tr = document.createElement("tr");
			table = document.getElementById("tablediv");
			splitdata = data[i].split("\t");
			temp_list = [];

			str = String(splitdata);

			newstr = str.replace(" ", "");
			newstr = str.replace("	", "");

			for(j=2; j<newstr.length; j++){
				if(newstr[j] != " "){
					appendedstring += newstr[j];
					//console.log("YES", appendedstring);
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
			console.log("The list is: ", temp_list);
			if(i != 0){
				temp_vm_name = temp_list[1];
				console.log("The vm status is: ", temp_list[2]);

				if(temp_list[2] == "running"){
					console.log("The vm ", temp_vm_name, "is running");

					running_button = document.createElement("button");
					running_button.innerHTML = 'running';
					running_button.id = temp_vm_name;

					running_button.onclick = function(){
						console.log("VM ", this.id ,"is running");
					}

					tr.appendChild(running_button);
				}
				else if(temp_list[2] == "stopped"){
					console.log("The vm ", temp_vm_name, "is stopped");

					stopped_button = document.createElement("button");
					stopped_button.innerHTML = 'stopped';
					stopped_button.id = temp_vm_name;
					stopped_button.vmid = temp_vm_name;

					stopped_button.onclick = function(){
						console.log("VM ", this.vmid ,"is stopped");
					}

					tr.appendChild(stopped_button);
				}
				else{
					console.log("some error has occured with the vm ", temp_list[1]);
				}
			}
			table.appendChild(tr);
		}
	});
});
console.log("response");
