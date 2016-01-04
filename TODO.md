# TODO
- stretch the textures vertically?
	problem: we set the dimensions of the SVG manually (we have to).
	=> we lose the ability to have fluid content.
	Maybe render the steps offscreen once on init, to determine the dimensions and aspect ratio (x and y, not width and height).
- add next/prev buttons.
- display them at the bottom of the current annotation when necessary


- Flesh out the gaze input system: 
	- need a list of 3d objects that react to gaze
	- detect "collision" of window center with all of them
	- fire events when that happens
	- for each frame where the collision with an object is true, increment a counter, and represent the counter visually. Place the object in the list of currently "colliding".
	- for each object in the list, if the collision is not happening anymore, decrement the counter and update representation
	- when the counter reaches a limit, tell the manage. A second step would be to fire a DOM event on the equivalent object in the dom (possibly build a parallel between the real DOM - all hidden - and things rendered in canvas: have events in the canvas correspond to events in the DOM. That would provide a fallback for a11y users).
