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
  }
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
  });
});
