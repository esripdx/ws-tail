var fs = require('fs');
var glob = require('glob');
var moment = require('moment');

var Primus = require('primus.io');
var union = require('union');
var connect = require('connect');
var ecstatic = require('ecstatic');
var flatiron = require('flatiron');
var app      = flatiron.app;

var tail           = require('./lib/tail');
var config   = require(__dirname + '/config.json');

// If the basicAuth property has been set to true in config.json
// http basic auth is used to restrict access to all pages
// user and password properties are also set in the config.json
if (config.basicAuth) {
  app.use(flatiron.plugins.http, {
    before: [
      connect.basicAuth(function(user, pass){
        return config.user == user && config.password == pass;
      })
    ]
  });
} else {
  app.use(flatiron.plugins.http);
}


app.http.before.push(ecstatic(__dirname + '/public'));

app.router.get('/ping', function() {
  this.res.writeHead(200, {'Content-Type': 'application/json'});
  this.res.json({ 'response': 'pong' });
});

app.router.get('/files.json', function() {
  this.res.writeHead(200, {'Content-Type': 'application/json'});
  this.res.json({ files: getLogFiles() });
});

app.start(config.port);
console.log("Listening on port "+config.port);

var primus = new Primus(app.server);

primus.on("connection", function(spark){
  spark.on("data", function(data){
    if(typeof data === 'object') {
      if(data.action == "subscribe") {
        subscribe(data.file, this);
      } else if(data.action == "unsubscribe") {
        unsubscribe(data.file, this);
      } else if(data.action == "list") {
        getFileList(this);
      }
    }
  });
});

primus.on("disconnection", function(spark){
  unsubscribeAll(spark);
});

var subscriptions = {};

function subscribe(logfile, client) {
  console.log("New subscription request for "+logfile+" from client "+client.id);

  // Kill the old process
  if(subscriptions[client.id]) {
    subscriptions[client.id].stop();
  }

  var tailer = tail(logfile, {buffer: 10});
  tailer.getBuffer().forEach(function(line){
    client.write({
      line: line
    });    
  });
  tailer.on('line', function(line){
    client.write({
      type: "line",
      line: line
    });    
  });
  subscriptions[client.id] = tailer;
}

function unsubscribe(logfile, client) {
  console.log("Client "+client.id+" unsubscribed");
  if(subscriptions[client.id]) {
    subscriptions[client.id].stop();
  }
}

function unsubscribeAll(client) {
  console.log("Client "+client.id+" disconnected");
  if(subscriptions[client.id]) {
    subscriptions[client.id].stop();
  }
}

function getLogFiles() {
  var files = [];
  for(var i in config.files) {
    var moreFiles = glob.sync(config.files[i].glob);
    for(var j in moreFiles) {
      var fileModifiedDate = fs.statSync(moreFiles[j]).mtime;
      files.push({
        file: moreFiles[j],
        name: moreFiles[j].replace(config.files[i].prefix, ''),
        age_text: moment(fileModifiedDate).fromNow(),
        date_text: moment(fileModifiedDate).calendar(),
        timestamp: Math.round(fileModifiedDate.getTime()/1000),
        age: Math.round(((new Date()).getTime() - fileModifiedDate.getTime()) / 1000)
      });
    }
  }
  return files;
}

function getFileList(client) {
  client.write({
    type: "files",
    files: getLogFiles()
  });
}

