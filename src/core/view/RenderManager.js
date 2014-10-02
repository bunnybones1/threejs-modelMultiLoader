var signals = require('signals');

/**
 * Manages render timing, pause and unpause
 * @param {View} view the view to manage
 */
function RenderManager(view) {
	
	this.view = view;
	this.skipFrames = 0;
	this.skipFramesCounter = 0;
	this.onEnterFrame = new signals.Signal();
	this.onExitFrame = new signals.Signal();
	this.renderLoop = this.renderLoop.bind(this);
};

RenderManager.prototype = {	
	/**
	 * a flag to request that the render loop stops next at the next frame
	 * @type {Boolean}
	 */
	_requestStop: false,

	/**
	 * the repeating renderLoop calls itself with requestAnimationFrame to act as the render timer
	 */
	renderLoop : function() {
		if(this.skipFramesCounter < this.skipFrames) {
			this.skipFramesCounter++;
		} else {
			this.onEnterFrame.dispatch();
			this.view.render();
			this.onExitFrame.dispatch();
			this.skipFramesCounter = 0;
		}
		if(!this._requestStop) requestAnimationFrame(this.renderLoop);
	},

	/**
	 * start rendering
	 */
	start: function() {
		this._requestStop = false;
		requestAnimationFrame(this.renderLoop);
	},

	/**
	 * stop rendering
	 */
	stop: function() {
		this._requestStop = true;
	}
}

module.exports = RenderManager;