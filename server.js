var express = require('express');
var app = express();
var server = require('http').Server(app);
var client = require('socket.io')(server).sockets; 
var path = require('path');
var ip = require('ip');
var mongo = require('mongodb').MongoClient;
var port = process.env.port || 8080;


//Connect ot mongo
mongo.connect('mongodb://localhost:27017/chatdb',function(err,db){
    if(err){
        throw err;
    } 
    const my = db.db('chatdb');
    console.log('mongo connected');
    //connect to socket.io
    client.on('connection',function(socket){
        console.log('new connection made');
        let chat = my.collection('chats');

        // function to send status
        sendStatus = function(s){
            socket.emit('status',s);
        }
        // get chats from collection
        chat.find().limit(100).sort({_id:1}).toArray(function(err,res){
            if(err){
                throw err;
            }
            // emit the message
            socket.emit('output',res);
        })

        //handle input event
        socket.on('input',function(data){
            let name = data.name;
            let message = data.message;
             // check for name and message
            if(name=='' || message == ''){
                 //Send error status
                 sendStatus('please enter a name and message');
            } else{
                //insert message
                chat.insertOne({name:name, message:message},function(){
                    client.emit('output',[data]);
                    //send status objects
                    sendStatus({
                        message: 'message sent',
                        clear : true
                    })
                });
            }
        })
        // Handle Clear chat
        socket.on('clear',function(){
            //remove all chats from collection
            chat.deleteMany({},function(){
                socket.emit('cleared');
            })
        })
        socket.on('disconnect',function(){
        console.log('user disconnected');   
        })
    })
    
})

var users = [];

app.get('/',function(req,res){
    res.sendFile(__dirname + '/index.html');
})

server.listen(port,function(){
    console.log('server started at port http://'+ ip.address()+ ':' + port );
})