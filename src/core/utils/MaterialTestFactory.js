var sphereRadius = .5;
var sphereGeometry;
function createSpheres(materials) {
	var base = new THREE.Object3D();
	sphereGeometry = sphereGeometry || new THREE.SphereGeometry(sphereRadius, 32, 32);
	for (var i = 0; i < materials.length; i++) {
		var iX = i % 3;
		var iY = ~~(i / 3);
		var sphere = new THREE.Mesh(sphereGeometry, materials[i]);
		sphere.position.set(iX * 1.6 - 1.6, iY * 1.6 - .8, 0);
		base.add(sphere);
	};
	return base;
};
function createSpheresRing(materials) {
	var base = new THREE.Object3D();
	sphereGeometry = sphereGeometry || new THREE.SphereGeometry(sphereRadius, 32, 32);
	var ringCircumference = (materials.length * sphereRadius * 2 * 1.5);
	var ringRadius = ringCircumference / (2 * Math.PI);
	for (var i = 0, len = materials.length; i < len; i++) {
		var ratio = i / len * Math.PI * 2;
		var sphere = new THREE.Mesh(sphereGeometry, materials[i]);
		sphere.position.set(Math.cos(ratio) * ringRadius, .1, Math.sin(ratio) * ringRadius);
		base.add(sphere);
	};
	base.scale.multiplyScalar(1.5);
	return base;
}

module.exports = {
	createSpheres : createSpheres,
	createSpheresRing : createSpheresRing
}