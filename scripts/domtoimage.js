var DomToImage = function(styleEl) {
	this.style = styleEl.innerHTML || "";

	/* Clever hackery inspired by
	  https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas */
	this.SVG_TEMPLATE_ = '<svg xmlns="http://www.w3.org/2000/svg" width="res" height="res"><foreignObject class="svg-content" width="$width" height="$height"><style>$style</style><div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%">$content</div></foreignObject></svg>';
	this.DOMURL_ = window.URL || window.webkitURL || window;
}

DomToImage.prototype.renderImage = function(containerEl, res, img, onReady) {
	var res = containerEl.getAttribute('data-res');
	var width = containerEl.getAttribute('data-width');
	var height = containerEl.getAttribute('data-height');
	var data = (this.SVG_TEMPLATE_.
		replace('$res', res).
		replace('$width', width).
		replace('$height', height).
		replace('$style', this.style).
		replace('$content', containerEl.innerHTML));
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
