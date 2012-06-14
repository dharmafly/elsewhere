var redis = require("redis"),
    client = redis.createClient(),
    expireTime = 60; // set expiry time

client.on("error", function (err) {
	console.log("Error " + err);
});

function set(username, links) {	
	client.set(username, links + "", redis.print); // set username, value is link lists
	client.expire(username, expireTime); // clears after an hour
	client.quit();
}

function get(username, callback) {
    client.get(username, callback);
}

function getAll(username) {
	var data = client.get(username);
	return data;
}

set("theonepointzero", ["hash key", "hashtest 2", "some other value"]);




