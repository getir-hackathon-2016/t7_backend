var express = require('express');
var app = express();
var assert = require('assert');
var async = require("async");
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
		checkUser(db, response, user_name, user_password);
	});

})

var checkUser = function(db, response, userName, userPass) {

	var login = db.collection('users').findOne( {"id": userName, "pass": userPass});
	if(login){
		var message = "Welcome " + userName;
		var json = {"message": message};
		response.send(JSON.stringify(json));
	} else {
		var json = {"message":"Please register"};
		response.send(JSON.stringify(json));
	}

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

app.get('/order', function(request, response){
	var url_params = URL.parse(request.url, true);
	var store_id = url_params.query.store_id;
	var product_id = url_params.query.product_id;
	var order_count = url_params.query.order_count;

	mongoClient.connect(MONGODB_URI, function(err, db) {
		if (err) throw err;
		console.log("Connected to Database");
		checkStock(db, response, store_id, product_id, order_count);
	});
})

var checkStock = function(db, response, store_id, product_id, order_count){
	var stockExist = db.collection('stocks').findOne( {"store_id": store_id, "product_id": product_id, "stocks": {$gt: order_count}} );
	if(stockExist){
		var message = "Sana " + order_count + " tane " + product_id + " göndereceğim";
		var json = { "message" : message};
		response.send(JSON.stringify(json));
	} else{
		var json = {"message" : "Yeterli miktarda ürün yok"};
		response.send(JSON.stringify(json));
	}
}

app.get('/location', function(request, response){
	var url_params = URL.parse(request.url , true);
	var x = url_params.query.x;
	var y = url_params.query.y;
	var p_id = new Array();
	var storeID;
	var results = new Array();
	var id = new Array();
	mongoClient.connect(MONGODB_URI, function(err, db) {
		if (err) throw err;
		console.log("Connected to Database");
		var cursor = db.collection('stores').find();
		cursor.each(function(err , doc){
			if(err){
				console.log('error: ' + err);
			}else{
				if(doc != null){
					if(getDistanceFromLatLonInKm(doc.loc.x , doc.loc.y , x , y) < 10){
						storeID = doc._id ;
						var cursor2 = db.collection('stocks').find({"store_id" : storeID });
						cursor2.each(function(err , doc){
							if(err)
								console.log("error: " + err);
							else{
								if(doc != null){
									if(doc.stocks > 0){
										id.push(doc.product_id);

									}

								}else{

									async.each(id , function(id , callback){
											var obj = new Object();
											var c = db.collection('products').find({'_id' : id});
											c.each( function(err , x){
												if(x!=null){
													obj.name = x.name ;
													obj.price = x.price ;
													obj.weight = x.weight ;
													obj.imgUrl = x.imgUrl;
													obj._id = x._id;
													console.log(x.name)
												}else{
													results.push(obj);
													callback();
												}
											})
										}
										, function(){
											response.end(JSON.stringify(results));
										})
								}
							}
						})
					}
				}else{
					console.log("doc is null");
				}
			}
		});

	});

});



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

app.get('/json', function(request, response){
	console.log("Request handler random was called.");
	response.writeHead(200, {"Content-Type": "application/json"});
	var jsonArray = [
		{
			"_id": 1,
			"name": "Bulbasaur",
			"price": "1000",
			"imgUrl": "http://assets.pokemon.com/assets/cms2/img/pokedex/full/001.png",
			"weight": "15.2"
		},
		{
			"_id": 2,
			"name": "Charizard",
			"price": "1500",
			"imgUrl": "http://assets.pokemon.com/assets/cms2/img/pokedex/full/006.png",
			"weight": "199.5"
		},
		{
			"_id": 3,
			"name": "Pikacu",
			"price": "2000",
			"imgUrl": "http://assets.pokemon.com/assets/cms2/img/pokedex/full/025.png",
			"weight": "13.2"
		},
		{
			"_id": 4,
			"name": "Squirtle",
			"price": "2375",
			"imgUrl": "http://assets.pokemon.com/assets/cms2/img/pokedex/full/007.png",
			"weight": "19.8"
		},
		{
			"_id": 5,
			"name": "Wigglytuff",
			"price": "2500",
			"imgUrl": "http://assets.pokemon.com/assets/cms2/img/pokedex/full/040.png",
			"weight": "26.5"
		},
		{
			"_id": 6,
			"name": "Golduck",
			"price": "3000",
			"imgUrl": "http://assets.pokemon.com/assets/cms2/img/pokedex/full/055.png",
			"weight": "168.9"
		},
		{
			"_id": 7,
			"name": "Mewtwo",
			"price": "8375",
			"imgUrl": "http://assets.pokemon.com/assets/cms2/img/pokedex/full/150.png",
			"weight": "269.0"
		},
		{
			"_id": 8,
			"name": "Hitmonlee",
			"price": "4175",
			"imgUrl": "http://assets.pokemon.com/assets/cms2/img/pokedex/full/106.png",
			"weight": "109.8"
		},
		{
			"_id": 9,
			"name": "Pidgeot",
			"price": "1845",
			"imgUrl": "http://assets.pokemon.com/assets/cms2/img/pokedex/full/018.png",
			"weight": "87.1"
		},
		{
			"_id": 10,
			"name": "Scyther",
			"price": "2999.99",
			"imgUrl": "http://assets.pokemon.com/assets/cms2/img/pokedex/full/123.png",
			"weight": "123.5"
		}
	];

	response.end(JSON.stringify(jsonArray));
})

var server = app.listen(process.env.PORT || 8081, function () {

  var host = server.address().address
  var port = server.address().port

  console.log("Example app listening at http://%s:%s", host, port)

})