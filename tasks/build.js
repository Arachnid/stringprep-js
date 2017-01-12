module.exports = function(grunt) {
    grunt.registerTask('build', 'Build stringprep tables from the RFC', function() {
        var fs = require('fs');
        var path = require('path');
        var _ = require('underscore');
        _.str = require('underscore.string');

        var tables = {};

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

        fs.writeFileSync('lib/tables.js', 'module.exports = ' + JSON.stringify(tables) + ';');
    });
};
