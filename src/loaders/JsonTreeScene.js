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
	pathsByObject: undefined,
	load: function (path, pathGeometries, onSceneLoad, onObjectLoad, onMeshLoad, onComplete, stream) {
		this.path = path;
		this.stream = stream;
		this.pathBase = path.substring(0, path.lastIndexOf('/')+1);
		path = this.pathCropBase(path);
		this.pathGeometries = pathGeometries;
		this.onSceneLoad = onSceneLoad;
		this.onObjectLoad = onObjectLoad;
		this.onComplete = onComplete;
		this.onMeshLoad = onMeshLoad;
		this.objectsByPath = {};
		this.geometries = {};
		this.objectsWaitingForGeometriesByGeometryPaths = {};
		this.threeGeometryJSONLoader = new THREE.JSONLoader();
		this.threeObjectJSONLoader = new THREE.ObjectLoader();
		this.childRecieved = this.childRecieved.bind(this);
		this.geometryRecieved = this.geometryRecieved.bind(this);
		this.childError = this.childError.bind(this);
		JSONLoader.load(this.pathBase + path + '/index.json', this.childRecieved, this.childError);
		this.totalLoading++;
	},

	childRecieved: function(jsonData, path) {
		path = this.pathCropBase(path);
		path = path.substring(0, path.lastIndexOf('/index.json'));
		var object = this.createObject(jsonData, path);

		if(this.totalLoaded == 0) {
			this.root = object;
			if(this.stream) this.onSceneLoad({scene: this.root});
		} else {
			this.integrateObject(object, path);
		}

		this.incrementAndCheckLoad();
	},

	childError: function(xhr) {
		throw(xhr);
	},

	geometryRecieved: function(jsonData, path) {
		path = this.pathCropGeometries(path);
		path = path.substring(0, path.lastIndexOf('.json'));
		// console.log(jsonData);
		var geometry = this.threeGeometryJSONLoader.parse(jsonData).geometry;
		this.integrateGeometry(geometry, path);
		this.incrementAndCheckLoad();
	},

	integrateObject: function(object, path) {
		// console.log('integrate object', path);
		var parentPath = path.substring(0, path.lastIndexOf('/'));

		var parentObject = this.objectsByPath[parentPath];
		var placeholder = parentObject.getObjectByName(object.name);
		parentObject.remove(placeholder);
		parentObject.add(object);
	},

	integrateGeometry: function(geometry, path) {
		// console.log('integrate geometry', path);
		this.geometries[path] = geometry;
		var objectsToPromote = this.objectsWaitingForGeometriesByGeometryPaths[path];
		if(objectsToPromote) {
			for (var i = objectsToPromote.length - 1; i >= 0; i--) {
				var mesh = this.promoteObjectToMesh(objectsToPromote[i], geometry);
				// this.isolationTest(mesh);
			};
		}
		delete this.objectsWaitingForGeometriesByGeometryPaths[path];
	},

	createObject: function(jsonData, path) {
		var object = this.threeObjectJSONLoader.parseObject(jsonData);
		object.path = path;
		object.materialName = jsonData.material;
		this.objectsByPath[path] = object;
		var name = path.substring(path.lastIndexOf('/')+1, path.length);
		object.name = name;

		var childCount = 0;
		for(var childName in jsonData.children) {
			JSONLoader.load(this.pathBase + path + '/' + childName + '/index.json', this.childRecieved, this.childError);
			this.totalLoading++;
			object.children[childCount].name = childName;
			childCount++;
		}

		var geometryName = jsonData.geometry;
		if(geometryName) {
			var geometryPath = this.pathGeometries + geometryName;
			var geometry = this.geometries[geometryName];
			if(geometry) {
				object = this.promoteObjectToMesh(object, geometry);
			} else {
				if(!this.objectsWaitingForGeometriesByGeometryPaths[geometryName]) {
					this.objectsWaitingForGeometriesByGeometryPaths[geometryName] = [object];
					JSONLoader.load(geometryPath + '.json', this.geometryRecieved, this.childError);
					this.totalLoading++;
				} else {
					this.objectsWaitingForGeometriesByGeometryPaths[geometryName].push(object);
				}
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
		this.onMeshLoad(mesh);
		return mesh;
	},

	incrementAndCheckLoad: function() {
		this.totalLoaded++;
		if(this.totalLoading == this.totalLoaded && !this.stream) {
			this.onSceneLoad({scene: this.root});
		}
		this.onComplete();
	},

	pathCropBase: function(path) {
		return path.substring(this.pathBase.length, path.length);
	},

	pathCropGeometries: function(path) {
		return path.substring(this.pathGeometries.length, path.length);
	}
}

module.exports = JsonTreeSceneLoader;