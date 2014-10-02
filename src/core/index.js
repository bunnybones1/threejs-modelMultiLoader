var globalize = require('globalizejs');
var ThreejsModelMultiLoader = {
	sampleFunction: function(){
		console.log("sample core function!");
	},
	utils: require('./utils'),
	view: require('./view')
};
globalize('ThreejsModelMultiLoader', ThreejsModelMultiLoader);
module.exports = ThreejsModelMultiLoader;