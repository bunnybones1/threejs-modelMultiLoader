var signals = require('signals');
var FPS = require('./FPS');

function PerformanceTweaker(props) {
	props = props || {};
	this.degradeWhen = props.degradeWhen !== undefined ? props.degradeWhen : this.degradeWhen;
	this.upgradeWhen = props.upgradeWhen !== undefined ? props.upgradeWhen : this.upgradeWhen;
	this.lastLoop = new Date;
	this.onChange = new signals.Signal();
};

PerformanceTweaker.prototype = {
	denominator: 1,
	degradeWhen: 16,
	upgradeWhen: 28,
	denominatorMax: 8,
	dirty: 0,
	updateFrequency: 5,
	changeFactor: 1.25,
	onChange: undefined,
	update: function(){
		if(this.dirty == 0) {
			if(FPS.fps <= this.degradeWhen) {
			  	this.denominator *= this.changeFactor;
				if(this.denominator <= this.denominatorMax) {

					this.makeDirty();
				} else {
					this.denominator = this.denominatorMax;
				}
			} else if (FPS.fps >= this.upgradeWhen) {
				this.denominator /= this.changeFactor;
				if(this.denominator >= .99) {
					
					this.makeDirty();
				} else {
					this.denominator = 1;
				}
			}
		}
		this.denominatorSquared = this.denominator * this.denominator;

		if(this.dirty > 0) {
			this.dirty--;
		}
	},
	makeDirty: function(){
	  	this.onChange.dispatch(1/this.denominator);
	  	this.dirty = this.updateFrequency;
	}
}

module.exports = new PerformanceTweaker();