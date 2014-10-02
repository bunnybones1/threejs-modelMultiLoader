'use strict';

var path = require('path');

var lrSnippet  = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var mountFolder = function(connect, dir) {
  return connect.static(path.resolve(dir));
};

var models = [
  'assets/parseTest/parse.autodesk.dae'
]
module.exports = function(grunt) {
  grunt.initConfig({

    watchify: {
      options: {
        debug: false
      },
      core: {
        src: './src/core/index.js',
        dest: 'dist/ThreejsModelMultiLoader.js'
      },
      examples: {
        src: './src/examples/index.js',
        dest: 'dist/ThreejsModelMultiLoader-examples.js'
      }
    },

    watch: {
      app: {
        files: ['dist/ThreejsModelMultiLoader.js','dist/ThreejsModelMultiLoader-examples.js', 'examples/**/*'],
        options: {
          livereload: true
        }
      }
    },

    open: {
      example : {
        // Change this to '0.0.0.0' to access the server from outside.
        path: 'http://localhost:9000/examples/01_Basic'
      }
    },

    connect: {
      options: {
        port: 9000,
        // Change this to '0.0.0.0' to access the server from outside.
        hostname: 'localhost'
      },
      livereload: {
        options: {
          middleware: function (connect) {
            return [
              lrSnippet,
              mountFolder(connect, '.')
            ];
          }
        }
      }
    },

    //note that filenames will automatically be fixed into .json. This is to help simplify your configs when used in conjunction with grunt-convertautodesktothreejs
    splitthreejsmodel: {
      options: {
        // standaloneTest: true
      },
      default_options: {
        options: {
          models: models
        }
      }
    },

    //note that filenames will automatically be fixed into .json. This is to help simplify your configs when used in conjunction with grunt-convertautodesktothreejs
    packsplitthreejsmodel: {
      options: {
        // standaloneTest: true
      },
      default_options: {
        options: {
          models: models
        }
      }
    },
  });

  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-contrib-connect');
  grunt.loadNpmTasks('grunt-contrib-livereload');
  grunt.loadNpmTasks('grunt-watchify');
  grunt.loadNpmTasks('grunt-open');
  grunt.loadNpmTasks('grunt-splitthreejsmodel');
  grunt.loadNpmTasks('grunt-packsplitthreejsmodel');

  grunt.registerTask('default', ['watchify', 'connect', 'open', 'watch']);
};
