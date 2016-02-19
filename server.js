var express = require('express');
var app = express();
//var http = require('http');
//var sys = require('util'),
URL = require('url'),
qs = require('querystring')

var mongoClient = require('mongodb').MongoClient;

var MONGODB_URI = "mongodb://admin:123456@ds011278.mongolab.com:11278/heroku_hs6w48x7";

// This responds with "Hello World" on the homepage
app.get('/', function (req, res) {
   console.log("Got a GET request for the homepage");
   res.send('Hello GET');
})

app.get('/login', function(request, response){
	
	var url_params = URL.parse(request.url, true);
	var user_name = url_params.query.name;
	var user_password = url_params.query.password;
	console.log("User name = " + user_name + ", password is " + user_password);
	response.end("yes");
	
})

app.get('/signup', function(request, response){
	
	var url_params = URL.parse(request.url, true);
	var user_name = url_params.query.name;
	var user_password = url_params.query.password;
	console.log("User name = " + user_name + ", password is " + user_password);
	response.end("yes");
	
	mongoClient.connect(MONGODB_URI, function(err, db) {
		if (err) throw err;
		console.log("Connected to Database");
		insertUser(db, function(){db.close();}, user_name, user_password);
	});
	
})

var insertUser = function(db, callback, userName, userPass){
	db.collection('users').insertOne({
		"id" : userName,
		"pass" : userPass
	}), function(err, result){
		if(err){
			console.log("error insert:" + err);
		} else{
			console.log("Inserted a document into the restaurants collection.");
			callback();
		}
	}
}



// This responds a GET request for the /list_user page.
app.get('/database', function (request, response) {
	
	mongoClient.connect(MONGODB_URI, function(err, db){
		
		if(err){
			console.log('Unable to connect to the mongoDB server. Error:', err);
		} else{
			//HURRAY!! We are connected. :)
			console.log('Connection established to', MONGODB_URI);
			
			var url_parts;
			if(request.method == 'GET'){
				url_parts = URL.parse(request.url, true);
				response.writeHead( 200 );
				response.write( JSON.stringify( url_parts.query ) );
				response.end();
				
				
			} else if (request.method == 'POST') {
                var body = '';
                request.on('data', function (data) {
                    body += data;
                });
                request.on('end',function() {
                    var POST =  qs.parse(body);
                    //console.log(POST);
                    response.writeHead( 200 );
                    response.write( JSON.stringify( POST ) );
                    response.end();
                });
			}

			// do some work here with the database.			
								// Get the documents collection
				var cursor = db.collection('users').find( );
				cursor.each(function(err, doc) {
					if(err){
						console.log("error: " + err);
					} else{
						if (doc != null) {
							console.dir(doc);
						} else {
							console.log("no doc");
						}
					}
				});
			

		}
	});
})


var server = app.listen(8081, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

})