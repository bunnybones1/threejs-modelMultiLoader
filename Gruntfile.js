'use strict';

var path = require('path');

var lrSnippet  = require('grunt-contrib-livereload/lib/utils').livereloadSnippet;
var mountFolder = function(connect, dir) {
  return connect.static(path.resolve(dir));
};

var models = [
  // 'assets/models/parseTest/parse.autodesk.dae',
  'assets/models/v6/v6.autodesk.dae'
]
module.exports = function(grunt) {
  grunt.initConfig({
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

  grunt.loadNpmTasks('grunt-splitthreejsmodel');
  grunt.loadNpmTasks('grunt-packsplitthreejsmodel');

  grunt.registerTask('split', ['grunt-splitthreejsmodel']);
  grunt.registerTask('pack', ['grunt-packsplitthreejsmodel']);
};
