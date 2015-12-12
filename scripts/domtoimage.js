var DomToImage = function(styleEl) {
	this.style = styleEl.innerHTML || "";

	/* Clever hackery inspired by
	  https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Drawing_DOM_objects_into_a_canvas */
	this.SVG_TEMPLATE_ = '<svg xmlns="http://www.w3.org/2000/svg" width="$width" height="$height"><foreignObject class="svg-content" width="100%" height="100%"><style>$style</style><div xmlns="http://www.w3.org/1999/xhtml" style="width:100%; height:100%">$content</div></foreignObject></svg>';
	this.DOMURL_ = window.URL || window.webkitURL || window;
}

DomToImage.prototype.renderImage = function(containerEl, onReady) {
	var data = (this.SVG_TEMPLATE_.
		replace('$width', containerEl.getAttribute('data-width')).
		replace('$height', containerEl.getAttribute('data-height')).
		replace('$style', this.style).
		replace('$content', containerEl.innerHTML));
	var svg = new Blob([data], {type: 'image/svg+xml;charset=utf-8'});
	var url = this.DOMURL_.createObjectURL(svg);

	var img = document.createElement('img');
	img.onload = (function() {
		onReady(img);
		this.DOMURL_.revokeObjectURL(url);
	}).bind(this);
	img.src = url;	
};
