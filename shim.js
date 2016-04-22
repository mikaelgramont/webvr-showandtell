/**
 * Shoehorn THREE into a build system.
 */
module.exports = {
  '../js/vendor/three/three.js': { exports: 'THREE' },
  '../js/vendor/three/OBJLoader.js': { "depends": { "../js/vendor/three/three.js": null	} },
  '../js/vendor/three/VRControls.js': { "depends": { "../js/vendor/three/three.js": null } },
  '../js/vendor/three/VREffect.js': { "depends": { "../js/vendor/three/three.js": null } },
}