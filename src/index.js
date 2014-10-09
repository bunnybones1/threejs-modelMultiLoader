var LoadModes = require('./loaders/Modes'),
	getURLParam = require('urlparams').getParam,
	loaders = require('./loaders'),
	path = require('path'),
	signals = require('signals'),
	materialMatcher = require('./materials/matcher');

function MultiLoader(url, targetParent, materials, loadMode, stream) {

	stream = stream;
	console.log('loading', url);

	var loader;

	loadMode = loadMode ? loadMode : LoadModes.DAE;
	var temp = getURLParam('loadMode');
	if(temp !== undefined) loadMode = LoadModes[temp];

	var base = new THREE.Object3D();
	var onNewMeshSignal = new signals.Signal();
	base.onNewMeshSignal = onNewMeshSignal;


	function onMeshLoad( child ) {
		var pivot, mesh;
		pivot = child;
		if(loadMode == LoadModes.DAE) {
			mesh = pivot.children[0];
			if(mesh) {
				mesh.dragByParent = true;
			}
		} else {
			mesh = pivot;
		}

		if ( mesh instanceof THREE.Mesh ) {
			materialMatcher(mesh, materials);
			onNewMeshSignal.dispatch( mesh );
		}
	} 
	function onSceneLoad( data ) {
		var root = data.scene;
		var transplantObjects = false;
		if(loadMode != LoadModes.JSONTREE && loadMode != LoadModes.TARGZTREE) {
			root.traverse(onMeshLoad);
			transplantObjects = true;
		}

		if(transplantObjects) {
			var temp = root;
			root = new THREE.Object3D();
			for (var i = temp.children.length - 1; i >= 0; i--) {
				root.add(temp.children[i]);
			};
		}

		base.add(root);
	};

	var manager = new THREE.LoadingManager();
	manager.onProgress = function ( item, loaded, total ) {
		console.log( item, loaded, total );
	};

	var baseFilePath = url;
	var geometryPath = path.normalize(path.dirname(baseFilePath) + '/geometry') + '/';

	var loader;
	switch(loadMode) {
		case LoadModes.DAE:
			loader = new THREE.ColladaLoader( manager );
			loader.load( baseFilePath + '.dae', onSceneLoad);
			break;
		case LoadModes.JSON:
			loader = new THREE.SceneLoader( manager );
			loader.load( baseFilePath + '.json', onSceneLoad);
			break;
		case LoadModes.JSONTREE:
			loader = new loaders.JsonTreeScene( manager);
			loader.load( baseFilePath, geometryPath, onSceneLoad, onMeshLoad, stream);
			break;
		case LoadModes.TARGZ:
			loader = new loaders.TarGzScene( manager);
			loader.load( baseFilePath + '.full.tar.gz', onSceneLoad);
			break;
		case LoadModes.TARGZTREE:
			window.alert('TARGZTREE not supported yet.');
			return;
			loader = new loaders.TarGzTreeScene( manager);
			loader.load( baseFilePath + '.tree.tar.gz', onSceneLoad, stream);
			break;
	}

	targetParent.add(base);
	return base;
}

MultiLoader.MODES = LoadModes;

module.exports = MultiLoader;