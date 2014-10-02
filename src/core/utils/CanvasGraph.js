function CanvasGraph(props) {
	this.addCanvasToDOMBody = this.addCanvasToDOMBody.bind(this);
	this.animationFrame = this.animationFrame.bind(this);

	props = props ? props : {};
	this.width = props.width ? props.width : this.width;
	this.height = props.height ? props.height : this.height;
	this.colorBG = props.colorBG !== undefined ? props.colorBG : "#222222";
	this.colorLine = props.colorLine !== undefined ? props.colorLine : "#FF2222";

	this.lastTime = this.time = new Date;

	this.canvas = this.createCanvas();
	this.values = [];
	this.setDOMRules();
	this.animationFrame();

	this.addValue(this, "fps", "red", "FPS");
};
CanvasGraph.prototype = {
	canvasID: "graphCanvas",
	width: 200,
	height: 60,
	range: {
		top: 60,
		bottom: 0
	},
	pixelsPerSecondScroll: 60,
	scrollPosition: 0,
	skipFrames: 0,
	skipFramesCounter: 0,
	createCanvas: function() {
		var canvas = document.createElement("canvas");
		canvas.id = this.canvasID;
		canvas.width = this.width;
		canvas.height = this.height;
		this.context = canvas.getContext("2d");
		this.context.fillStyle = this.colorBG;
		this.context.fillRect(0, 0, this.width, this.height);
		this.addCanvasToDOMBody(canvas);
		return canvas;
	},
	clear: function() {

	},
	addCanvasToDOMBody: function(canvas) {
		canvas = canvas || this.canvas;
		if(document.body) {
			
			document.body.appendChild(canvas);
		} else {
			
			setTimeout(this.addCanvasToDOMBody, 50);
		}
	},
	setDOMRules: function(mode) {
		var style = this.canvas.style;
		style.position = "fixed";
		style.left = "0px";
		style.top = "0px";
		style.width = this.width;
		style.height = this.height;
	},
	animationFrame : function() {
		if(this.skipFramesCounter < this.skipFrames) {
			this.skipFramesCounter++;
		} else {
			this.render();
			this.skipFramesCounter = 0;
		}
		if(!this._requestStop) requestAnimationFrame(this.animationFrame);
	},
	addValue: function(object, valueKey, colorString, name) {
		this.values.push({
			name: name,
			object:object,
			valueKey:valueKey,
			color: colorString
		})
	},
	render: function() {
		this.lastTime = this.time;
		this.time = new Date;
		var deltaTime = this.time - this.lastTime;
		this.fps = ~~(1000 / deltaTime)
		var scrollPositionDelta = deltaTime * .001 * this.pixelsPerSecondScroll;
		var scrollPositionLastInt = ~~this.scrollPosition;
		this.scrollPosition += scrollPositionDelta;
		var scrollPositionInt = ~~this.scrollPosition;
		var scrollPositionDeltaInt = scrollPositionInt - scrollPositionLastInt;
		if(scrollPositionDeltaInt < this.width) {
			this.context.putImageData(
				this.context.getImageData(scrollPositionDeltaInt, 0, this.width-scrollPositionDeltaInt, this.height),
				0, 0
			);
		}
		this.context.fillStyle = this.colorBG;
		this.context.fillRect(
			this.width - scrollPositionDeltaInt,
			0,
			scrollPositionDeltaInt,
			this.height
		);
		this.context.globalCompositeOperation = "lighter";
		for (var i = 0; i < this.values.length; i++) {
			var val = this.values[i];

			this.context.fillStyle = val.color;
			this.context.fillRect(
				this.width - scrollPositionDeltaInt,
				this.height - val.object[val.valueKey],
				scrollPositionDeltaInt,
				1
			);
		}
		this.context.globalCompositeOperation = "source-over";
	}
};

module.exports = CanvasGraph;