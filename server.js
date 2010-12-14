//setup Dependencies
require(__dirname + "/lib/setup").ext( __dirname + "/lib").ext( __dirname + "/lib/express/support");
var connect = require('connect')
    , express = require('express')
    , sys = require('sys')
    , io = require('Socket.IO-node')
    , port = 8081;

//Setup Express
var server = express.createServer();
server.configure(function(){
    server.set('views', __dirname + '/views');
    server.use(connect.bodyDecoder());
    server.use(connect.staticProvider(__dirname + '/static'));
    server.use(server.router);
});

//setup the errors
server.error(function(err, req, res, next){
    if (err instanceof NotFound) {
        res.render('404.ejs', { locals: { 
                  header: ''
                 ,footer: ''
                 ,title : '404 - Not Found'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX' 
                },status: 404 });
    } else {
        res.render('500.ejs', { locals: { 
                  header: ''
                 ,footer: ''
                 ,title : 'The Server Encountered an Error'
                 ,description: ''
                 ,author: ''
                 ,analyticssiteid: 'XXXXXXX'
                 ,error: err 
                },status: 500 });
    }
});
server.listen( port);

//Setup Socket.IO
var io = io.listen(server);
io.on('connection', function(client){
	console.log('Client Connected');
	client.on('message', function(message){
		client.broadcast(message);
		client.send(message);
	});
	client.on('disconnect', function(){
		console.log('Client Disconnected.');
	});
});


///////////////////////////////////////////
//              Routes                   //
///////////////////////////////////////////

/////// ADD ALL YOUR ROUTES HERE  /////////

//homepage
server.get('/', function(req,res){
  res.render('index.ejs', {
    locals : { 
              header: ''
             ,footer: ''
             ,title : 'HTTP Request Inspector'
             ,description: 'A website for inspecting HTTP GETS and POSTS'
             ,author: 'Rob Righter'
             ,analyticssiteid: 'XXXXXXX' 
            }
  });
});

//channels
var datastore = {};

server.get("/:channel/console", function (req, res) {
  //render out the console template and nothing else. The Channel is created and handled on the web socket event
  res.render('console.ejs', {
    locals : { 
      header: '',
      footer: '',
      title : (req.params.channel +' Console'),
      description: '',
      author: 'Rob Righter',
      channelname: req.params.channel,
      analyticssiteid: 'XXXXXXX' 
    }
  });
  
});

server.get("/:channel", function (req, res, match) {
  //render reply with whatever they asked us to.
  sendResponseText(req.params.channel,res);
});

function makeChannelIfNotExist(thechannelname, client){
  var toreturn;
  if(datastore.hasOwnProperty(thechannelname)){
    //the channel already exists
    datastore[thechannelname].clients.push(client);
  }
  else{
    //the channel does not exist
    datastore[thechannelname] = {
      clients : [client],
      responseText : ''
    };
  }
  return datastore[thechannelname];
}

function updateResponseText(thechannelname, responsetext){
  if(datastore.hasOwnProperty(thechannelname)){
    //the channel exists
    datastore[thechannelname].responseText = responsetext;
  }
}

function sendResponseText(thechannelname,res){
  if(datastore.hasOwnProperty(thechannelname)){
    //the channel exists
    res.send(datastore[thechannelname].responseText);
  }
  else{
    //the channel does not exist so just send out an error
    res.send('{"error" : "Sorry, this channel does not exist"}');
  }
}


//A Route for Creating a 500 Error (Useful to keep around)
server.get('/500', function(req, res){
    throw new Error('This is a 500 Error');
});

//The 404 Route (ALWAYS Keep this as the last route)
server.get('/*', function(req, res){
    throw new NotFound;
});

function NotFound(msg){
    this.name = 'NotFound';
    Error.call(this, msg);
    Error.captureStackTrace(this, arguments.callee);
}


console.log('Listening on http://0.0.0.0:' + port );
