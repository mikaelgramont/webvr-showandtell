var Flow = function(stepEls, buttonEls, scene, threeRenderer, domToImage,
	logger) {
	this.logger_ = logger;
	this.scene_ = scene;
	this.threeRenderer_ = threeRenderer;
	this.domToImage_ = domToImage;
	this.steps_ = this.setupSteps_(stepEls);
	this.buttons_ = this.setupButtons_(buttonEls);

	var img = document.createElement('img');
	// img.width = "256";
	// img.height = "256";
	this.imgs = {
		annotation: img
	};
	document.body.appendChild(img);
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
		steps[name] = new Step(i, el, name, this.scene_, this.threeRenderer_,
			this.domToImage_, this.logger_);
	};

	return steps;
};

Flow.prototype.setupButtons_ = function(buttonEls) {
	// TODO: create two buttons: back and next.
	// They should be tied to goToPrevious and goToNext, and have
	// two methods to hide and reveal them.
	
	var back = new Button(buttonEls[0], 'back-button',
		this.goToPrevious.bind(this), this.scene_, this.threeRenderer_,
		this.domToImage_, this.logger_);

	var next = new Button(buttonEls[1], 'next-button',
		this.goToNext.bind(this), this.scene_, this.threeRenderer_,
		this.domToImage_, this.logger_);

	return {
		'back': back,
		'next ': next
	}
};

Flow.prototype.renderCurrent = function() {
	this.logger_.log("Rendering step", this.currentStepName_);
	this.getCurrentStep().render(this.imgs.annotation);
};

Flow.prototype.clearCurrentStep = function() {
	this.getCurrentStep().clear();	
};

Flow.prototype.getCurrentStep = function() {
	return this.steps_[this.currentStepName_];
};

Flow.prototype.goToPrevious = function() {
	var previous = this.steps_[
		this.getCurrentStep().getPreviousStepName()]
	if (!previous) {
		return;
	}
	this.clearCurrentStep();
	this.currentStepName_ = previous.getName();
	this.renderCurrent();

	// TODO: hide back button if no prev step, else reveal it.
};

Flow.prototype.goToNext = function() {
	var next = this.steps_[
		this.getCurrentStep().getNextStepName()]
	if (!next) {
		return;
	}
	this.clearCurrentStep();
	this.currentStepName_ = next.getName();
	this.renderCurrent();

	// TODO: hide next button if no next step, else reveal it.
};