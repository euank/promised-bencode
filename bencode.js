/* Future possibilities:
 * It would be cool if this thing
 * actually emitted pieces of bdecoded
 * shit along the way. eg, the
 * torrent client could listen for the infohash
 * key, name key, and update its internal
 * data while it's still parsing the rest
 * of the file.
 *
 * This would also allow only one copy of
 * the data to be in memory, + the size of a chunk.
 */


// In order to make it not be recursive, we simply can setTimeout 0 callback our way through.
var fs = require('fs'),
    Q = require('q'),
    is = require('is-js'),
    async = require('async');


exports.bdecode = function(fileOrData, callback) {
  // Todo, stream instead of read all data at once, especially if it's a file. Allow stream as an argument
  return Q.fcall(function() {
    if(Buffer.isBuffer(fileOrData)) {
      return fileOrData.toString();
    } else if(typeof fileOrData == 'string') {
      return fileOrData;
    } else {
      // Doesn't work, async
      fs.readFile(fileOrData, function(err, res) {
        if(err) throw new Error(err);
        return res.toString();
      });
    }
  })
  .then(bdecodeData);
};


function bdecodeData(val) {
  var deferred = Q.defer();
  var out = [];
  var myNdx = 0;
  async.whilst(
    function() {
      return myNdx < val.length;
    },
    function(callback) {
      decodeElement(val, myNdx)
      .then(function(val) {
        out.push(val.obj);
        myNdx = val.ndx;
        callback(null);
      })
      .fail(callback);
    },
    function(err) {
      if(err) deferred.fail(err);
      else deferred.resolve(out);
    }
  );

  return deferred.promise;
}


function decodeInt(str, ndx) {
  var deferred = Q.defer();
  //assert(str[ndx] == 'i');
  ndx++;
  var num = 0;
  for(; str[ndx] !== 'e'; ndx++) {
    if(str[ndx] < '0' || str[ndx] > '9') {
      return deferred.fail("Invalid string decoding at character " + ndx + "; expected int and got " + str[ndx]);
    }
    num *= 10;
    num += parseInt(str[ndx], 10);
  }
  ndx++; // 'e'
  deferred.resolve({ndx: ndx, obj: num});
  return deferred.promise;
}

function decodeStr(str, ndx) {
  var deferred = Q.defer();
  var out = '';
  var strlen = 0;
  for(; str[ndx] !== ':'; ndx++) {
    if(str[ndx] < '0' || str[ndx] > '9') {
      return deferred.fail("Invalid string decoding at character " + ndx + "; expected int and got " + str[ndx]);
    }
    strlen *= 10;
    strlen += parseInt(str[ndx], 10);
  }
  ndx++; //bypass :
  for(var i = 0; i < strlen; i++, ndx++) {
    out += str[ndx];
  }
  if(ndx >= str.length) {
    return deferred.fail("Unexpectedly reached end of input");
  }
  deferred.resolve({ndx: ndx, obj: out});
  return deferred.promise;
}

function decodeList(str, ndx) {
  var deferred = Q.defer();
  //assert(str[ndx] === 'l')
  ndx++; // 'l'
  var list = [];
  async.whilst(
    function() {
      if(ndx >= str.length) return deferred.fail("Unexpected end of input");
      return str[ndx] !== 'e';
    },
    function(cb) {
      decodeElement(str, ndx)
      .then(function(res) {
        list.push(res.obj);
        ndx = res.ndx;
        cb(null);
      })
      .fail(function(err) {
        cb(err);
      });
    },
    function(err) {
      if(err) deferred.fail(err);
      else deferred.resolve({ndx: ndx + 1, obj: list});
      // +1 because of the 'e'
    }
  );
  return deferred.promise;
}

function decodeDict(str, ndx) {
  var deferred = Q.defer();
  //assert(str[ndx] == 'd')
  ndx++; //d
  var dict = {};
  async.whilst(
    function() {
      if(ndx >= str.length) return deferred.fail("Unexpected end of input");
      return str[ndx] !== 'e';
    },
    function(cb) {
      decodeElement(str, ndx)
      .then(function(keyRes) {
        decodeElement(str, keyRes.ndx)
        .then(function(valRes) {
          ndx = valRes.ndx;
          dict[keyRes.obj] = valRes.obj;
          cb(null);
        });
      });
    },
    function(err) {
      if(err) deferred.fail(err);
      else deferred.resolve({ndx: ndx + 1, obj: dict});
    }
  );

  return deferred.promise;
}

// Return format: {ndx: newNdx, obj: objDecoded}
function decodeElement(str, ndx) {
  if(str[ndx] === 'i') {
    return decodeInt(str, ndx);
  } else if(str[ndx] === 'l') {
    return decodeList(str, ndx);
  } else if(str[ndx] === 'd') {
    return decodeDict(str, ndx);
  } else {
    return decodeStr(str, ndx);
  }
}
