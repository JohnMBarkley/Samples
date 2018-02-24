//Authored by John Barkley, Sizmek, Inc. 2016.
//Updated 5/30/17

SizmekSwiper.LEFT = 'leftSwipe';
SizmekSwiper.RIGHT = 'rightSwipe';
SizmekSwiper.UP = 'upSwipe';
SizmekSwiper.DOWN = 'downSwipe';

SizmekSwiper.VERTICAL = 'vertical';
SizmekSwiper.HORIZONTAL = 'horizontal';

function SizmekSwiper(targetID, verticalOrHorizontal){
	if(verticalOrHorizontal === undefined)verticalOrHorizontal = SizmekSwiper.HORIZONTAL;
	this.startCoords =  {'x':-1, 'y':-1};
	this.movedDistance = {'x':-1, 'y':-1};
	this.swipeVorH = verticalOrHorizontal;
	this.minDistance = this.maxDistance = 30;
	this.timeLimit = 1000;
	this.timer = 0;
	this.timedOut = false;
	this.target = document.getElementById(targetID);
	Sizmek.registerBoundFunctionReferences(this);
	
	Sizmek.listen(document, 'mousedown touchstart', this.swipeEventHandlerBind);
}

SizmekSwiper.prototype.swipeEventHandler = function(e){
	switch(e.type){
		case 'mousedown': case 'touchstart':
			if(!this.childHasParent(e.target, this.target))return;
			Sizmek.listen(document, 'mouseup touchend', this.swipeEventHandlerBind);
			e = e ? e : window.event;
			e = ('changedTouches' in e)?e.changedTouches[0] : e;
			this.startCoords = {'x':e.pageX, 'y':e.pageY};
			this.startTimer();
			e.preventDefault();
			break;
		case 'mouseup': case 'touchend':
			Sizmek.unlisten(document, 'mouseup touchend', this.swipeEventHandlerBind);
		  	e = e ? e : window.event;
		  	e = ('changedTouches' in e)?e.changedTouches[0] : e;
			this.movedDistance = {'x':e.pageX - this.startCoords.x, 'y':e.pageY - this.startCoords.y};
									
			if(!this.timedOut && !(this.movedDistance.x == 0 && this.movedDistance.y == 0)){
				switch(this.swipeVorH){
					case SizmekSwiper.VERTICAL:
						if (Math.abs(this.movedDistance.y) >= this.minDistance && Math.abs(this.movedDistance.x) <= this.maxDistance){
							Sizmek.dispatch(this, (this.movedDistance.y < 0)? SizmekSwiper.DOWN : SizmekSwiper.UP)
							e.preventDefault();
						}
						break;
					case SizmekSwiper.HORIZONTAL:
						if (Math.abs(this.movedDistance.x) >= this.minDistance && Math.abs(this.movedDistance.y) <= this.maxDistance){
							Sizmek.dispatch(this, (this.movedDistance.x < 0)? SizmekSwiper.LEFT : SizmekSwiper.RIGHT)
							e.preventDefault()
						}
				}
			} else {
				e.target.style.visibility = 'hidden'
				Sizmek.dispatch(document.elementFromPoint(e.pageX, e.pageY), 'click')
				e.target.style.visibility = 'inherit'
			}
			
			clearInterval(this.timer);
	}
}

SizmekSwiper.prototype.childHasParent = function(el, parent) {
    while (el.parentNode) {
        el = el.parentNode;
        if (el === parent)return el;
    }
    return null;
}

SizmekSwiper.prototype.startTimer = function(){
	this.timedOut = false;
	clearInterval(this.timer)
	this.timer = setTimeout(this.swipeTimeoutHandlerBind, this.timeLimit);
}

SizmekSwiper.prototype.swipeTimeoutHandler = function(t){
	this.timedOut = true;
}