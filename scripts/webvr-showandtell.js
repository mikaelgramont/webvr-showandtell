WebVRShowAndTell = function(userConfig, logger) {
	this.defaultConfig_ = {
		// The relative or absolute path to the main model.
		modelPath: null,
		// The relative or absolute path to the texture for the main model.
		modelTexture: null,
		// The relative or absolute path to the texture for the skybox.
		skyBoxTexture: 'images/box.png',
		// The width of the skybox cube.
		skyBoxWidth: 5,
		// How many times the skybox texture should repeat along one dinmension.
		skyBoxRepeat: 5,
		// A list of nodes, each describing a step of the show and tell.
		stepEls: null,
		// The element containing the styling for all show and tell elements.
		styleEl: null,
		// A list of nodes representing the navigation buttons.
		buttonEls: null
	};

	this.config = {};
	var prop;
	for (prop in this.defaultConfig_) {
		if (this.defaultConfig_.hasOwnProperty(prop)) {
			this.config[prop] = this.defaultConfig_[prop];
		}
	}

	for (prop in userConfig) {
		if (userConfig.hasOwnProperty(prop) &&
			this.defaultConfig_.hasOwnProperty(prop)) {
			this.config[prop] = userConfig[prop];
		}
	}

	var nullLogger = {log: function(){}};
	this.logger_ = logger || nullLogger;

	// An array of promises that need to be resolved before we
	// can start the flow.
	this.flowPromises_ = [];

	this.domToImage_ = new DomToImage(
		this.config.styleEl);
};

WebVRShowAndTell.prototype.init = function() {
	this.setupLoading_();

	this.setupRenderer_();
	this.setupScene_();
	this.setupLights_();
	this.setupCamera_();
	
	this.setupVRManager_();
	this.setupMainObject_();
	this.setupSkybox_();
	
	this.setupFlow_();
	this.setupGazeInput_();

	this.animate_();

	Promise.all(this.flowPromises_).then(
		// Once all files are loaded, proceed to start the S&T.
		this.start.bind(this)
	);
};

WebVRShowAndTell.prototype.setupLoading_ = function() {
	this.loadingManager = new THREE.LoadingManager();
	this.loadingManager.onProgress = (function(item, loaded, total) {
	  this.logger_.log("Loading progress:", item, loaded, total);
	}).bind(this);

	this.imageLoader = new THREE.ImageLoader(this.loadingManager);
	this.objLoader = new THREE.OBJLoader(this.loadingManager);
};

WebVRShowAndTell.prototype.setupRenderer_ = function() {
	this.renderer = new THREE.WebGLRenderer({antialias: true});
	this.renderer.setPixelRatio(window.devicePixelRatio);
	document.body.appendChild(this.renderer.domElement);
};

WebVRShowAndTell.prototype.setupScene_ = function() {
	this.scene = new THREE.Scene();
};

WebVRShowAndTell.prototype.setupLights_ = function() {
	var ambient = new THREE.AmbientLight(0x101030);
	this.scene.add(ambient);

	var directionalLight = new THREE.DirectionalLight(0xffeedd);
	directionalLight.position.set(0, 0, 1);
	this.scene.add(directionalLight);
};

WebVRShowAndTell.prototype.setupCamera_ = function() {
	this.camera = new THREE.PerspectiveCamera(
		75, window.innerWidth / window.innerHeight, 0.1, 10000);
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
	this.VRManager = new WebVRManager(this.renderer, this.effect,
		{hideButton: false});
};

WebVRShowAndTell.prototype.progressTracker_ = function(xhr) {
	if (xhr.lengthComputable) {
		var percentComplete = xhr.loaded / xhr.total * 100;
		this.logger_.log(Math.round(percentComplete, 2) + '% downloaded');
	}	
};

WebVRShowAndTell.prototype.setupMainObject_ = function() {
	// Loading texture
	this.objTexture = new THREE.Texture();
	this.flowPromises_.push(new Promise((function(resolve, reject) {
		var onError = function(xhr) {
			this.logger_.log("Could not load model texture:",
				this.config.modelTexture);
			reject();
		};	
		var onSuccess = function(image) {
			this.objTexture.image = image;
			this.objTexture.needsUpdate = true;
			resolve();
		};
		this.imageLoader.load(this.config.modelTexture,	onSuccess.bind(this),
			this.progressTracker_.bind(this), onError.bind(this));
	}).bind(this)));

	// Loading model
	this.flowPromises_.push(new Promise((function(resolve, reject) {
		var onError = function(xhr) {
			this.logger_.log("Could not load model file:",
				this.config.modelPath);
			reject();
		};
		var onSuccess = function(object) {
		    this.mainObject = object;
		    this.mainObject.traverse((function(child) {
		      if (child instanceof THREE.Mesh) {
		        child.material.map = this.objTexture;
		      }
		    }).bind(this));
		    this.mainObject.position.set(0, -.5, -1);
		    this.mainObject.scale.set(.005, .005, .005);
		    this.scene.add(this.mainObject);
			resolve();
		};
		this.objLoader.load(this.config.modelPath, onSuccess.bind(this),
			this.progressTracker_.bind(this), onError.bind(this));	
	}).bind(this)));
};

WebVRShowAndTell.prototype.setupSkybox_ = function() {
	if (this.config.skyBoxTexture) {		
		this.skyBoxTexture = new THREE.Texture();
		this.flowPromises_.push(new Promise((function(resolve, reject) {
			var onError = function(xhr) {
				this.logger_.log("Could not load skybox texture:",
					this.config.skyBoxTexture);
				reject();
			};	
			var onSuccess = function(image) {
				this.skyBoxTexture.image = image;
				this.skyBoxTexture.needsUpdate = true;
				if (this.config.skyBoxRepeat) {
					this.skyBoxTexture.wrapS = THREE.RepeatWrapping;
					this.skyBoxTexture.wrapT = THREE.RepeatWrapping;
					this.skyBoxTexture.repeat.set(
						this.config.skyBoxRepeat,this.config.skyBoxRepeat);
				}

				var boxWidth = this.config.skyBoxWidth;
				var geometry = new THREE.BoxGeometry(boxWidth, boxWidth,
					boxWidth);

				var material = new THREE.MeshBasicMaterial({
				  map: this.skyBoxTexture,
				  color: 0x01BE00,
				  side: THREE.BackSide
				});

				var skybox = new THREE.Mesh(geometry, material);
				this.scene.add(skybox);

				resolve();
			};
			this.imageLoader.load(this.config.skyBoxTexture,
				onSuccess.bind(this), this.progressTracker_.bind(this),
				onError.bind(this));
		}).bind(this)));
	}
};

WebVRShowAndTell.prototype.setupFlow_ = function() {
	this.flow_ = new Flow(this.config.stepEls, this.config.buttonEls,
		this.scene, this.renderer, this.domToImage_, this.logger_);
	window.flow = this.flow_;
};

/**
 * This is WIP, but the goal is to enable gaze-based input for Cardboard.
 */
WebVRShowAndTell.prototype.setupGazeInput_ = function(timestamp) {
	this.renderer.domElement.addEventListener('click', (function(event) {
		var vector = new THREE.Vector3();
		var raycaster = new THREE.Raycaster();
		// This checks for intersections with the center of the window.
		vector.set(0, 0, 0.5);  // z = 0.5 important!
		vector.unproject(this.camera);
		raycaster.set(this.camera.position,
			vector.sub(this.camera.position).normalize());
		var interactiveObjects = this.flow_.getInteractiveObjects();

		for (var i = 0, l = interactiveObjects.length; i < l; i++) {
			var interactiveObject = interactiveObjects[i];
			var mesh = interactiveObject.getMesh();
			if (!mesh) {
				continue;
			}

			var intersects = raycaster.intersectObject(mesh, true);
			if (intersects.length > 0) {
				interactiveObject.onGazeActivation();
			}
		}
	}).bind(this));
};

WebVRShowAndTell.prototype.animate_ = function(timestamp) {
  this.controls.update();

  this.VRManager.render(this.scene, this.camera, timestamp);

  requestAnimationFrame(this.animate_.bind(this));	
};

WebVRShowAndTell.prototype.start = function() {
	this.logger_.log('Starting show-and-tell');

	this.flow_.renderCurrent();
}