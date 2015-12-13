var Step = function(el, name, scene, threeRenderer, domToImage, logger) {
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

Step.prototype.render = function(img, canvas) {
	this.domToImage_.renderImage(this.el_, 256, img, canvas,
		this.onImgReady_.bind(this));
};

Step.prototype.onImgReady_ = function(img) {
	this.logger_.log("Ready to update annotation image", img.src);
	this.img_ = img;
	window.img = this.img_
	document.body.appendChild(img);

	var texture = new THREE.Texture();
	texture.needsUpdate = true;
	texture.image = this.img_;
	var material = new THREE.MeshBasicMaterial({
	  map: texture,
	});

	var geometry = new THREE.BoxGeometry(.5, .3, .01);

	var annotation = new THREE.Mesh(geometry, material);
	annotation.name = 'annotation';
	annotation.position.set(.35, .5, -1);

	this.scene_.add(annotation);
};

Step.prototype.getName = function() {
	return this.name_;
};

Step.prototype.getPrevious = function() {

};

Step.prototype.getNext = function() {

};