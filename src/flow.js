var Button = require("./button");
var Step = require("./step");

var Flow = function(stepEls, buttonEls, scene, threeRenderer, domToImage,
	logger) {
	this.logger_ = logger;
	this.scene_ = scene;
	this.threeRenderer_ = threeRenderer;
	this.domToImage_ = domToImage;
	this.steps_ = this.setupSteps_(stepEls);
	this.buttons_ = this.setupButtons_(buttonEls);

	this.imgs = {
		annotation: document.createElement('img'),
		backButton: document.createElement('img'),
		nextButton: document.createElement('img')
	};
	for (var img in this.imgs) {
		document.body.appendChild(this.imgs[img]);
	}
}

Flow.prototype.getButtons = function() {
	return this.buttons_;
};

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
	var back = new Button(buttonEls[0], 'back-button',
		this.goToPrevious.bind(this), this.scene_, this.threeRenderer_,
		this.domToImage_, this.logger_);

	var next = new Button(buttonEls[1], 'next-button',
		this.goToNext.bind(this), this.scene_, this.threeRenderer_,
		this.domToImage_, this.logger_);

	return {
		'back': back,
		'next': next
	}
};

Flow.prototype.getCurrentInteractiveObjects = function() {
	var objs = [];
	if (this.getPreviousStep()) {
		objs.push(this.buttons_.back);
	}
	if (this.getNextStep()) {
		objs.push(this.buttons_.next);
	}

	// TODO: maybe add annotations if they become interactive,
	// as well as the main object on the page, or its subparts.

	return objs;
};

Flow.prototype.renderCurrent = function() {
	var currentStep = this.getCurrentStep();
	currentStep.rasterize(this.imgs.annotation);
	this.renderButtons(currentStep);
};

Flow.prototype.clearCurrentStep = function() {
	this.getCurrentStep().clear();	
};

Flow.prototype.getCurrentStep = function() {
	return this.steps_[this.currentStepName_];
};

Flow.prototype.getPreviousStep = function() {
	return this.steps_[
		this.getCurrentStep().getPreviousStepName()];
};

Flow.prototype.getNextStep = function() {
	return this.steps_[
		this.getCurrentStep().getNextStepName()];
};

Flow.prototype.goToPrevious = function() {
	var previous = this.getPreviousStep();
	if (!previous) {
		this.logger_.log('No previous step');
		return;
	}

	this.clearCurrentStep();
	this.currentStepName_ = previous.getName();
	this.renderCurrent();
};

Flow.prototype.goToNext = function() {
	var next = this.getNextStep();
	if (!next) {
		this.logger_.log('No next step');
		return;
	}
	this.clearCurrentStep();
	this.currentStepName_ = next.getName();
	this.renderCurrent();
};

Flow.prototype.renderButtons = function(currentStep) {
	this.logger_.info("Flow.renderButtons");
	var hasBack = !!this.scene_.getObjectByName(this.buttons_.back.getName());
	var hasNext = !!this.scene_.getObjectByName(this.buttons_.next.getName());
	
	if (this.getPreviousStep()) {
		this.buttons_.back.show();
		if (!hasBack) {
			this.buttons_.back.rasterize(this.imgs.backButton, currentStep);
		}
	} else {
		this.buttons_.back.hide();
	}
	if (this.getNextStep()) {
		this.buttons_.next.show();
		if (!hasNext) {
			this.buttons_.next.rasterize(this.imgs.nextButton, currentStep);
		}
	} else {
		this.buttons_.next.hide();
	}
};

module.exports = Flow;