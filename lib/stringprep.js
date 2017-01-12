/** @module libidn/stringprep */
'use strict';

var _ = require('underscore');
_.str = require('underscore.string');

var fs = require('fs');
var path = require('path');

// rule
// ----
// 0 - character code lower bound
// 1 - character code upper bound
// 2 - substitution charachers

// table
// -----
// A table is an array of rules.

var tables = {};

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

(function(rfc) {
  // Copyright (C) 2002-2012 Simon Josefsson

  // This program is free software: you can redistribute it and/or modify
  // it under the terms of the GNU General Public License as published by
  // the Free Software Foundation, either version 3 of the License, or
  // (at your option) any later version.
  //
  // This program is distributed in the hope that it will be useful,
  // but WITHOUT ANY WARRANTY; without even the implied warranty of
  // MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  // GNU General Public License for more details.
  //
  // You should have received a copy of the GNU General Public License
  // along with this program.  If not, see <http://www.gnu.org/licenses/>.

  // I consider the output of this program to be unrestricted.  Use it as
  // you will.

  var intable = false;
  var tablename;
  var varname;

  _.every(_.str.lines(fs.readFileSync(rfc)), function(line) {
    line = line.replace(/^   (.*)/, '$1');

    if (/^----- Start Table (.*) -----/.test(line)) {
      if (intable) {
        console.error('already in table');
        return false;
      }

      tablename = line.replace(/^----- Start Table (.*) -----/, '$1');
      varname = 'rfc3454-' + tablename.replace(/\./g, '_');
      tables[varname] = [];

      intable = true;
      return true;
    }

    if (/^----- End Table (.*) -----/.test(line)) {
      if (! intable) {
        console.error('not in table');
        return false;
      }

      var name = line.replace(/----- End Table (.*) -----/, '$1');
      if (name !== tablename &&
          // typo in draft
          (name !== 'C.1.2' || tablename !== 'C.1.1')) {
        console.error('table error');
        return false;
      }

      intable = false;
      return true;
    }

    if (! intable) {
      return true;
    }

    if (line === '') { return true; }
    if (line === '\u000c') { return true; }
    if (/^Hoffman & Blanchet          Standards Track                    \[Page [0-9]+\]$/.test(line)) { return true; }
    if (/^RFC 3454        Preparation of Internationalized Strings   December 2002/.test(line)) { return true; }

    var match = /^([0-9A-F]+)(-([0-9A-F]+))?(; ([0-9A-F]+)( ([0-9A-F]+))?( ([0-9A-F]+))?( ([0-9A-F]+))?;)?/.exec(line);
    if (! match) {
      console.error('regexp failed on line:', line);
      return false;
    }
    if (match.length > 12) {
      console.error('too many mapping targets on line:', line);
      return false;
    }

    var start = match[1];
    var end = match[3];
    var map = new Array(4);
    map[0] = match[5];
    map[1] = match[7];
    map[2] = match[9];
    map[3] = match[11];

    if (end && map[0]) {
      console.error('tables tried to map a range');
      return false;
    }

    var row = [parseInt(start, 16)];
    if (end) {
      row.push(parseInt(end, 16));
    } else {
      row.push(row[0]);
    }

    row.push(
      String.fromCharCode.apply(null, _(map).filter(function(item) {
          return item;
        }).map(function(item) {
          return parseInt(item, 16);
        })));

    tables[varname].push(row);
    return true;
  });
})(path.join(__dirname, '../specifications/rfc3454.txt'));

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
