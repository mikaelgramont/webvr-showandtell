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
	this.logger_.log('Button rendering not implemented', this);

	var res = 256;

	this.img_ = img;
	this.domToImage_.renderImage(
		this.el_.innerHTML,
		res,
		img,
		this.onImgReady_.bind(this));
};

Button.prototype.getMesh = function() {
	return this.mesh_;
};

Button.prototype.onImgReady_ = function() {
	this.logger_.log("Ready to update button image", this.img_.src);

	var width = .2;
	var height = .1;

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
	this.mesh_.position.set(
		.0,
		.0,
		-.8
	);

	this.scene_.add(this.mesh_);
};


Button.prototype.hide = function() {
	this.logger_.log('Button hiding not implemented', this);
};

Button.prototype.show = function() {
	this.logger_.log('Button showing not implemented', this);
};

Button.prototype.onGazeActivation = function() {
	this.logger_.log('onGazeActivation', this);
	this.el_.dispatchEvent(new Event('click'));
};