var MongoClient = require("mongodb").MongoClient;

function waitForMongo(mongoUrl, options, callback) {
  if(typeof(options) == 'function') {
    callback = options;
    options = {};
  }

  options = options || {};
  options.timeout = options.timeout || 1000 * 60 * 2; //2 minutes

  var timeouted = false;
  var timeoutHandler = setTimeout(function() {
    timeouted = true;
    callback(new Error('TIMEOUTED_WAIT_FOR_MONGO'));
  }, options.timeout);

  connectAgain();
  function connectAgain() {
    MongoClient.connect(mongoUrl, function(err, client) {
      if(timeouted) return;

      if(err) {
        handleError(err);
      } else {
        var db = client.db('kadira-data');
        clearTimeout(timeoutHandler);
        timeoutHandler = null;
        db.command({ismaster: true}, afterIsMaster);
      }


      function afterIsMaster(err, masterDoc) {
        if(err) {
          handleError(err);
        } else {
          callback(null, masterDoc.primary);
          db.close();
        }
      }

      function handleError(err) {
        setTimeout(connectAgain, 2000);
      }
    });
  }
}

module.exports = waitForMongo;
