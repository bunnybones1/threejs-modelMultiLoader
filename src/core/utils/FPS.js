function FPS() {
	this.lastTime = new Date;
	this.animationFrame = this.animationFrame.bind(this);
	requestAnimationFrame(this.animationFrame);
};

FPS.prototype = {
	filterStrength: 20,
	frameTime: 0,
	lastTime: 0,
	thisTime: new Date,
	fps: 0,
	idealFrameDuration: 1000 / 60,
	animSpeedCompensation: 1,
	
	animationFrame: function() {
		this.update();
		requestAnimationFrame(this.animationFrame);
	},
	update: function(){
		var frameTimeRaw = this.thisTime;
		this.thisTime = new Date;
		frameTimeRaw = this.thisTime - frameTimeRaw;
		var thisFrameDuration = this.thisTime - this.lastTime;
		if(thisFrameDuration > 100) thisFrameDuration = 100;
		var delta = this.frameTime - thisFrameDuration;
		this.frameTime -= delta / this.filterStrength;
		this.lastTime = this.thisTime;
		this.fps = 1000 / this.frameTime;
		this.animSpeedCompensation = frameTimeRaw / this.idealFrameDuration;
	}
};

module.exports = new FPS();