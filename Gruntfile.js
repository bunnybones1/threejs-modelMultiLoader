'use strict';

var path = require('path');

var mountFolder = function(connect, dir) {
  return connect.static(path.resolve(dir));
};

var models = [
  'assets/models/parseTest/parse.autodesk.dae',
  // 'assets/models/v6/v6.autodesk.dae'
]
module.exports = function(grunt) {
  grunt.initConfig({
    //note that filenames will automatically be fixed into .json. This is to help simplify your configs when used in conjunction with grunt-convertautodesktothreejs
    
    convertautodesktothree: {
      car: {
        options: {
          models : models
        }
      }
    },

    splitthreejsmodel: {
      car: {
        options: {
          models : models
        }
      }
    },

    packsplitthreejsmodel: {
      car: {
        options: {
          models : models
        }
      }
    },

    threejs_model_manifest: {
      car: {
        options: {
          models : models,
          depth: 2
        }
      }
    }

  });
  grunt.loadNpmTasks('grunt-convertautodesktothree');
  grunt.loadNpmTasks('grunt-splitthreejsmodel');
  grunt.loadNpmTasks('grunt-packsplitthreejsmodel');
  grunt.loadNpmTasks('grunt-threejs-model-manifest');
  
  grunt.registerTask('convertModel', ['convertautodesktothree']);
  grunt.registerTask('splitModel', ['splitthreejsmodel']);
  grunt.registerTask('packModel', ['packsplitthreejsmodel']);
  grunt.registerTask('manifest', ['threejs_model_manifest']);
  grunt.registerTask('prepModel', ['convertautodesktothree', 'splitModel', 'manifest', 'packModel']);
  
};
