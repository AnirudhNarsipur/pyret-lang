var runtime = require('./runtime.js');
var array = require('./array.js');
var assert = require('assert');

function _plus(l, r) { return l + r; }
function _minus(l, r) { return l - r; }
function _times(l, r) { return l * r; }
function _divide(l, r) { return l / r; }
function _lessthan(l, r) { return l < r; }
function _greaterthan(l, r) { return l > r; }
function _lessequal(l, r) { return l <= r; }
function _greaterequal(l, r) { return l >= r; }

function numToString(n) {
  return String(n);
}

function timeNow( otherTime = undefined ) {
  if ( otherTime === undefined ) {
    return process.hrtime();
  } else {
    return process.hrtime( otherTime );
  }
}

module.exports = {
  'num-to-str': numToString,
  'time-now' : timeNow,
  'raw-array': array['raw-array'],
  'display-string': function(s) { process.stdout.write(s); },
  "console-log": function(v) { console.log(v); },
  'assert': function( lv, rv, msg ) { assert.strictEqual( lv, rv, msg ) },
  print: function(v) {
    process.stdout.write(String(v));
  },
  '_plus': _plus,
  '_minus': _minus,
  '_times': _times,
  '_divide': _divide,
  '_lessthan': _lessthan,
  '_greaterthan': _greaterthan,
  '_lessequal': _lessequal,
  '_greaterequal': _greaterequal
};
