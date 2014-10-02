var DOMMode = require('./DOMMode');
var EventUtils = require('../utils/Events');
var signals = require('signals');
var PerformanceTweaker = require('../utils/PerformanceTweaker');
var _ = require('lodash');
var RenderStats = require('./RenderStats');
/**
 * View is the viewport canvas and the renderer
 * @param {Object} props an object of properties to override default dehaviours
 */
function View(props) {
	this.addCanvasContainerToDOMBody = this.addCanvasContainerToDOMBody.bind(this);
	this.addCanvasToContainer = this.addCanvasToContainer.bind(this);

	props = props || {};
	this.scene = props.scene || new THREE.Scene();
	props.rendererSettings = props.rendererSettings || {};
	if(props.camera) {
		this.camera = props.camera;
	} else {
		this.camera = new THREE.PerspectiveCamera();
		this.scene.add(this.camera);
		this.camera.position.z = 8.50;
		this.camera.position.y = 8.0;
		this.camera.lookAt(this.scene.position);
	}
	this.autoStartRender = props.autoStartRender !== undefined ? props.autoStartRender : true;
	this.canvasContainerID = props.canvasContainerID || "WebGLCanvasContainer";
	this.canvasID = props.canvasID || "WebGLCanvas";
	this.domMode = props.domMode || DOMMode.FULLSCREEN;
	
	//use provided canvas or make your own
	this.canvasContainer = document.getElementById(this.canvasContainerID) || this.createCanvasContainer();
	this.canvas = document.getElementById(this.canvasID) || this.createCanvas();
	this.rendererSettings = _.merge({
		canvas: this.canvas,
		antialias: true,

	}, props.rendererSettings);

	if( props.renderer !== undefined)
		this.renderer = props.renderer;
	else 
		this.renderer = new THREE.WebGLRenderer(this.rendererSettings);

	if(this.rendererSettings.autoClear === false) this.renderer.autoClear = false;

	this.renderManager = new(require('./RenderManager'))(this);
	if(this.autoStartRender) this.renderManager.start();

	PerformanceTweaker.onChange.add(this.onPerformanceTweakerChangeResolution.bind(this));

	this.setupResizing();

	if(props.stats) {
		this.stats = new RenderStats(this.renderer);
		this.renderManager.onEnterFrame.add(this.stats.onEnterFrame);
		this.renderManager.onExitFrame.add(this.stats.onExitFrame);
	}
}

View.prototype = {
	setupResizing: function() {
		this.onResize = new signals.Signal();
		this.setSize = this.setSize.bind(this);
		EventUtils.addEvent(window, "resize", function(event) {
	
			this.onResize.dispatch(window.innerWidth, window.innerHeight);
		}.bind(this));
		this.onResize.add(this.setSize);
		this.setSize(window.innerWidth, window.innerHeight);

	},
	/**
	 * Renders the scene to the canvas using the renderer
	 * @return {[type]} [description]
	 */
	render: function () {
		PerformanceTweaker.update();
		this.renderer.render(this.scene, this.camera);
	},

	/**
	 * Creates the canvas DOM Element and appends it to the document body
	 * @return {CanvasElement} The newly created canvas element.
	 */
	createCanvasContainer: function() {
		var canvasContainer = document.createElement("div");
		canvasContainer.id = this.canvasContainerID;
		canvasContainer.width = window.innerWidth;
		canvasContainer.height = window.innerHeight;
		this.addCanvasContainerToDOMBody(canvasContainer);
		this.setDOMMode(canvasContainer, this.domMode);
		return canvasContainer;
	},

	createCanvas: function() {
		var canvas = document.createElement("canvas");
		canvas.id = this.canvasID;
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		this.addCanvasToContainer(canvas);
		this.setDOMMode(canvas, this.domMode);
		return canvas;
	},

	addCanvasContainerToDOMBody: function(canvasContainer) {
		canvasContainer = canvasContainer || this.canvasContainer;
		if(document.body) {
			document.body.appendChild(canvasContainer);
		} else {
			setTimeout(this.addCanvasContainerToDOMBody, 50);
		}
	},

	addCanvasToContainer: function(canvas) {
		canvas = canvas || this.canvas;
		if(this.canvasContainer) {
			this.canvasContainer.appendChild(canvas);
		} else {
			setTimeout(this.addCanvasToContainer, 50);
		}
	},

	/**
	 * sets the DOM Mode, which controls the css rules of the canvas element
	 * @param {String} mode string, enumerated in DOMMode
	 */
	setDOMMode: function(element, mode) {
		var style = element.style;
		switch(mode) {
			case DOMMode.FULLSCREEN:
				style.position = "fixed";
				style.left = "0px";
				style.top = "0px";
				style.width = window.innerWidth;
				style.height = window.innerHeight;
				break;
			default:
		}
	},

	setSize: function(w, h) {
		this.canvas.style.width = w;
		this.canvas.style.height = h;
		this.camera.aspect = w/h;
		this.camera.setLens(w, h);
		this.camera.updateProjectionMatrix();

		this.setResolution(
			~~(w / PerformanceTweaker.denominator), 
			~~(h / PerformanceTweaker.denominator)
		);
	},

	setResolution: function(w, h) {
		this.canvas.width = w;
		this.canvas.height = h;
		this.renderer.setSize(w, h);
	},

	onPerformanceTweakerChangeResolution: function(dynamicScale) {
		this.setResolution(
			~~(window.innerWidth * dynamicScale),
			~~(window.innerHeight * dynamicScale)
		);
	}
};

module.exports = View;