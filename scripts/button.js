var Button = function(el, name, clickCallback, scene, threeRenderer,
	domToImage, logger) {

	this.el_ = el;
	this.name_ = name;
	this.scene_ = scene;
	this.threeRenderer_ = threeRenderer;
	this.domToImage_ = domToImage;
	this.logger_ = logger;

	this.logger_.log('Creating show-and-tell button', this);

	this.el_.addEventListener('click', clickCallback);
};

Button.prototype.render = function(img) {
	this.logger_.log('Button rendering not implemented');
};