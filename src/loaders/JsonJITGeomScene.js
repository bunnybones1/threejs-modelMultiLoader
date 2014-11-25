var JSONLoader = require('./JSON');
function JsonTreeSceneLoader( manager) {
	this.manager = manager;
};

var getURLParam = require('urlparams').getParam;

var LOAD_UNAVAILABLE = -1,
	LOAD_AVAILABLE = 0,
	LOADING = 1,
	LOADED = 2;

var p = JsonTreeSceneLoader.prototype = {
	totalLoading: 0,
	totalLoaded: 0,
	objectsByPath: undefined,
	objectPaths: undefined,
	geometries: undefined,
	objectsWaitingForGeometriesByGeometryPaths: undefined,
	loadersByGeometryPaths: undefined,
	load: function (path, pathGeometries, onSceneLoad, onObjectLoad, onMeshLoad, onComplete, stream) {
		this.path = path;
		this.stream = stream;
		this.debug = true;
		this.pathBase = path.substring(0, path.lastIndexOf('/')+1);
		path = this.pathCropBase(path);
		this.pathGeometries = pathGeometries;
		this.onSceneLoad = onSceneLoad;
		this.onObjectLoad = onObjectLoad;
		this.onComplete = onComplete;
		this.onMeshLoad = onMeshLoad;
		this.objectsByPath = {};
		this.geometries = {};
		this.cancelling = [];
		this.objectPaths = [];
		this.objectsWaitingForGeometriesByGeometryPaths = {};
		this.loadersByGeometryPaths = {};
		this.threeGeometryJSONLoader = new THREE.JSONLoader();
		this.threeObjectJSONLoader = new THREE.ObjectLoader();
		this.hierarchyRecieved = this.hierarchyRecieved.bind(this);
		this.geometryRecieved = this.geometryRecieved.bind(this);
		this.showByName = this.showByName.bind(this);
		this.hideByName = this.hideByName.bind(this);
		this.childError = this.childError.bind(this);
		JSONLoader.load(this.pathBase + path, this.hierarchyRecieved, this.childError);
		this.totalLoading++;
	},

	hierarchyRecieved: function(jsonData, path) {
		this.root = new THREE.Object3D();
		for(var childName in jsonData) {
			this.root.add(this.createObject(jsonData[childName], path + '/' + childName));
		}
		this.onSceneLoad({scene: this.root});
		this.onComplete();
	},

	childError: function(xhr) {
		var cancelIndex = this.cancelling.indexOf(xhr);
		if(cancelIndex != -1) {
			console.log('geometry load cancelled!');
			this.cancelling.splice(cancelIndex, 1);
		} else {
			throw('error loading');
		}
		// throw(xhr);
	},

	geometryRecieved: function(jsonData, path) {
		path = this.pathCropGeometries(path);
		path = path.substring(0, path.lastIndexOf('.json'));
		// console.log(jsonData);
		if(this.debug) console.log('loaded', path);

		var geometry = this.threeGeometryJSONLoader.parse(jsonData).geometry;
		this.integrateGeometry(geometry, path);
		this.incrementAndCheckLoad();
	},

	integrateGeometry: function(geometry, path) {
		// console.log('integrate geometry', path);
		this.geometries[path] = geometry;
		var objectsToPromote = this.objectsWaitingForGeometriesByGeometryPaths[path];
		if(objectsToPromote) {
			for (var i = objectsToPromote.length - 1; i >= 0; i--) {
				var object = objectsToPromote[i];
				var mesh = this.promoteObjectToMesh(object, geometry);
				mesh.loadStatus = LOADED;
				if(object.geometryLoadCompleteCallback) {
					object.geometryLoadCompleteCallback();
					delete object.geometryLoadCompleteCallback;
				}
				delete this.loadersByGeometryPaths[object.geometryName];
				delete object.geometryName;
				// this.isolationTest(mesh);
			};
		}
		delete this.objectsWaitingForGeometriesByGeometryPaths[path];
	},


	loadGeometryOf: function(object, callback) {
		// object.add(new THREE.Mesh(new THREE.SphereGeometry(10)));
		var geometryName = object.geometryName;
		if(this.debug) console.log('loading', geometryName);
		var geometryPath = this.pathGeometries + geometryName;
		var geometry = this.geometries[geometryName];
		if(geometry) {
			object = this.promoteObjectToMesh(object, geometry);
			object.loadStatus = LOADED;
			return false;
		} else {
			if(!this.objectsWaitingForGeometriesByGeometryPaths[geometryName]) {
				object.geometryLoadCompleteCallback = callback;
				this.objectsWaitingForGeometriesByGeometryPaths[geometryName] = [object];
				loader = JSONLoader.load(geometryPath + '.json', this.geometryRecieved, this.childError);
				this.loadersByGeometryPaths[geometryName] = loader;
				return true;
				// this.totalLoading++;
			} else {
				this.objectsWaitingForGeometriesByGeometryPaths[geometryName].push(object);
				return false;
			}
		}
	},

	cancelLoadGeometryOf: function(object) {
		// object.add(new THREE.Mesh(new THREE.SphereGeometry(10)));
		var geometryName = object.geometryName;
		if(this.debug) console.log('cancelling', geometryName);
		var geometryPath = this.pathGeometries + geometryName;
		var objectsWaitingForGeometry = this.objectsWaitingForGeometriesByGeometryPaths[geometryName]
		if(objectsWaitingForGeometry) {
			for (var i = objectsWaitingForGeometry.length - 1; i >= 0; i--) {
				var objectWaiting = objectsWaitingForGeometry.splice(i, 1)[0];
				delete objectWaiting.geometryLoadCompleteCallback;
			};
		}
		delete this.objectsWaitingForGeometriesByGeometryPaths[geometryName];
		this.cancelling.push(this.loadersByGeometryPaths[geometryName]);
		this.loadersByGeometryPaths[geometryName].abort();
		delete this.loadersByGeometryPaths[geometryName];
	},

	storeObject: function(path, object) {
		this.objectsByPath[path] = object;
		this.objectPaths.push(path);

		//fix the alias for notFound
		var slices = path.split('/');
		if(slices[slices.length-1].indexOf("notFound") != -1){
			slices[slices.length-1] = "notFound";
		}
		path = slices.join('/');

		this.objectsByPath[path] = object;
		this.objectPaths.push(path);
	},

	createObject: function(jsonData, path) {
		var object = this.threeObjectJSONLoader.parseObject(jsonData);
		while(object.children.length > 0) object.remove(object.children[0]);	//I only want the object
		object.path = path;
		object.materialName = jsonData.material;
		this.storeObject(path, object);
		var name = path.substring(path.lastIndexOf('/')+1, path.length);
		object.name = name;

		for(var childName in jsonData.children) {
			object.add(this.createObject(jsonData.children[childName], path + '/' + childName));
		}

		var geometryName = jsonData.geometry;
		if(geometryName) {
			object.loadStatus = LOAD_AVAILABLE;
			object.geometryName = geometryName;

			this.decorateObjectWithJITGeometryAPI(object);
		
		} else {
			object.loadStatus = LOAD_UNAVAILABLE;
		}
		
		if(jsonData.quaternion) {
			object.quaternion.x = jsonData.quaternion[0];
			object.quaternion.y = jsonData.quaternion[1];
			object.quaternion.z = jsonData.quaternion[2];
			object.quaternion.w = jsonData.quaternion[3];
		}
		this.onObjectLoad(object);
		if(object.loadStatus === undefined) throw new Error('wtf');
		return object;
	},

	promoteObjectToMesh: function(object, geometry) {
		var mesh = new THREE.Mesh(geometry);
		mesh.path = object.path;
		mesh.name = object.name;
		var parent = object.parent;
		mesh.materialName = object.materialName;
		mesh.position.copy(object.position);
		mesh.scale.copy(object.scale);
		mesh.rotation.x = object.rotation.x;
		mesh.rotation.y = object.rotation.y;
		mesh.rotation.z = object.rotation.z;
		if(parent) {
			parent.remove(object);
			parent.add(mesh);
		} else {
			throw new Error('wtf');
		}

		for (var i = object.children.length - 1; i >= 0; i--) {
			mesh.add(object.children[i]);
		};
		var path = object.path;
		this.storeObject(path, mesh);

		if(object === this.root) {
			this.root = mesh;
		}

		this.decorateObjectWithJITGeometryAPI(mesh);
		this.onMeshLoad(mesh);
		return mesh;
	},

	incrementAndCheckLoad: function() {
		this.totalLoaded++;
		if(this.totalLoading == this.totalLoaded && !this.stream) {
			this.onSceneLoad({scene: this.root});
		}
	},

	pathCropBase: function(path) {
		return path.substring(this.pathBase.length, path.length);
	},

	pathCropGeometries: function(path) {
		return path.substring(this.pathGeometries.length, path.length);
	},

	notFound: function(name) {
		console.log(name, 'does not exist');
		if(name) {
			var slices = name.split('/');
			slices[slices.length-1] = 'notFound';
			name = slices.join('/');
		} else {
			name = 'notFound'
		}
		return this.objectsByPath[this.path + '/' + name];
	},

	showByName: function(name, recursive, childrenOnly) {
		this.setVisibilityByName(name, true, recursive, childrenOnly);
	},

	hideByName: function(name, recursive, childrenOnly) {
		this.setVisibilityByName(name, false, recursive, childrenOnly);
	},

	setVisibilityByName: function(name, state, recursive, childrenOnly) {
		var object = this.getObjectByName(name);
		if(!object) {
			object = this.notFound(name);
		}
		if(object) {
			if(!childrenOnly) {
				object.visible = state;
			}
			// if(state, console.log(name));
			if(recursive) {
				object.traverse(function(obj) {
					if(obj === object) return;
					obj.visible = state;
				});
			}
		}
	},

	loadByName: function(name, recursive, callback) {
		var object = this.getObjectByName(name);
		var loading = 0;
		var _this = this;
		function progressCallback() {
			loading--;
			if(_this.debug) console.log(name, 'remaining geometries to load:', loading);
			if(loading === 0) {
				if(callback) {
					callback();
				}
			}
		}
		if(!object) {
			object = this.notFound(name);
		}
		if(object) {
			if(object.load) { 
				loading += object.load(progressCallback) ? 1 : 0;
			}
			if(recursive) {
				object.traverse(function(obj) {
					if(obj.load) { 
						loading += obj.load(progressCallback) ? 1 : 0;
					}
				});
			}
			console.log('geometries to load:', loading)
			if(loading == 0) {
				callback();
			}
		}
	},

	cancelLoadByName: function(name, recursive, callback) {
		throw new Error('Not implemented yet');
	},

	checkIfLoadedByName: function(name, recursive) {
		var object = this.getObjectByName(name);
		var loaded = object.loadStatus == LOADED || object.loadStatus == LOAD_UNAVAILABLE;
		if(loaded && recursive) {
			object.traverse(function(obj) {
				if(obj.loadStatus != LOADED && obj.loadStatus != LOAD_UNAVAILABLE) {
					loaded = loaded && false;
					throw new Error('wtf');
				}
			})
		}
		return loaded;
	},

	decorateObjectWithJITGeometryAPI: function(object){
		var _this = this;
		object.targetVisiblility = object.visible;
		object.load = function(callback) {
			if(object.loadStatus === LOAD_AVAILABLE) {
				object.loadStatus = LOADING;
				return _this.loadGeometryOf(object, callback);
			}
			return false;
		};
		object.unload = function(callback) {
			throw new Error('not implemented yet');
		};
		object.cancelLoad = function(callback) {
			throw new Error('not implemented yet');
		};
	},

	getObjectByName: function(name) {
		var objPath = this.path + '/' + name;
		return this.objectsByPath[objPath];
	}
}

module.exports = JsonTreeSceneLoader;