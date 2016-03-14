# SETUP
- use webpack w/ babel to package everything
- update index.html to use the bundle

# SERVING
- figureo out how to serve from github



# TODO
- add next/prev buttons:
	- build the render function
	- see what can be abstracted into a parent object between button and step
- display them at the bottom of the current annotation when necessary
	- maybe a simple parenting plus local offset is enough


- Flesh out the gaze input system: 
	- need a list of 3d objects that react to gaze
	- detect "collision" of window center with all of them
	- fire events when that happens
	- for each frame where the collision with an object is true, increment a counter, and represent the counter visually. Place the object in the list of currently "colliding".
	- for each object in the list, if the collision is not happening anymore, decrement the counter and update representation
	- when the counter reaches a limit, tell the manage. A second step would be to fire a DOM event on the equivalent object in the dom (possibly build a parallel between the real DOM - all hidden - and things rendered in canvas: have events in the canvas correspond to events in the DOM. That would provide a fallback for a11y users).
