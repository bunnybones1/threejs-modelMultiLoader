function GZipSceneLoader( manager) {
	this.manager = manager;
};

var p = GZipSceneLoader.prototype = {
	fileNames: [],
	dataByFileName: {},
	load: function (path, onSceneLoad) {
		this.path = path;
		this.onSceneLoad = onSceneLoad;
		this.onGZipStreamParseModel = this.onGZipStreamParseModel.bind(this);
		this.onGZipError = this.onGZipError.bind(this);
		this.onGZipLoadVerifyContents = this.onGZipLoadVerifyContents.bind(this);
		TarGZ.load(path, this.onGZipLoadVerifyContents, this.onGZipStreamParseModel, this.onGZipError);

		this.processData = this.processData.bind(this);
		this.processDataComplete = this.processDataComplete.bind(this);
		this.sceneLoader = new THREE.SceneLoader( this.manager); 
	},

	onGZipStreamParseModel: function(data) {
		var fileName = data.filename;
		if(data.data.length == 0) return;

		this.dataByFileName[fileName] = data.data;
		this.fileNames.push(fileName);
		var _this = this;
		setTimeout(	function() {
			_this.processData(data.data);
		}, 10);
	},

	onGZipLoadVerifyContents: function(data) {
		console.log("TAR GZ Scene loaded.")
	},
	
	onGZipError: function(data) {
		throw(data);
	},

	processData: function(dataString) {
		this.sceneLoader.parse(JSON.parse(dataString), this.processDataComplete, this.path);
	},

	processDataComplete: function(scene) {
		//console.log(scene);
		this.onSceneLoad(scene);
	}
}

module.exports = GZipSceneLoader;