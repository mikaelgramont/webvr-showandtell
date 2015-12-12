var Step = function(el, name, imageRenderer, logger) {
	this.el_ = el;
	this.name_ = name;
	this.imageRenderer_ = imageRenderer;
	this.logger_ = logger;

	this.logger_.log('Creating show-and-tell step', this);

	this.previous_ = null;
	this.next_ = null;
};

Step.prototype.render = function() {

};

Step.prototype.getName = function() {
	return this.name_;
};

Step.prototype.getPrevious = function() {

};

Step.prototype.getNext = function() {

};