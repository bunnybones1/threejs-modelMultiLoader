var globalize = require('globalizejs');
var ThreejsModelMultiLoader = {
	examples: {
		SampleExample: require('./SampleExample')
	}
};
globalize('ThreejsModelMultiLoader', ThreejsModelMultiLoader);
module.exports = ThreejsModelMultiLoader;