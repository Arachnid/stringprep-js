/** @module libidn/stringprep */
'use strict';

var _ = require('underscore');
_.str = require('underscore.string');
var tables = require('./tables.js');

// rule
// ----
// 0 - character code lower bound
// 1 - character code upper bound
// 2 - substitution charachers

// table
// -----
// A table is an array of rules.


function findRule(table, character) {
  var code = character.charCodeAt(0);
  var lo = 0;
  var hi = table.length;

  while (lo < hi) {
    var m = Math.floor((lo + hi) / 2);
    var rule = table[m];
    if (code < rule[0]) {
      hi = m;
    } else if (code > rule[1]) {
      lo = m + 1;
    } else {
      return rule;
    }
  }

  return null;
}

// Are any characters in the string subject to a rule in the table?
function someRule(table, string) {
  return _.some(string.split(''), function(character) {
    return findRule(table, character);
  });
}

function substituteString(table, string) {
  return _.map(string.split(''), function(character) {
    var rule = findRule(table, character);
    return rule ? rule[2] : character;
  }).join('');
}

// operation
// ---------
// 0 - op code
// 1 - target table or null
// 2 and on - additional arugments

function applyOperation(operation, string) {
  var table = operation[1] ? tables[operation[1]] : null;
  switch (operation[0]) {
  case 'map':
    return substituteString(table, string);
  case 'prohibit':
    if (someRule(table, string)) {
      throw 'stringprep contains prohibited';
    }
    return string;
  case 'unassigned':
    if (someRule(table, string)) {
      throw 'stringprep contains unassigned';
    }
    return string;
  default:
    return string;
  }
}

// profile
// -------
// A profile is a list of operations.

var profiles = {};

function stringprep(profile, string) {
  return _.reduce(profiles[profile], function(str, operation) {
    return applyOperation(operation, str);
  }, string);
}

tables['nodeprep-prohibit'] =
  _.map("\"&'/:<>@".split(''), function(character) {
    var code = character.charCodeAt(0);
    return [code, code, ''];
  });

profiles.nodeprep = [
  ['map', 'rfc3454-B_1'],
  ['map', 'rfc3454-B_2'],
  ['nfkc'],
  ['prohibit', 'rfc3454-C_1_1'],
  ['prohibit', 'rfc3454-C_1_2'],
  ['prohibit', 'rfc3454-C_2_1'],
  ['prohibit', 'rfc3454-C_2_2'],
  ['prohibit', 'rfc3454-C_3'],
  ['prohibit', 'rfc3454-C_4'],
  ['prohibit', 'rfc3454-C_5'],
  ['prohibit', 'rfc3454-C_6'],
  ['prohibit', 'rfc3454-C_7'],
  ['prohibit', 'rfc3454-C_8'],
  ['prohibit', 'rfc3454-C_9'],
  ['prohibit', 'nodeprep-prohibit'],
  ['bidi'],
  ['bidi-prohibit', 'rfc3454-C_8'],
  ['bidi-ral', 'rfc3454-D_1'],
  ['bidi-l', 'rfc3454-D_2'],
  ['unassigned', 'rfc3454-A_1']
];

profiles.nameprep = [
  ['map', 'rfc3454-B_1'],
  ['map', 'rfc3454-B_2'],
  ['nfkc'],
  ['prohibit', 'rfc3454-C_1_2'],
  ['prohibit', 'rfc3454-C_2_2'],
  ['prohibit', 'rfc3454-C_3'],
  ['prohibit', 'rfc3454-C_4'],
  ['prohibit', 'rfc3454-C_5'],
  ['prohibit', 'rfc3454-C_6'],
  ['prohibit', 'rfc3454-C_7'],
  ['prohibit', 'rfc3454-C_8'],
  ['prohibit', 'rfc3454-C_9'],
  ['bidi'],
  ['bidi-prohibit', 'rfc3454-C_8'],
  ['bidi-ral', 'rfc3454-D_1'],
  ['bidi-l', 'rfc3454-D_2'],
  ['unassigned', 'rfc3454-A_1']
];

profiles.resourceprep = [
  ['map', 'rfc3454-B_1'],
  ['nfkc'],
  ['prohibit', 'rfc3454-C_1_2'],
  ['prohibit', 'rfc3454-C_2_1'],
  ['prohibit', 'rfc3454-C_2_2'],
  ['prohibit', 'rfc3454-C_3'],
  ['prohibit', 'rfc3454-C_4'],
  ['prohibit', 'rfc3454-C_5'],
  ['prohibit', 'rfc3454-C_6'],
  ['prohibit', 'rfc3454-C_7'],
  ['prohibit', 'rfc3454-C_8'],
  ['prohibit', 'rfc3454-C_9'],
  ['bidi'],
  ['bidi-prohibit', 'rfc3454-C_8'],
  ['bidi-ral', 'rfc3454-D_1'],
  ['bidi-l', 'rfc3454-D_2'],
  ['unassigned', 'rfc3454-A_1']
];

_.each(profiles, function(_, profile) {
  exports[profile] = function(string) {
    return stringprep(profile, string);
  };
});
