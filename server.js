var express = require('express');
var app = express();
var assert = require('assert');
var socket = require('socket.io');
var async = require("async");
ObjectID = require('mongodb').ObjectID;
URL = require('url'),
    qs = require('querystring')

var mongoClient = require('mongodb').MongoClient;

var MONGODB_URI = "mongodb://admin:123456@ds011278.mongolab.com:11278/heroku_hs6w48x7";

var DB;
var connection = mongoClient.connect(MONGODB_URI, function (err, db) {
    DB = db
});

var orders = [];

// This responds with "Hello World" on the homepage
app.get('/', function (request, response) {
    console.log("Got a GET request for the homepage");
    response.sendFile(__dirname + "/index.html");
})

app.get('/login', function (request, response) {

    var url_params = URL.parse(request.url, true);
    var user_name = url_params.query.name;
    var user_password = url_params.query.password;
    console.log("User name = " + user_name + ", password is " + user_password);

    checkUser(response, user_name, user_password);

})

var checkUser = function (response, userName, userPass) {

    DB.collection('users').findOne(
        {
            "id": userName,
            "pass": userPass
        }, function (err, doc) {
            assert.equal(err, null);
            if (doc != null) {
                console.log(doc.token);
                var json = {"token": doc.token, "success": true};
                response.send(JSON.stringify(json));
            } else {
                var json = {"message": "Hatalı giriş", "success": false};
                response.send(JSON.stringify(json));
            }
        });

};

app.get('/signup', function (request, response) {

    var url_params = URL.parse(request.url, true);
    var user_name = url_params.query.name;
    var user_password = url_params.query.password;
    var token = require('crypto').createHash('md5').update("getir" + user_name + "md" + user_password + "hackathon").digest("hex");
    console.log("User name = " + user_name + ", password is " + user_password + " token: " + token);

    insertUser(response, user_name, user_password, token);

})

var insertUser = function (response, userName, userPass, token) {
    DB.collection('users').insertOne({
        "id": userName,
        "pass": userPass,
        "token": token
    }, function (err, doc) {
        console.log(err, doc);
        assert.equal(err, null);
        if (doc != null) {
            var json = {"token": token, "success": true};
            response.send(JSON.stringify(json));
        }
    });
}

app.get('/location', function (request, response) {
    var url_params = URL.parse(request.url, true);
    var x = url_params.query.x;
    var y = url_params.query.y;
    var p_id = new Array();
    var storeID;
    var results = new Array();
    var id = new Array();
    var cursor = DB.collection('stores').find();
    cursor.each(function (err, doc) {
        var flag = false;
        if (err) {
            console.log('error: ' + err);
        } else {
            if (doc != null) {
                if (!false && getDistanceFromLatLonInKm(doc.loc.x, doc.loc.y, x, y) < 2) {
                    var xx = doc.loc.x;
                    var yy = doc.loc.y;
                    flag = true;
                    storeID = doc._id;
                    var cursor2 = DB.collection('stocks').find({"store_id": storeID});
                    cursor2.each(function (err, doc) {
                        if (err)
                            console.log("error: " + err);
                        else {
                            if (doc != null) {
                                if (doc.stocks > 0) {
                                    id.push(doc.product_id);

                                }

                            } else {

                                async.each(id, function (id, callback) {
                                        var obj = new Object();
                                        var c = DB.collection('products').find({'_id': id});
                                        c.each(function (err, x) {
                                            if (x != null) {
                                                obj.name = x.name;
                                                obj.price = x.price;
                                                obj.weight = x.weight;
                                                obj.imgUrl = x.imgUrl;
                                                obj._id = x._id;
                                                console.log(x.name)
                                            } else {
                                                results.push(obj);
                                                callback();
                                            }
                                        })
                                    }
                                    , function () {
                                        var send = {"products": results, "store_id": storeID, "lat": xx, "lng": yy};
                                        response.end(JSON.stringify(send));
                                    })
                            }
                        }
                    })

                }
            } else {
                console.log("doc is null");
            }
        }

    });
});
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    var R = 6371; // Radius of the earth in km
    var dLat = deg2rad(lat2 - lat1);  // deg2rad below
    var dLon = deg2rad(lon2 - lon1);
    var a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
            Math.sin(dLon / 2) * Math.sin(dLon / 2)
        ;
    var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    var d = R * c; // Distance in km
    return d;
}
function deg2rad(deg) {
    return deg * (Math.PI / 180)
}

app.get('/pokemon', function (request, response) {
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

var server = app.listen(process.env.PORT || 8082, function () {

    var host = server.address().address
    var port = server.address().port

    console.log("Example app listening at http://%s:%s", host, port)

})

var io = socket.listen(server);

var checkStock = function (info, callback) {
    DB.collection('stocks').findOne({
        "store_id": parseInt(info.store_id),
        "product_id": parseInt(info.product_id),
        "stocks": {$gt: parseInt(info.order_count)}
    }, function (err, doc) {
        assert.equal(err, null);
        if (doc != null) {
            var json = {
                "success": "true",
                "store_id": parseInt(info.store_id),
                "product_id": parseInt(info.product_id),
                "order_count": parseInt(info.order_count)
            };
            console.log("true: " + JSON.stringify(json));
            callback(json);
        } else {
            var json = {
                "success": "false",
                "store_id": parseInt(info.store_id),
                "product_id": parseInt(info.product_id),
                "order_count": parseInt(info.order_count)
            };
            console.log("false: " + JSON.stringify(json));
            callback(JSON.stringify(json));
        }
    });
}

var updateStock = function (info, operator, callback) {
    if (operator === '-') {
        var st;
        DB.collection('stocks').findOne(
            {
                "store_id": info.store_id,
                "product_id": info.product_id
            }, function (err, doc) {
                assert.equal(err, null);
                st = doc.stocks;
                console.log("st: " + st);
                DB.collection('stocks').updateOne({
                    "store_id": info.store_id,
                    "product_id": info.product_id
                }, {
                    $set: {
                        "stocks": st - info.order_count
                    }
                }, function (err, doc) {
                    assert.equal(err, null);
                    var json = {
                        "success": true,
                        "store_id": info.store_id,
                        "product_id": info.product_id,
                        "order_count": info.order_count
                    };
                    callback(JSON.stringify(json));
                });

            });


    } else if (operator === '+') {
        var st;
        DB.collection('stocks').findOne(
            {
                "store_id": info.store_id,
                "product_id": info.product_id
            }, function (err, doc) {
                assert.equal(err, null);
                st = doc.stocks;
                console.log("st: " + st);
                DB.collection('stocks').updateOne({
                    "store_id": info.store_id,
                    "product_id": info.product_id
                }, {
                    $set: {
                        "stocks": st + info.order_count
                    }
                }, function (err, doc) {
                    assert.equal(err, null);
                    var json = {
                        "success": true,
                        "store_id": info.store_id,
                        "product_id": info.product_id,
                        "order_count": info.order_count
                    };
                    callback(JSON.stringify(json));
                });

            });
    }
}

var handleClient = function (socket) {
    console.log("client connected: " + socket.id);

    //send a message to the client.
    socket.emit('message', 'You are connected!');

    // When the server receives a “order” type signal from the client
    socket.on('order', function (message) {

        socket.emit('status', 'type of' + typeof message.store_id);
        /*message.store_id = parseInt(message.store_id);
        message.product_id = parseInt(message.product_id);
        message.order_count = parseInt(message.order_count);*/
        var date = new Date();
        var milliseconds = date.getTime();
        message.time = milliseconds;

        var alreadyExist = false;
        var len = orders.length;
        for (var i = 0; i < len; i++) {
            if (orders[i].token == message.token && orders[i].product_id == message.product_id && orders[i].store_id == message.store_id) {
                alreadyExist = true;
                if (orders[i].order_count < message.order_count) {
                    var diffObj = {
                        "store_id": message.store_id,
                        "product_id": message.product_id,
                        "order_count": message.order_count - orders[i].order_count,
                        "success": ""
                    };
                    checkStock(diffObj, function (msg) {
                        flag = JSON.parse(msg);
                        if (flag.success) {
                            orders[i] = message;
                            updateStock(diffObj, function () {
                                console.log("already flag: " + flag.success);
                            });
                        }
                        diffObj.order_count = message.order_count;
                        diffObj.success = flag.success;
                        socket.emit('status', diffObj);
                    })
                } else { //if updated order less products
                    var diffObj = {
                        "store_id": orders[i].store_id,
                        "product_id": orders[i].product_id,
                        "order_count": orders[i].order_count - message.order_count,
                        "success": ""
                    }

                    updateStock(diffObj, function () {
                        console.log("already less flag: " + flag.success);
                    });
                    diffObj.order_count = message.order_count;
                    diffObj.success = flag.success;
                    socket.emit('status', diffObj);
                }
            }
        }

        if (!alreadyExist) {

            socket.emit('message', 'kontrol ediliyor');
            checkStock(message, function (msg) {
                console.log("flag : " + msg.success);

                if (msg.success) {
                    orders.push(message);
                    updateStock(message, '-', function () {
                        console.log(msg.success);
                    });
                }
                socket.emit('status', msg);
            })
        }

        socket.on('okey', function () {
            var date2 = new Date();
            var milliseconds2 = date2.getTime();

            var diff = milliseconds2 - message.time;
            diff /= 60000;

            var objf2 = {
                "store_id": message.store_id,
                "product_id": message.product_id,
                "order_count": message.order_count,
                "success": ""
            };

            if (diff > 1) {
                updateStock(message, '+', function () {
                    objf2.success = false;
                    socket.emit('status', {"message": "your session down - too late", "info": objf2});
                });
            } else {
                objf2.success = true;
                socket.emit('status', {"message": "siparişiniz onaylandı", "info": objf2});
            }
        })

    });

};

io.sockets.on('connection', handleClient);