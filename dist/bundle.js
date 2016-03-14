/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};

/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {

/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId])
/******/ 			return installedModules[moduleId].exports;

/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			exports: {},
/******/ 			id: moduleId,
/******/ 			loaded: false
/******/ 		};

/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);

/******/ 		// Flag the module as loaded
/******/ 		module.loaded = true;

/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}


/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;

/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;

/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";

/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })
/************************************************************************/
/******/ ([
/* 0 */
/***/ function(module, exports, __webpack_require__) {

	'use strict';

	var WebVRShowAndTell = __webpack_require__(1);

	var showAndTell = new WebVRShowAndTell({
	    modelPath: 'models/male02.obj',
	    modelTexture: 'models/UV_Grid_Sm.jpg',
	    stepEls: document.getElementsByTagName('li'),
	    styleEl: document.getElementById('webvr-showandtell-style'),
	    buttonEls: document.getElementById('webvr-showandtell-buttons').getElementsByTagName('button')
	}, console);
	showAndTell.init();

/***/ },
/* 1 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var DomToImage = __webpack_require__(2);
	var Flow = __webpack_require__(3);

	var WebVRShowAndTell = function WebVRShowAndTell(userConfig, logger) {
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
			if (userConfig.hasOwnProperty(prop) && this.defaultConfig_.hasOwnProperty(prop)) {
				this.config[prop] = userConfig[prop];
			}
		}

		var nullLogger = { log: function log() {} };
		this.logger_ = logger || nullLogger;

		// An array of promises that need to be resolved before we
		// can start the flow.
		this.flowPromises_ = [];

		this.domToImage_ = new DomToImage(this.config.styleEl);
	};

	WebVRShowAndTell.prototype.init = function () {
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
		this.start.bind(this));
	};

	WebVRShowAndTell.prototype.setupLoading_ = function () {
		this.loadingManager = new THREE.LoadingManager();
		this.loadingManager.onProgress = function (item, loaded, total) {
			this.logger_.log("Loading progress:", item, loaded, total);
		}.bind(this);

		this.imageLoader = new THREE.ImageLoader(this.loadingManager);
		this.objLoader = new THREE.OBJLoader(this.loadingManager);
	};

	WebVRShowAndTell.prototype.setupRenderer_ = function () {
		this.renderer = new THREE.WebGLRenderer({ antialias: true });
		this.renderer.setPixelRatio(window.devicePixelRatio);
		document.body.appendChild(this.renderer.domElement);
	};

	WebVRShowAndTell.prototype.setupScene_ = function () {
		this.scene = new THREE.Scene();
	};

	WebVRShowAndTell.prototype.setupLights_ = function () {
		var ambient = new THREE.AmbientLight(0x101030);
		this.scene.add(ambient);

		var directionalLight = new THREE.DirectionalLight(0xffeedd);
		directionalLight.position.set(0, 0, 1);
		this.scene.add(directionalLight);
	};

	WebVRShowAndTell.prototype.setupCamera_ = function () {
		this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 10000);
	};

	WebVRShowAndTell.prototype.setupVRManager_ = function () {
		this.controls = new THREE.VRControls(this.camera);
		window.addEventListener('keydown', function onKey(event) {
			if (event.keyCode == 90) {
				// z
				this.controls.resetSensor();
			}
		}.bind(this), true);

		this.effect = new THREE.VREffect(this.renderer);
		this.effect.setSize(window.innerWidth, window.innerHeight);
		this.VRManager = new WebVRManager(this.renderer, this.effect, { hideButton: false });
	};

	WebVRShowAndTell.prototype.progressTracker_ = function (xhr) {
		if (xhr.lengthComputable) {
			var percentComplete = xhr.loaded / xhr.total * 100;
			this.logger_.log(Math.round(percentComplete, 2) + '% downloaded');
		}
	};

	WebVRShowAndTell.prototype.setupMainObject_ = function () {
		// Loading texture
		this.objTexture = new THREE.Texture();
		this.flowPromises_.push(new Promise(function (resolve, reject) {
			var onError = function onError(xhr) {
				this.logger_.log("Could not load model texture:", this.config.modelTexture);
				reject();
			};
			var onSuccess = function onSuccess(image) {
				this.objTexture.image = image;
				this.objTexture.needsUpdate = true;
				resolve();
			};
			this.imageLoader.load(this.config.modelTexture, onSuccess.bind(this), this.progressTracker_.bind(this), onError.bind(this));
		}.bind(this)));

		// Loading model
		this.flowPromises_.push(new Promise(function (resolve, reject) {
			var onError = function onError(xhr) {
				this.logger_.log("Could not load model file:", this.config.modelPath);
				reject();
			};
			var onSuccess = function onSuccess(object) {
				this.mainObject = object;
				this.mainObject.traverse(function (child) {
					if (child instanceof THREE.Mesh) {
						child.material.map = this.objTexture;
					}
				}.bind(this));
				this.mainObject.position.set(0, -.5, -1);
				this.mainObject.scale.set(.005, .005, .005);
				this.scene.add(this.mainObject);
				resolve();
			};
			this.objLoader.load(this.config.modelPath, onSuccess.bind(this), this.progressTracker_.bind(this), onError.bind(this));
		}.bind(this)));
	};

	WebVRShowAndTell.prototype.setupSkybox_ = function () {
		if (this.config.skyBoxTexture) {
			this.skyBoxTexture = new THREE.Texture();
			this.flowPromises_.push(new Promise(function (resolve, reject) {
				var onError = function onError(xhr) {
					this.logger_.log("Could not load skybox texture:", this.config.skyBoxTexture);
					reject();
				};
				var onSuccess = function onSuccess(image) {
					this.skyBoxTexture.image = image;
					this.skyBoxTexture.needsUpdate = true;
					if (this.config.skyBoxRepeat) {
						this.skyBoxTexture.wrapS = THREE.RepeatWrapping;
						this.skyBoxTexture.wrapT = THREE.RepeatWrapping;
						this.skyBoxTexture.repeat.set(this.config.skyBoxRepeat, this.config.skyBoxRepeat);
					}

					var boxWidth = this.config.skyBoxWidth;
					var geometry = new THREE.BoxGeometry(boxWidth, boxWidth, boxWidth);

					var material = new THREE.MeshBasicMaterial({
						map: this.skyBoxTexture,
						color: 0x01BE00,
						side: THREE.BackSide
					});

					var skybox = new THREE.Mesh(geometry, material);
					this.scene.add(skybox);

					resolve();
				};
				this.imageLoader.load(this.config.skyBoxTexture, onSuccess.bind(this), this.progressTracker_.bind(this), onError.bind(this));
			}.bind(this)));
		}
	};

	WebVRShowAndTell.prototype.setupFlow_ = function () {
		this.flow_ = new Flow(this.config.stepEls, this.config.buttonEls, this.scene, this.renderer, this.domToImage_, this.logger_);
		window.flow = this.flow_;
	};

	/**
	 * This is WIP, but the goal is to enable gaze-based input for Cardboard.
	 */
	WebVRShowAndTell.prototype.setupGazeInput_ = function (timestamp) {
		this.renderer.domElement.addEventListener('click', function (event) {
			var vector = new THREE.Vector3();
			var raycaster = new THREE.Raycaster();
			// This checks for intersections with the center of the window.
			vector.set(0, 0, 0.5); // z = 0.5 important!
			vector.unproject(this.camera);
			raycaster.set(this.camera.position, vector.sub(this.camera.position).normalize());
			var interactiveObjects = this.flow_.getInteractiveObjects();

			for (var i = 0, l = interactiveObjects.length; i < l; i++) {
				var interactiveObject = interactiveObjects[i];
				var mesh = interactiveObject.getMesh();
				if (!mesh) {
					continue;
				}

				var intersects = raycaster.intersectObject(mesh, true);
				if (intersects.length > 0) {
					interactiveObject.activate();
				}
			}
		}.bind(this));
	};

	WebVRShowAndTell.prototype.animate_ = function (timestamp) {
		this.controls.update();

		this.VRManager.render(this.scene, this.camera, timestamp);

		requestAnimationFrame(this.animate_.bind(this));
	};

	WebVRShowAndTell.prototype.start = function () {
		this.logger_.log('Starting show-and-tell');

		this.flow_.renderCurrent();
	};

	module.exports = WebVRShowAndTell;

/***/ },
/* 2 */
/***/ function(module, exports) {

	'use strict';

	var DomToImage = function DomToImage(styleEl) {
		this.style = styleEl.innerHTML || "";

		/* Clever hackery inspired by
	   https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas */
		this.SVG_TEMPLATE_ = '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject class="svg-content" width="$width" height="$height"><style>$style</style><div class="webvr-showandtell-annotation" xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%">$content</div></foreignObject></svg>';
		this.DOMURL_ = window.URL || window.webkitURL || window;
	};

	DomToImage.prototype.renderImage = function (html, res, img, onReady) {
		var data = this.SVG_TEMPLATE_.replace('$width', res).replace('$height', res).replace('$style', this.style).replace('$content', html);
		var svg = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });

		var url = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(data);
		img.width = res;
		img.height = res;
		img.onload = function () {
			onReady(img);
			img.onload = null;
		}.bind(this);
		img.src = url;
	};

	module.exports = DomToImage;

/***/ },
/* 3 */
/***/ function(module, exports, __webpack_require__) {

	"use strict";

	var Button = __webpack_require__(4);
	var Step = __webpack_require__(5);

	var Flow = function Flow(stepEls, buttonEls, scene, threeRenderer, domToImage, logger) {
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
	};

	Flow.prototype.setupSteps_ = function (stepEls) {
		// Map containing all steps for this flow.
		var steps = {};
		for (var i = 0, l = stepEls.length; i < l; i++) {
			var el = stepEls[i];
			var name = el.getAttribute('data-name');
			if (i == 0) {
				// Start with the first step in the list.
				this.currentStepName_ = name;
			}
			steps[name] = new Step(i, el, name, this.scene_, this.threeRenderer_, this.domToImage_, this.logger_);
		};

		return steps;
	};

	Flow.prototype.setupButtons_ = function (buttonEls) {
		var back = new Button(buttonEls[0], 'back-button', this.goToPrevious.bind(this), this.scene_, this.threeRenderer_, this.domToImage_, this.logger_);

		var next = new Button(buttonEls[1], 'next-button', this.goToNext.bind(this), this.scene_, this.threeRenderer_, this.domToImage_, this.logger_);

		return {
			'back': back,
			'next': next
		};
	};

	Flow.prototype.getInteractiveObjects = function () {
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

	Flow.prototype.renderCurrent = function () {
		var currentStep = this.getCurrentStep();
		currentStep.render(this.imgs.annotation);
		this.renderButtons(currentStep);
	};

	Flow.prototype.clearCurrentStep = function () {
		this.getCurrentStep().clear();
	};

	Flow.prototype.getCurrentStep = function () {
		return this.steps_[this.currentStepName_];
	};

	Flow.prototype.getPreviousStep = function () {
		return this.steps_[this.getCurrentStep().getPreviousStepName()];
	};

	Flow.prototype.getNextStep = function () {
		return this.steps_[this.getCurrentStep().getNextStepName()];
	};

	Flow.prototype.goToPrevious = function () {
		this.logger_.log('goToPrevious');

		var previous = this.getPreviousStep();
		if (!previous) {
			this.logger_.log('No previous step');
			return;
		}

		this.clearCurrentStep();
		this.currentStepName_ = previous.getName();
		this.renderCurrent();
	};

	Flow.prototype.goToNext = function () {
		this.logger_.log('goToNext');

		var next = this.getNextStep();
		if (!next) {
			this.logger_.log('No next step');
			return;
		}
		this.clearCurrentStep();
		this.currentStepName_ = next.getName();
		this.renderCurrent();
	};

	Flow.prototype.renderButtons = function (currentStep) {
		if (this.getPreviousStep()) {
			this.buttons_.back.show();
			this.buttons_.back.render(this.imgs.backButton, currentStep);
		} else {
			this.buttons_.back.hide();
		}
		if (this.getNextStep()) {
			this.buttons_.next.show();
			this.buttons_.next.render(this.imgs.nextButton, currentStep);
		} else {
			this.buttons_.next.hide();
		}
	};

	module.exports = Flow;

/***/ },
/* 4 */
/***/ function(module, exports) {

	'use strict';

	var Button = function Button(el, name, clickCallback, scene, threeRenderer, domToImage, logger) {

		this.el_ = el;
		this.name_ = name;
		this.scene_ = scene;
		this.threeRenderer_ = threeRenderer;
		this.domToImage_ = domToImage;
		this.logger_ = logger;

		this.logger_.log('Creating show-and-tell button', this);

		this.el_.addEventListener('click', clickCallback);
	};

	Button.prototype.render = function (img, currentStep) {
		var res = this.el_.getAttribute('data-texture-res') || 256;

		this.img_ = img;
		this.domToImage_.renderImage(this.el_.innerHTML, res, img, this.onImgReady_.bind(this, currentStep));
	};

	Button.prototype.getMesh = function () {
		return this.mesh_;
	};

	Button.prototype.onImgReady_ = function (currentStep) {
		var currentAnnotationMesh = currentStep.getAnnotationMesh();
		this.logger_.log("Ready to update button image", this.img_.src, currentAnnotationMesh);

		var width = .2;
		var height = .1;

		var texture = new THREE.Texture();
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;

		// Stretch the texture to accomodate for non-square aspect ratio.
		texture.repeat.set(1, height / width);
		texture.offset.set(0, -height * 2);
		texture.needsUpdate = true;
		texture.image = this.img_;
		var material = new THREE.MeshBasicMaterial({
			map: texture
		});

		var geometry = new THREE.BoxGeometry(width, height,
		// Constant thickness.
		.01);

		this.mesh_ = new THREE.Mesh(geometry, material);
		this.mesh_.name = this.name_;

		// TODO: Use currentAnnotationMesh for position.
		this.mesh_.position.set(.0, .0, -.8);

		this.scene_.add(this.mesh_);
	};

	Button.prototype.getObjectByName = function () {
		return this.scene_.getObjectByName(this.name_);
	};

	Button.prototype.hide = function () {
		if (!this.mesh_) {
			return;
		}
		this.mesh_.visible = false;
	};

	Button.prototype.show = function () {
		if (!this.mesh_) {
			return;
		}
		this.mesh_.visible = true;
	};

	Button.prototype.activate = function () {
		this.logger_.log('activate', this);
		this.el_.dispatchEvent(new Event('click'));
	};

	module.exports = Button;

/***/ },
/* 5 */
/***/ function(module, exports) {

	'use strict';

	var Step = function Step(index, el, name, scene, threeRenderer, domToImage, logger) {
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

	Step.prototype.render = function (img) {
		this.logger_.log("Rendering step", this.name_);

		// This attribute controls the resolution of the texture.
		// Until this can be calculated, it will need to be adjusted
		// manually, depending on how far and how big the annotation is.
		var res = this.el_.getAttribute('data-texture-res') || 512;

		this.img_ = img;
		this.domToImage_.renderImage(this.el_.innerHTML, res, img, this.onImgReady_.bind(this));
	};

	Step.prototype.clear = function () {
		this.scene_.remove(this.scene_.getObjectByName(this.getAnnotationName()));
	};

	Step.prototype.onImgReady_ = function () {
		this.logger_.log("Ready to update annotation image", this.img_.src);

		var width = this.el_.getAttribute('data-annotation-width');
		var height = this.el_.getAttribute('data-annotation-height');

		var texture = new THREE.Texture();
		texture.wrapS = THREE.RepeatWrapping;
		texture.wrapT = THREE.RepeatWrapping;

		// Stretch the texture to accomodate for non-square aspect ratio.
		texture.repeat.set(1, height / width);
		texture.offset.set(0, -height * 2);
		texture.needsUpdate = true;
		texture.image = this.img_;
		var material = new THREE.MeshBasicMaterial({
			map: texture
		});

		var geometry = new THREE.BoxGeometry(width, height,
		// Constant thickness.
		.01);

		this.mesh_ = new THREE.Mesh(geometry, material);
		this.mesh_.name = this.getAnnotationName();
		this.mesh_.position.set(this.el_.getAttribute('data-annotation-x'), this.el_.getAttribute('data-annotation-y'), this.el_.getAttribute('data-annotation-z'));

		// Remove the previous annotation - if any.
		var current = this.getAnnotationMesh();
		if (current) {
			this.scene_.remove(current);
		}

		this.scene_.add(this.mesh_);
	};

	Step.prototype.getAnnotationMesh = function () {
		return this.scene_.getObjectByName(this.getAnnotationName());
	};

	Step.prototype.getAnnotationName = function () {
		return 'annotation' + this.index_;
	};

	Step.prototype.getName = function () {
		return this.name_;
	};

	Step.prototype.getPreviousStepName = function () {
		return this.el_.getAttribute('data-previous-step');
	};

	Step.prototype.getNextStepName = function () {
		return this.el_.getAttribute('data-next-step');
	};

	module.exports = Step;

/***/ }
/******/ ]);