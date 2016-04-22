var THREE = require("three");

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

Button.prototype.getName = function() {
	return this.name_;
}

Button.prototype.rasterize = function(img, currentStep) {
	var res = this.el_.getAttribute('data-texture-res') || 256;

	this.img_ = img;
	this.domToImage_.renderImage(
		this.el_.innerHTML,
		'webvr-showandtell-button',
		res,
		img,
		this.onImgReady_.bind(this, currentStep));
};

Button.prototype.getMesh = function() {
	return this.mesh_;
};
	
Button.prototype.onImgReady_ = function(currentStep) {
	var currentAnnotationMesh = currentStep.getAnnotationMesh();	
	this.logger_.log("Ready to update button image", this.img_.src, currentAnnotationMesh);

	var width = this.el_.getAttribute('data-mesh-width');
	var height = this.el_.getAttribute('data-mesh-height');

	var x = this.el_.getAttribute('data-mesh-x');
	var y = this.el_.getAttribute('data-mesh-y');
	var z = this.el_.getAttribute('data-mesh-z');

	var texture = new THREE.Texture();
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;

	// Stretch the texture to accomodate for non-square aspect ratio.
	texture.repeat.set(1, height / width);
	texture.offset.set(0, - height * 2);
	texture.needsUpdate = true;
	texture.image = this.img_;
	var material = new THREE.MeshBasicMaterial({
	  map: texture,
	});

	var geometry = new THREE.BoxGeometry(
		width,
		height,
		// Constant thickness.
		.01
	);

	this.mesh_ = new THREE.Mesh(geometry, material);
	this.mesh_.name = this.name_;

	// TODO: Use currentAnnotationMesh for position.
	this.mesh_.position.set(x, y, z);
	this.logger_.log("Button position:", x, y, z, this);

	this.scene_.add(this.mesh_);
};

Button.prototype.getObjectByName = function() {
	return this.scene_.getObjectByName(this.name_);
};

Button.prototype.hide = function() {
	this.logger_.log("Hiding button", this);
	if (!this.mesh_) {
		return;
	}
	this.mesh_.visible = false;
};

Button.prototype.show = function() {
	this.logger_.log("Showing button", this);
	if (!this.mesh_) {
		return;
	}
	this.mesh_.visible = true;
};

Button.prototype.activate = function() {
	this.logger_.log('activate', this);
	this.el_.dispatchEvent(new Event('click'));
};

module.exports = Button;