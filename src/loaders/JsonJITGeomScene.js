var JSONLoader = require('./JSON');
function JsonTreeSceneLoader( manager) {
	this.manager = manager;
};

var getURLParam = require('urlparams').getParam;



var p = JsonTreeSceneLoader.prototype = {
	totalLoading: 0,
	totalLoaded: 0,
	objectsByPath: undefined,
	geometries: undefined,
	objectsWaitingForGeometriesByGeometryPaths: undefined,
	loadersByGeometryPaths: undefined,
	pathsByObject: undefined,
	load: function (path, pathGeometries, onSceneLoad, onObjectLoad, onMeshLoad, onComplete, stream, autoLoadAllGeometries) {
		this.path = path;
		this.stream = stream;
		this.debug = false;
		this.autoLoadAllGeometries = autoLoadAllGeometries;
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
		this.objectsWaitingForGeometriesByGeometryPaths = {};
		this.loadersByGeometryPaths = {};
		this.threeGeometryJSONLoader = new THREE.JSONLoader();
		this.threeObjectJSONLoader = new THREE.ObjectLoader();
		this.hierarchyRecieved = this.hierarchyRecieved.bind(this);
		this.geometryRecieved = this.geometryRecieved.bind(this);
		this.showByName = this.showByName.bind(this);
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
				object.geometryLoadCompleteCallback();
				delete this.loadersByGeometryPaths[object.geometryName];
				delete object.geometryLoadCompleteCallback;
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
		} else {
			object.geometryLoadCompleteCallback = callback;
			if(!this.objectsWaitingForGeometriesByGeometryPaths[geometryName]) {
				this.objectsWaitingForGeometriesByGeometryPaths[geometryName] = [object];
				loader = JSONLoader.load(geometryPath + '.json', this.geometryRecieved, this.childError);
				this.loadersByGeometryPaths[geometryName] = loader;
				// this.totalLoading++;
			} else {
				this.objectsWaitingForGeometriesByGeometryPaths[geometryName].push(object);
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
				objectWaiting.visible = objectWaiting.targetVisiblility = false;
				delete objectWaiting.geometryLoadCompleteCallback;
			};
		}
		delete this.objectsWaitingForGeometriesByGeometryPaths[geometryName];
		this.cancelling.push(this.loadersByGeometryPaths[geometryName]);
		this.loadersByGeometryPaths[geometryName].abort();
		delete this.loadersByGeometryPaths[geometryName];
	},

	createObject: function(jsonData, path) {
		var object = this.threeObjectJSONLoader.parseObject(jsonData);
		object.path = path;
		object.materialName = jsonData.material;
		this.objectsByPath[path] = object;
		var name = path.substring(path.lastIndexOf('/')+1, path.length);
		object.name = name;

		for(var childName in jsonData.children) {
			object.add(this.createObject(jsonData.children[childName], path + '/' + childName));
		}


		var geometryName = jsonData.geometry;
		if(geometryName) {
			object.geometryName = geometryName;

			object.visible = false;
			this.decorateObjectWithShowAndHide(object);
		
			if(this.autoLoadAllGeometries) {
				console.log(geometryName);
				object.show();
			}
		}
		
		if(jsonData.quaternion) {
			object.quaternion.x = jsonData.quaternion[0];
			object.quaternion.y = jsonData.quaternion[1];
			object.quaternion.z = jsonData.quaternion[2];
			object.quaternion.w = jsonData.quaternion[3];
		}
		this.onObjectLoad(object);
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
		if(parent) parent.remove(object);
		if(parent) parent.add(mesh);

		for (var i = object.children.length - 1; i >= 0; i--) {
			mesh.add(object.children[i]);
		};
		var path = object.path;
		this.objectsByPath[path] = mesh;

		if(object === this.root) {
			this.root = mesh;
		}

		this.decorateObjectWithShowAndHide(mesh);
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

	showByName: function(name, recursive, callback) {
		var objPath = this.path + '/' + name;
		var object = this.objectsByPath[objPath];
		var loading = 0;
		var id = ~~(Math.random() * 0xffffff);
		function progressCallback() {
			loading--;
			if(this.debug) console.log(name, 'remaining geometries to load:', loading, id);
			if(loading === 0) {
				if(callback) {
					callback();
				}
			}
		}
		if(object) {
			if(object.show) { 
				loading += object.show(progressCallback) ? 1 : 0;
			}
			if(recursive) {
				object.traverse(function(obj) {
					if(obj.show) { 
						loading += obj.show(progressCallback) ? 1 : 0;
					}
				});
			}
			if(loading == 0) {
				callback();
			}
		} else {
			console.log(name, 'does not exist');
		}
	},

	hideByName: function(name, recursive) {
		var objPath = this.path + '/' + name;
		var object = this.objectsByPath[objPath];
		if(object) {
			if(object.hide) { object.hide(); }
			if(recursive) {
				object.traverse(function(obj) {
					if(obj.hide) { obj.hide(); }
				});
			}
		} else {
			console.log(name, 'does not exist');
		}
	},

	decorateObjectWithShowAndHide: function(object){
		var _this = this;
		object.targetVisiblility = object.visible;
		object.show = function(callback) {
			return _this.setVisibility(this, true, callback);
		}.bind(object);
		object.hide = function() {
			_this.setVisibility(this, false);
		}.bind(object);
	},

	setVisibility: function(object, state, callback) {
		if(object.targetVisiblility == state) return false;
		if(state == object.visible) return false;
		object.targetVisiblility = state;
		object.visible = state;
		switch(state) {
			case true:
				if(object.geometryName) {
					this.loadGeometryOf(object, callback);
					return true;
				}
				break;
			case false:
			default:

				if(object.geometryName) {
					this.cancelLoadGeometryOf(object);
				}
		}
		return false;
	}
}

module.exports = JsonTreeSceneLoader;