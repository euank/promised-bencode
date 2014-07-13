var bencode = require('../bencode.js');
var expect = require('chai').expect;

var tests = [
  {
    name: "decode string",
    in: "6:string",
    out: ['string']
  },
  {
    name: "decode int",
    in: "i1e",
    out: [1]
  },
  {
    name: "decode list",
    in: "l6:stringi1ee",
    out: [['string', 1]]
  },
  {
    name: "decode dict",
    in: "d6:stringi1ee",
    out: [{'string': 1}]
  },
  {
    name: "decode dict of dicts",
    in: "d5:okey1d4:key14:val1e4:key2li1eli1ei2eeee",
    out: [{okey1: {key1: "val1"}, key2: [1, [1, 2]]}]
  }
];

var errorTests = [
  {
    name: "doesn't decode invalid dict",
    in: "d"
  },
  {
    name: "doesn't decode an incorrectly lengthed string",
    in:"5:five"
  },
  {
    name: "Doesn't decode invalid int",
    in: "i1wronge"
  },
  {
    name: "Doesn't decode endless int",
    in: "i1"
  },
  {
    name: "Doesn't decode invalid list",
    in: "l"
  },
];

describe("benocode", function() {
  describe(".bdecode", function(){
    tests.forEach(function(test) {
      it('should ' + test.name, function(done) {
        bencode.bdecode(test.in)
        .then(function(res) {
          expect(res).to.deep.equal(test.out);
        })
        .then(done);
      });
    });

    errorTests.forEach(function(test) {
      it(test.name, function(done) {
        bencode.bdecode(test.in)
        .fail(function(){done();});
      });
    });
  });
});
