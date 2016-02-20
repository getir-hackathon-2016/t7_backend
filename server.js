var express = require('express');
var app = express();
var assert = require('assert');
//var http = require('http');
URL = require('url'),
qs = require('querystring')

var mongoClient = require('mongodb').MongoClient;

var MONGODB_URI = "mongodb://admin:123456@ds011278.mongolab.com:11278/heroku_hs6w48x7";

var storeID;

// This responds with "Hello World" on the homepage
app.get('/', function (request, response) {
   console.log("Got a GET request for the homepage");
   response.send('Hello Getir-Hackathon');
})

app.get('/login', function(request, response){
	
	var url_params = URL.parse(request.url, true);
	var user_name = url_params.query.name;
	var user_password = url_params.query.password;
	console.log("User name = " + user_name + ", password is " + user_password);
	
	mongoClient.connect(MONGODB_URI, function(err, db) {
		if (err) throw err;
		console.log("Connected to Database");
		checkUser(db, function(message) {
			response.end(message);
			db.close();
		}, user_name, user_password);
	});
	
})

var checkUser = function(db, callback, userName, userPass) {
	
	var cursor = db.collection('users').find( );
	cursor.each(function(err, doc) {
		assert.equal(err, null);
		if (doc != null) {
			if(doc.id == userName && doc.pass == userPass){
				callback("Login successfully: " + userName);
			}
		} else {
			callback();
		}
	});
};

app.get('/signup', function(request, response){
	
	var url_params = URL.parse(request.url, true);
	var user_name = url_params.query.name;
	var user_password = url_params.query.password;
	console.log("User name = " + user_name + ", password is " + user_password);
	
	mongoClient.connect(MONGODB_URI, function(err, db) {
		if (err) throw err;
		console.log("Connected to Database");
		insertUser(db, function(message){
			response.end(message);
			db.close();
		}, user_name, user_password);
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
			callback("Inserted a document into the restaurants collection" + userName);
		}
	}
}

app.get('/location', function(request, response){
	var url_params = URL.parse(request.url , true);
	var x = url_params.query.x;
	var y = url_params.query.y;
	var p_id = new Array();
	mongoClient.connect(MONGODB_URI, function(err, db) {
		if (err) throw err;
		console.log("Connected to Database");
	;
		findProducts(db , function(message){
			
		db.close();} , x, y)
			
});
});
function findProducts(db , callback , x , y){
			//Find Closest Store Id
				var result = new Array()
		var cursor = db.collection('stores').find();
		cursor.each(function(err, doc) {
			if(err){
				console.log("error: " + err);
			} else{
			
				if (doc != null) {
					if(getDistanceFromLatLonInKm(doc.loc.x , doc.loc.y , x , y) <= 10){
						storeID = doc._id;		
						console.log("Store id: " + storeID);
					
					
						
						var cursor2 = db.collection('stocks').find( { "store_id": storeID } );
						cursor2.each(function(err, doc){
							if(err) throw err;
							if(doc != null){
								if(doc.stocks > 0){
									result.push(doc.product_id);
									console.log("products : " + doc.product_id);
								/*	var cursor3 = db.collection('products').find( { "_id": doc.product_id } );
									cursor3.each(function(err, doc){	
									if(doc!= null){
									console.log("products : " + doc.name);
									var jsonArg = new Object();
									jsonArg.name = doc.name ;
									result.push(jsonArg);
									console.log("vdsbndfn");
									}
									else
										console.log("no doc");
								);*/
									callback(result);
								}
								
							} else{
								console.log("no doc for this storeID:" + storeID);
							}
							
							
						});
						
						
					}
					
				} else {
					console.log("no doc for stores");
				}
			}
			
		});
}

function getDistanceFromLatLonInKm(lat1,lon1,lat2,lon2) {
	var R = 6371; // Radius of the earth in km
	var dLat = deg2rad(lat2-lat1);  // deg2rad below
	var dLon = deg2rad(lon2-lon1); 
	var a = 
	Math.sin(dLat/2) * Math.sin(dLat/2) +
	Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
	Math.sin(dLon/2) * Math.sin(dLon/2)
	; 
	var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
	var d = R * c; // Distance in km
	return d;
}

function deg2rad(deg) {
	return deg * (Math.PI/180)
}



function findProduct(db, id){
		
	var cursor = db.collection('products').find( { "_id": id } );
	cursor.each(function(err, doc){
		if(doc != null){
			return("{ name : " + doc._id +"  price: " + doc.price +" imgUrl: " + doc.imgUrl + "weight: " + doc.weight+ "}");
		}
	});
}


var server = app.listen(process.env.PORT || 8080, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

})