WebVRShowAndTell = function() {
};

WebVRShowAndTell.prototype.setup = function() {
	this.setupGeneral_();
	this.setupRenderer_();
	this.setupScene_();
	this.setupCamera_();
	this.setupVRManager_();
	this.setupLights_();
	this.setupMainObject_();
	this.setupSkybox_();
	
	this.setupGazeInput_();

	this.animate_();
};

WebVRShowAndTell.prototype.setupGeneral_ = function() {
	this.loadingManager = new THREE.LoadingManager();
	this.loadingManager.onProgress = function(item, loaded, total) {
	  console.log(item, loaded, total);
	};
};

WebVRShowAndTell.prototype.setupRenderer_ = function() {
	this.renderer = new THREE.WebGLRenderer({antialias: true});
	this.renderer.setPixelRatio(window.devicePixelRatio);
	document.body.appendChild(this.renderer.domElement);
	
};

WebVRShowAndTell.prototype.setupScene_ = function() {
	this.scene = new THREE.Scene();
};

WebVRShowAndTell.prototype.setupCamera_ = function() {
	this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
};

WebVRShowAndTell.prototype.setupVRManager_ = function() {
	this.controls = new THREE.VRControls(this.camera);
	window.addEventListener('keydown', (function onKey(event) {
	  if (event.keyCode == 90) { // z
	    this.controls.resetSensor();
	  }
	}).bind(this), true);

	this.effect = new THREE.VREffect(this.renderer);
	this.effect.setSize(window.innerWidth, window.innerHeight);
	this.VRManager = new WebVRManager(this.renderer, this.effect, {hideButton: false});
};

WebVRShowAndTell.prototype.setupLights_ = function() {
	var ambient = new THREE.AmbientLight(0x101030);
	this.scene.add(ambient);

	var directionalLight = new THREE.DirectionalLight(0xffeedd);
	directionalLight.position.set(0, 0, 1);
	this.scene.add(directionalLight);
};

WebVRShowAndTell.prototype.setupMainObject_ = function() {
	var onProgress = function(xhr) {
	  if (xhr.lengthComputable) {
	    var percentComplete = xhr.loaded / xhr.total * 100;
	    console.log(Math.round(percentComplete, 2) + '% downloaded');
	  }
	};
	var onError = function(xhr) {};	

	var imageLoader = new THREE.ImageLoader(this.loadingManager);
	this.objTexture = new THREE.Texture();
	imageLoader.load('models/UV_Grid_Sm.jpg', (function(image) {
	  this.objTexture.image = image;
	  this.objTexture.needsUpdate = true;
	}).bind(this));

	var objLoader = new THREE.OBJLoader(this.loadingManager);
	objLoader.load('models/male02.obj', this.onObjectLoaded_.bind(this), onProgress, onError);	
};

WebVRShowAndTell.prototype.onObjectLoaded_ = function(object) {
    this.mainObject = object;
    this.mainObject.traverse((function(child) {
      if (child instanceof THREE.Mesh) {
        child.material.map = this.objTexture;
      }
    }).bind(this));
    this.mainObject.position.set(0, -.5, -1);
    this.mainObject.scale.set(.005, .005, .005);
    this.scene.add(this.mainObject);

};

WebVRShowAndTell.prototype.setupSkybox_ = function() {
	var boxWidth = 5;
	var texture = THREE.ImageUtils.loadTexture('images/box.png');
	texture.wrapS = THREE.RepeatWrapping;
	texture.wrapT = THREE.RepeatWrapping;
	texture.repeat.set(boxWidth, boxWidth);

	var geometry = new THREE.BoxGeometry(boxWidth, boxWidth, boxWidth);
	var material = new THREE.MeshBasicMaterial({
	  map: texture,
	  color: 0x01BE00,
	  side: THREE.BackSide
	});

	var skybox = new THREE.Mesh(geometry, material);
	this.scene.add(skybox);
};

WebVRShowAndTell.prototype.setupGazeInput_ = function(timestamp) {
	this.renderer.domElement.addEventListener('click', (function(event) {
	  var vector = new THREE.Vector3();
	  var raycaster = new THREE.Raycaster();
	  // This checks for intersections with the center of the window.
	  vector.set(0, 0, 0.5);  // z = 0.5 important!
	  vector.unproject(this.camera);
	  raycaster.set(this.camera.position, vector.sub(this.camera.position).normalize());
	  var intersects = raycaster.intersectObject(this.mainObject, true);
	  console.log(intersects.length > 0 ? "click intersect" : "click no intersect")
	}).bind(this));
};

WebVRShowAndTell.prototype.animate_ = function(timestamp) {
  this.controls.update();

  this.VRManager.render(this.scene, this.camera, timestamp);

  requestAnimationFrame(this.animate_.bind(this));
	
};