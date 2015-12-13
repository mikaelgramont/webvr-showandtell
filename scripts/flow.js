var Flow = function(stepEls, scene, threeRenderer, domToImage, logger) {
	this.logger_ = logger;
	this.scene_ = scene;
	this.threeRenderer_ = threeRenderer;
	this.domToImage_ = domToImage;
	this.steps_ = this.setupSteps_(stepEls);

	var img = document.createElement('img');
	var canvas = document.createElement('canvas');
	// img.width = "256";
	// img.height = "256";
	this.imgs = {
		annotation: img
	};
	this.canvases = {
		annotation: canvas
	};
	document.body.appendChild(img);
	document.body.appendChild(canvas);
}

Flow.prototype.setupSteps_ = function(stepEls) {
	// Map containing all steps for this flow.
	var steps = {};
	for(var i = 0, l = stepEls.length; i < l; i++) {
		var el = stepEls[i];
		var name = el.getAttribute('data-name');
		if (i == 0) {
			// Start with the first step in the list.
			this.currentStepName_ = name;
		}
		steps[name] = new Step(el, name, this.scene_, this.threeRenderer_,
			this.domToImage_, this.logger_);
	};

	return steps;
};

Flow.prototype.renderCurrent = function() {
	console.log("Rendering step", this.currentStepName_);
	this.getCurrentStep().render(this.imgs.annotation,
		this.canvases.annotation);
};

Flow.prototype.getCurrentStep = function() {
	return this.steps_[this.currentStepName_];
};

Flow.prototype.goToPrevious = function() {
	var previous = this.getCurrentStep().getPrevious();
	if (!previous) {
		return;
	}
	this.currentStepName_ = previous.getName();
	this.renderCurrent();
};

Flow.prototype.goToNext = function() {
	var next = this.getCurrentStep().getNext();
	if (!next) {
		return;
	}
	this.currentStepName_ = next.getName();
	this.renderCurrent();
};