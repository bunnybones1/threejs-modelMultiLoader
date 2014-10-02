var _renderer, stats, rendererStats;
var RenderStats = function(renderer) {
	_renderer = renderer;
	stats = new Stats();
	document.body.appendChild( stats.domElement );
	stats.domElement.style['pointer-events'] = 'none'
	stats.domElement.style['z-index'] = '1'
	stats.domElement.style.position = 'absolute'

	rendererStats = new THREEx.RendererStats();

	rendererStats.domElement.style.position = 'absolute'
	rendererStats.domElement.style.left = '0px'
	rendererStats.domElement.style.bottom = '0px'
	rendererStats.domElement.style['pointer-events'] = 'none'
	rendererStats.domElement.style['z-index'] = '1'
	document.body.appendChild( rendererStats.domElement );
};

var onEnterFrame = function() {
	rendererStats.update(_renderer);
	stats.begin();
};

var onExitFrame = function() {
	stats.end();
};

RenderStats.prototype = {
	onEnterFrame: onEnterFrame,
	onExitFrame: onExitFrame
}

module.exports = RenderStats;