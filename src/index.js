var WebVRShowAndTell = require("./webvr-showandtell");

var showAndTell = new WebVRShowAndTell({
    modelPath: 'models/male02.obj',
    modelTexture: 'models/UV_Grid_Sm.jpg',
    stepEls: document.getElementsByTagName('li'),
    styleEl: document.getElementById('webvr-showandtell-style'),
    buttonEls: document.getElementById('webvr-showandtell-buttons').getElementsByTagName('button')
}, console);
showAndTell.init();
