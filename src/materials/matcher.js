var defaultMaterial = new THREE.MeshPhongMaterial({
	diffuse: 0xffffff,
	emissive: 0xffffff,
	ambient: 0x000000,
	lights: false,
	specular: 0x000000,
	wireframe: true,
	vertexColors: THREE.VertexColors,
	//side: THREE.BackSide
});

var reminders = [];
var reminderGiven = false;
function remind() {
	if(reminderGiven) return;
	reminderGiven = true;
	console.log("MISSING MATERIALS: " + reminders.join(", "));
};

function materialMatcher(mesh, materials) {

	var material;
	var materialName;
	if(mesh.materialName) {
		materialName = mesh.materialName;
	} else {
		materialName = mesh.material.name;
	}

	material = materials[materialName];
	if(material) {
		mesh.material = material;
	} else {
		if(reminders.indexOf(materialName) == -1) {
			reminders.push(materialName);
			reminderGiven = false;
			setTimeout(remind, 2000);
		}
		mesh.material =  defaultMaterial;
	};
}

module.exports = materialMatcher;