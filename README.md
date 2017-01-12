node-libidn
===========

This library is intended to be a port of GNU Libidn to Javascript,
for use in node.js.  At the moment, however, only stringprep (rfc3454)
is implemented.  Punycode and IDNA are TBD.

Installation
============

    npm install libidn

Usage
=====

    var stringprep = require('libidn').stringprep;
    stringprep.nameprep("eXample.COM");
    // other profiles, e.g.: stringprep.nodeprep, stringprep.resourceprep
