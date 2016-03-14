var DomToImage = function(styleEl) {
	this.style = styleEl.innerHTML || "";

	/* Clever hackery inspired by
	  https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas */
	this.SVG_TEMPLATE_ = '<svg xmlns="http://www.w3.org/2000/svg"><foreignObject class="svg-content" width="$width" height="$height"><style>$style</style><div class="webvr-showandtell-annotation" xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%">$content</div></foreignObject></svg>';
	this.DOMURL_ = window.URL || window.webkitURL || window;
}

DomToImage.prototype.renderImage = function(html, res, img, onReady) {
	var data = (this.SVG_TEMPLATE_.
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