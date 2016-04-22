(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);

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
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],2:[function(require,module,exports){
var DomToImage = function(styleEl) {
	this.style = styleEl.innerHTML || "";

	/* Clever hackery inspired by
	  https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas */
	this.SVG_TEMPLATE_ = '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject class="svg-content" width="$width" height="$height"><style>$style</style><div class="$class" xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%">$content</div></foreignObject></svg>';
	this.DOMURL_ = window.URL || window.webkitURL || window;
}

DomToImage.prototype.renderImage = function(html, className, res, img, onReady) {
	var data = (this.SVG_TEMPLATE_.
		replace('$class', className).
		replace('$width', res).
		replace('$height', res).
		replace('$style', this.style).
		replace('$content', html));
	var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});

	var url = "data:image/svg+xml;charset=utf-8," +
		encodeURIComponent(data);
	img.width = res;
	img.height = res;
	img.onload = (function() {
		onReady(img);
		img.onload = null;
	}).bind(this);
	img.src = url;	
};

module.exports = DomToImage;
},{}],3:[function(require,module,exports){
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
},{"./button":1,"./step":5}],4:[function(require,module,exports){
var WebVRShowAndTell = require("./webvr-showandtell");

var showAndTell = new WebVRShowAndTell({
    modelPath: 'models/male02.obj',
    modelTexture: 'models/UV_Grid_Sm.jpg',
    stepEls: document.getElementsByTagName('li'),
    styleEl: document.getElementById('webvr-showandtell-style'),
    buttonEls: document.getElementById('webvr-showandtell-buttons').getElementsByTagName('button')
}, console);
showAndTell.init();

},{"./webvr-showandtell":6}],5:[function(require,module,exports){
(function (global){
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);

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
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
(function (global){
var DomToImage = require("./domtoimage");
var Flow = require("./flow");
var THREE = (typeof window !== "undefined" ? window['THREE'] : typeof global !== "undefined" ? global['THREE'] : null);


// TODO: require a separate file, that I put together myself
// it will pull the files directly:
//

require("three/examples/js/loaders/OBJLoader");

var WebVRShowAndTell = function(userConfig, logger) {
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
	
	this.continuousRun = true;
	document.getElementById("run").addEventListener("click", (function() {
		this.continuousRun = true;
		document.getElementById("run").style.display = "none";
		document.getElementById("single-frame").style.display = "none";
		document.getElementById("pause").style.display = "initial";
		this.animate_();
	}).bind(this));
	document.getElementById("pause").addEventListener("click", (function() {
		this.continuousRun = false;
		document.getElementById("run").style.display = "initial";
		document.getElementById("single-frame").style.display = "initial";
		document.getElementById("pause").style.display = "none";
	}).bind(this));
	document.getElementById("single-frame").addEventListener("click", (function() {
		this.animate_();
		this.logger_.info("buttons", this.flow_.getButtons());
		this.logger_.info("scene", this.scene);
	}).bind(this));
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
		var interactiveObjects = this.flow_.getCurrentInteractiveObjects();

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
	}).bind(this));
};

WebVRShowAndTell.prototype.animate_ = function(timestamp) {
	this.controls.update();

	this.VRManager.render(this.scene, this.camera, timestamp);

	if (this.continuousRun) {
		requestAnimationFrame(this.animate_.bind(this));
	}
};

WebVRShowAndTell.prototype.start = function() {
	this.logger_.log('Starting show-and-tell');

	this.flow_.renderCurrent();
}

module.exports = WebVRShowAndTell;

}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./domtoimage":2,"./flow":3,"three/examples/js/loaders/OBJLoader":7}],7:[function(require,module,exports){
/**
 * @author mrdoob / http://mrdoob.com/
 */

THREE.OBJLoader = function ( manager ) {

	this.manager = ( manager !== undefined ) ? manager : THREE.DefaultLoadingManager;

};

THREE.OBJLoader.prototype = {

	constructor: THREE.OBJLoader,

	load: function ( url, onLoad, onProgress, onError ) {

		var scope = this;

		var loader = new THREE.XHRLoader( scope.manager );
		loader.setCrossOrigin( this.crossOrigin );
		loader.load( url, function ( text ) {

			onLoad( scope.parse( text ) );

		}, onProgress, onError );

	},

	setCrossOrigin: function ( value ) {

		this.crossOrigin = value;

	},

	parse: function ( text ) {

		console.time( 'OBJLoader' );

		var object, objects = [];
		var geometry, material;

		function parseVertexIndex( value ) {

			var index = parseInt( value );

			return ( index >= 0 ? index - 1 : index + vertices.length / 3 ) * 3;

		}

		function parseNormalIndex( value ) {

			var index = parseInt( value );

			return ( index >= 0 ? index - 1 : index + normals.length / 3 ) * 3;

		}

		function parseUVIndex( value ) {

			var index = parseInt( value );

			return ( index >= 0 ? index - 1 : index + uvs.length / 2 ) * 2;

		}

		function addVertex( a, b, c ) {

			geometry.vertices.push(
				vertices[ a ], vertices[ a + 1 ], vertices[ a + 2 ],
				vertices[ b ], vertices[ b + 1 ], vertices[ b + 2 ],
				vertices[ c ], vertices[ c + 1 ], vertices[ c + 2 ]
			);

		}

		function addNormal( a, b, c ) {

			geometry.normals.push(
				normals[ a ], normals[ a + 1 ], normals[ a + 2 ],
				normals[ b ], normals[ b + 1 ], normals[ b + 2 ],
				normals[ c ], normals[ c + 1 ], normals[ c + 2 ]
			);

		}

		function addUV( a, b, c ) {

			geometry.uvs.push(
				uvs[ a ], uvs[ a + 1 ],
				uvs[ b ], uvs[ b + 1 ],
				uvs[ c ], uvs[ c + 1 ]
			);

		}

		function addFace( a, b, c, d,  ua, ub, uc, ud, na, nb, nc, nd ) {

			var ia = parseVertexIndex( a );
			var ib = parseVertexIndex( b );
			var ic = parseVertexIndex( c );
			var id;

			if ( d === undefined ) {

				addVertex( ia, ib, ic );

			} else {

				id = parseVertexIndex( d );

				addVertex( ia, ib, id );
				addVertex( ib, ic, id );

			}

			if ( ua !== undefined ) {

				ia = parseUVIndex( ua );
				ib = parseUVIndex( ub );
				ic = parseUVIndex( uc );

				if ( d === undefined ) {

					addUV( ia, ib, ic );

				} else {

					id = parseUVIndex( ud );

					addUV( ia, ib, id );
					addUV( ib, ic, id );

				}

			}

			if ( na !== undefined ) {

				ia = parseNormalIndex( na );
				ib = parseNormalIndex( nb );
				ic = parseNormalIndex( nc );

				if ( d === undefined ) {

					addNormal( ia, ib, ic );

				} else {

					id = parseNormalIndex( nd );

					addNormal( ia, ib, id );
					addNormal( ib, ic, id );

				}

			}

		}

		// create mesh if no objects in text

		if ( /^o /gm.test( text ) === false ) {

			geometry = {
				vertices: [],
				normals: [],
				uvs: []
			};

			material = {
				name: ''
			};

			object = {
				name: '',
				geometry: geometry,
				material: material
			};

			objects.push( object );

		}

		var vertices = [];
		var normals = [];
		var uvs = [];

		// v float float float

		var vertex_pattern = /v( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;

		// vn float float float

		var normal_pattern = /vn( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;

		// vt float float

		var uv_pattern = /vt( +[\d|\.|\+|\-|e|E]+)( +[\d|\.|\+|\-|e|E]+)/;

		// f vertex vertex vertex ...

		var face_pattern1 = /f( +-?\d+)( +-?\d+)( +-?\d+)( +-?\d+)?/;

		// f vertex/uv vertex/uv vertex/uv ...

		var face_pattern2 = /f( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+))?/;

		// f vertex/uv/normal vertex/uv/normal vertex/uv/normal ...

		var face_pattern3 = /f( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))( +(-?\d+)\/(-?\d+)\/(-?\d+))?/;

		// f vertex//normal vertex//normal vertex//normal ...

		var face_pattern4 = /f( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))( +(-?\d+)\/\/(-?\d+))?/;

		//

		var lines = text.split( '\n' );

		for ( var i = 0; i < lines.length; i ++ ) {

			var line = lines[ i ];
			line = line.trim();

			var result;

			if ( line.length === 0 || line.charAt( 0 ) === '#' ) {

				continue;

			} else if ( ( result = vertex_pattern.exec( line ) ) !== null ) {

				// ["v 1.0 2.0 3.0", "1.0", "2.0", "3.0"]

				vertices.push(
					parseFloat( result[ 1 ] ),
					parseFloat( result[ 2 ] ),
					parseFloat( result[ 3 ] )
				);

			} else if ( ( result = normal_pattern.exec( line ) ) !== null ) {

				// ["vn 1.0 2.0 3.0", "1.0", "2.0", "3.0"]

				normals.push(
					parseFloat( result[ 1 ] ),
					parseFloat( result[ 2 ] ),
					parseFloat( result[ 3 ] )
				);

			} else if ( ( result = uv_pattern.exec( line ) ) !== null ) {

				// ["vt 0.1 0.2", "0.1", "0.2"]

				uvs.push(
					parseFloat( result[ 1 ] ),
					parseFloat( result[ 2 ] )
				);

			} else if ( ( result = face_pattern1.exec( line ) ) !== null ) {

				// ["f 1 2 3", "1", "2", "3", undefined]

				addFace(
					result[ 1 ], result[ 2 ], result[ 3 ], result[ 4 ]
				);

			} else if ( ( result = face_pattern2.exec( line ) ) !== null ) {

				// ["f 1/1 2/2 3/3", " 1/1", "1", "1", " 2/2", "2", "2", " 3/3", "3", "3", undefined, undefined, undefined]

				addFace(
					result[ 2 ], result[ 5 ], result[ 8 ], result[ 11 ],
					result[ 3 ], result[ 6 ], result[ 9 ], result[ 12 ]
				);

			} else if ( ( result = face_pattern3.exec( line ) ) !== null ) {

				// ["f 1/1/1 2/2/2 3/3/3", " 1/1/1", "1", "1", "1", " 2/2/2", "2", "2", "2", " 3/3/3", "3", "3", "3", undefined, undefined, undefined, undefined]

				addFace(
					result[ 2 ], result[ 6 ], result[ 10 ], result[ 14 ],
					result[ 3 ], result[ 7 ], result[ 11 ], result[ 15 ],
					result[ 4 ], result[ 8 ], result[ 12 ], result[ 16 ]
				);

			} else if ( ( result = face_pattern4.exec( line ) ) !== null ) {

				// ["f 1//1 2//2 3//3", " 1//1", "1", "1", " 2//2", "2", "2", " 3//3", "3", "3", undefined, undefined, undefined]

				addFace(
					result[ 2 ], result[ 5 ], result[ 8 ], result[ 11 ],
					undefined, undefined, undefined, undefined,
					result[ 3 ], result[ 6 ], result[ 9 ], result[ 12 ]
				);

			} else if ( /^o /.test( line ) ) {

				geometry = {
					vertices: [],
					normals: [],
					uvs: []
				};

				material = {
					name: ''
				};

				object = {
					name: line.substring( 2 ).trim(),
					geometry: geometry,
					material: material
				};

				objects.push( object )

			} else if ( /^g /.test( line ) ) {

				// group

			} else if ( /^usemtl /.test( line ) ) {

				// material

				material.name = line.substring( 7 ).trim();

			} else if ( /^mtllib /.test( line ) ) {

				// mtl file

			} else if ( /^s /.test( line ) ) {

				// smooth shading

			} else {

				// console.log( "THREE.OBJLoader: Unhandled line " + line );

			}

		}

		var container = new THREE.Object3D();

		for ( var i = 0, l = objects.length; i < l; i ++ ) {

			object = objects[ i ];
			geometry = object.geometry;

			var buffergeometry = new THREE.BufferGeometry();

			buffergeometry.addAttribute( 'position', new THREE.BufferAttribute( new Float32Array( geometry.vertices ), 3 ) );

			if ( geometry.normals.length > 0 ) {

				buffergeometry.addAttribute( 'normal', new THREE.BufferAttribute( new Float32Array( geometry.normals ), 3 ) );

			}

			if ( geometry.uvs.length > 0 ) {

				buffergeometry.addAttribute( 'uv', new THREE.BufferAttribute( new Float32Array( geometry.uvs ), 2 ) );

			}

			material = new THREE.MeshLambertMaterial();
			material.name = object.material.name;

			var mesh = new THREE.Mesh( buffergeometry, material );
			mesh.name = object.name;

			container.add( mesh );

		}

		console.timeEnd( 'OBJLoader' );

		return container;

	}

};

},{}]},{},[4]);
