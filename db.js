var mysql = require('mysql2');
const config = require("./config.json");

var username = config.dbuser;
var dbport = config.dbport;
var password = config.dbpass;
var ip = config.dbip;
var database = config.database;

//console.log(username, dbport, password, ip, database);

var con = mysql.createConnection({
	host: ip,
	user: username,
	port: dbport,
	password: password,
	database: database
});

con.connect(function(err) {
  if (err) throw err;
  console.log("Connected!");

});
module.exports = con;
