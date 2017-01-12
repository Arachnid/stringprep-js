/*global suite: true, test: true */
'use strict';

var assert = require('assert');
var stringprep = require('../lib/stringprep');

var nodeprep = stringprep.nodeprep;
var nameprep = stringprep.nameprep;

suite('nodeprep', function() {
  test('examples from http://josefsson.org/idn.php', function() {
    assert.equal("libraryh3lp", nodeprep("libraryH3LP"));
    assert.equal("räksmörgås.josefsson.org", nodeprep("räksmörgås.josefßon.org"));
  });
});

suite('nameprep', function() {
  test('examples from http://josefsson.org/idn.php', function() {
    assert.equal("bigbad", nameprep("BigBad"));
    assert.equal("安室奈美恵-with-super-monkeys", nameprep("安室奈美恵-with-SUPER-MONKEYS"));
    assert.equal("미술", nameprep("미술"));  // Korean
    assert.equal("ليهمابتكلموشعربي؟", nameprep("ليهمابتكلموشعربي؟"));  // Egyptian
    assert.equal("他们为什么不说中文", nameprep("他们为什么不说中文"));  // Chinese
    assert.equal("למההםפשוטלאמדבריםעברית", nameprep("למההםפשוטלאמדבריםעברית"));  // Hebrew
    assert.equal("почемужеонинеговорятпорусски", nameprep("почемужеонинеговорятпорусски"));  // Russian
    assert.equal("tạisaohọkhôngthểchỉnóitiếngviệt", nameprep("TạisaohọkhôngthểchỉnóitiếngViệt"));  // Vietnamese
    assert.equal("ひとつ屋根の下2", nameprep("ひとつ屋根の下2"));  // Japanese
    assert.equal("pročprostěnemluvíčesky", nameprep("Pročprostěnemluvíčesky"));  // Czech
    assert.equal("यहलोगहिन्दीक्योंनहींबोलसकतेहैं", nameprep("यहलोगहिन्दीक्योंनहींबोलसकतेहैं"));  // Hindi
    assert.equal("ພາສາລາວ", nameprep("ພາສາລາວ"));  // Lao
    assert.equal("bonġusaħħa", nameprep("bonġusaħħa"));  // Maltese
    assert.equal("ελληνικά", nameprep("ελληνικά"));  // Greek
  });
});
