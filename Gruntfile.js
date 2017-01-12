'use strict';

module.exports = function(grunt) {
  grunt.initConfig({
    pkg: grunt.file.readJSON('package.json'),
    jshint: {
      all: ['Gruntfile.js', 'index.js', 'lib/**/*.js', 'test/**/*.js'],
      options: {
        node: true
      }
    },
    simplemocha: {
      options: {
        ui: 'tdd'
      },
      all: {
        src: 'test/**/*.js'
      }
    }
  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadTasks('./tasks');
  grunt.registerTask('default', ['build']);
};
