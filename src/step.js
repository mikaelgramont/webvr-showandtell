var Step = function(index, el, name, scene, threeRenderer, domToImage, logger) {
	this.index_ = index;
	this.el_ = el;
	this.name_ = name;
	this.scene_ = scene;
	this.threeRenderer_ = threeRenderer;
	this.domToImage_ = domToImage;
	this.logger_ = logger;

	this.logger_.log('Creating show-and-tell step', this);

	this.previous_ = null;
	this.next_ = null;
};

Step.prototype.rasterize = function(img) {
	this.logger_.log("Rendering step", this.name_);

	// This attribute controls the resolution of the texture.
	// Until this can be calculated, it will need to be adjusted
	// manually, depending on how far and how big the annotation is.
	var res = this.el_.getAttribute('data-texture-res') || 512;

	this.img_ = img;
	this.domToImage_.renderImage(
		this.el_.innerHTML,
		'webvr-showandtell-annotation',
		res,
		img,
		this.onImgReady_.bind(this));
};

Step.prototype.clear = function() {
	this.scene_.remove(
		this.scene_.getObjectByName(this.getAnnotationName()));
};

Step.prototype.onImgReady_ = function() {
	this.logger_.log("Ready to update annotation image", this.img_.src);

	var width = this.el_.getAttribute('data-mesh-width');
	var height = this.el_.getAttribute('data-mesh-height');

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
	this.mesh_.name = this.getAnnotationName();
	this.mesh_.position.set(
		this.el_.getAttribute('data-mesh-x'),
		this.el_.getAttribute('data-mesh-y'),
		this.el_.getAttribute('data-mesh-z')
	);

	// Remove the previous annotation - if any.
	var current = this.getAnnotationMesh();
	if (current) {
		this.scene_.remove(current);
	}

	this.scene_.add(this.mesh_);
};

Step.prototype.getAnnotationMesh = function() {
	return this.scene_.getObjectByName(this.getAnnotationName());
};

Step.prototype.getAnnotationName = function() {
	return 'annotation' + this.index_;
}

Step.prototype.getName = function() {
	return this.name_;
};

Step.prototype.hasPrevious = function() {
	return !this.el_.getPreviousStepName();
};

Step.prototype.getPreviousStepName = function() {
	return this.el_.getAttribute('data-previous-step');
};

Step.prototype.getNextStepName = function() {
	return this.el_.getAttribute('data-next-step');
};

module.exports = Step;