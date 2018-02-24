//Authored by John Barkley, Sizmek, Inc. 2016.
//Updated 5/30/17

SizmekCarousel.VERTICAL = 'vertical';
SizmekCarousel.HORIZONTAL = 'horizontal';
SizmekCarousel.READY = 'carouselReady';
SizmekCarousel.SPIN_START = 'spinStart';
SizmekCarousel.SPIN_COMPLETE = 'spinComplete';
SizmekCarousel.ITEM_CLICK = 'carouselItemClick';

function SizmekCarousel(containerID){
	this.container = document.getElementById(containerID);
	this.dispatcher = document.createElement('div');
	this.container.style.overflow = 'visible';
	this.VorH = SizmekCarousel.HORIZONTAL;
	this.spinCount = this.index = this.baseIndex = this.scaleOffset = this.radianOffset = this.radians = this.visibleItems = this.totalItems = 0;
	this.spinning = this.duplicateItems = this.ready = this.blurItems = false;
	this.spinOnItemClick = this.demoStopped = true;
	this.perspective = this.depth = .25;
	this.itemMultiplier = this.scaleMultiplier = 1;
	this.blurMultiplier = 12;
	this.radius = 100;
	this.itemArray = [];
	this.imageArray = [];
	this.positionArray = [];
	this.visiblePositionsArray = [];
	this.activeItem, this.demoInterval;
	this.container.style.visibility = 'hidden';
	Sizmek.registerBoundFunctionReferences(this);
	
	if(this.container.getAttribute('data-src')){		
		this.buildItems(this.container.getAttribute('data-src'));
		this.container.removeAttribute('data-src');
	}
}

SizmekCarousel.prototype.buildItems = function(items){
	var n = 0, a, img;

	while (this.container.firstChild) {
		this.container.removeChild(this.container.firstChild);
	}
	
	this.container.style.visibility = 'hidden';
	this.baseIndex = this.totalItems = 0;
	this.ready = false;
	
	setTimeout(build.bind(this), 10)
	
	function build(){
		if(items != undefined){
			if(typeof items == 'string'){
				if(items.indexOf('|') > -1){
					this.imageArray = items.split('|');
				}else if(items.indexOf(',') > -1){
					this.imageArray = items.split(',');
				} else {
					this.imageArray = [items];
				}
			} else if(items.constructor === Array){
				if(items[0].tagName !== undefined){
					this.itemArray = items;
				}else if(items[0].indexOf('.jpg') > -1 || items[0].indexOf('.png') > -1 || items[0].indexOf('.gif') > -1){
					this.imageArray = items;
				}
			}
		}
		
		a = (this.imageArray.length > 0? this.imageArray : this.itemArray);
		n = a.length;
		//a .reverse();
		//a.unshift(a.pop())

		for(i = 0; i < n; i++){
			if(this.imageArray.length > 0){
				a = document.createElement('div');
				img = document.createElement('div');
				img.setAttribute('data-src', this.imageArray[i]);
				img.classList.add('carouselImage', 'carouselImg');
				a.appendChild(img);
				this.itemArray[i] = a;
			} else {
				a = this.itemArray[i];
			}

			a.id = 'item'+i;
			a.style.position = 'absolute';
			a.style.transformOrigin = "0 0"
			a.classList.add('carouselItem');
			a.positionIndex = i;
			this.positionArray[i] = a;
			a.style.overflow = 'visible';
			a.style.width = a.style.height = '1px';
			a.addEventListener('click', this.itemClickHandlerBind);
			this.container.appendChild(a)
		}
		
		if(this.duplicateItems && this.itemMultiplier == 1)this.itemMultiplier = 2;
		if(this.itemMultiplier > 1)this.buildDuplicateItems();
		this.totalItems = this.itemArray.length;

		if(this.visibleItems == 0){
			this.visibleItems = this.totalItems;
		} else {
			var n = Math.round((this.visibleItems)*.5)
			for(i=0; i < n; i++){
				this.visiblePositionsArray.push(i);
				if(i > 0)this.visiblePositionsArray.push(this.totalItems - i);
			}	
		}
		
		if(this.totalItems == 1)this.blurItems = false;
		this.radIncrement = Sizmek.roundNumber(Math.PI * (2/this.totalItems), 4);
		
		Sizmek.loadImagesByClass('carouselImage', this.initBind);
	}
}

SizmekCarousel.prototype.init = function(){
	this.setScaleOffset()
	this.setRadianOffset();
	this.updatePositions();	
	
	this.activeItem = this.itemArray[0];
	this.ready = true;
	TweenMax.to('#'+this.container.id, .5, {autoAlpha:1, delay:.25});
	Sizmek.dispatch(this, SizmekCarousel.READY);
}

SizmekCarousel.prototype.spin = function(direction, time){
	if(this.spinning)return;
	if(this.demoStopped)Sizmek.pin();
	if(direction == undefined)direction = 1;
	if(time == undefined)time = .5;
	this.spinning = true;
	this.spinCount += direction;
		
	for (i = 0; i < this.totalItems; i++) {
		var a = this.itemArray[i]
		a.positionIndex -= direction
		a.positionIndex = a.positionIndex % this.totalItems;
		if(a.positionIndex < 0)a.positionIndex = this.totalItems + a.positionIndex;
		this.positionArray[a.positionIndex] = a
		a.style.transition = a.style.webkitTransition = a.style.mozTransition = 'opacity '+time+'s'
	}
		
	TweenMax.to(this, time, {
        radians: Sizmek.roundNumber(this.spinCount * Math.PI * (2/this.totalItems), 4),
        onUpdate: this.updatePositionsBind,
        ease: Quad.easeOut,
		onComplete: this.spinCompleteHandlerBind
    });
	
	this.index = this.baseIndex = (this.spinCount < 0)? ((this.totalItems - Math.abs(this.spinCount % this.totalItems)) % this.totalItems) : this.spinCount % this.totalItems;
	this.baseIndex = this.index % (this.totalItems/this.itemMultiplier)
	this.activeItem = this.itemArray[this.baseIndex];

	Sizmek.dispatch(this, SizmekCarousel.SPIN_START, this.baseIndex);
}

SizmekCarousel.prototype.updatePositions = function() {
	r = s = newX = newY = 0;
    for (i = 0; i < this.totalItems; i++) {
		r = this.getRadianValue(i)
		
		switch(this.VorH){
			case SizmekCarousel.HORIZONTAL:
				s = Sizmek.roundNumber(this.scaleOffset + 1 - (1 - Math.sin(r)) * this.depth, 4)
				newX = Math.round(Math.cos(r) * this.radius)
				newY = Math.round(Math.sin(r) * this.radius * this.perspective)
				break;
			case SizmekCarousel.VERTICAL:
				s = Sizmek.roundNumber(this.scaleOffset + 1 - (1 - Math.cos(r)) * this.depth, 4)
				newX = Math.round(Math.cos(r) * this.radius * this.perspective)
				newY = Math.round(Math.sin(r) * this.radius)
		}
		
		this.itemArray[i].style.zIndex = Math.round(s*this.totalItems);
		TweenMax.set(this.itemArray[i], {scale: s * this.scaleMultiplier});
		if(this.blurItems)TweenMax.set(this.itemArray[i], {webkitFilter:"blur(" + Math.round(this.blurMultiplier*(1 - (s * this.scaleMultiplier))) + "px)"});	
		
		this.itemArray[i].style.left = newX +'px';
		this.itemArray[i].style.top = newY +'px';
				
		if(this.visibleItems < this.totalItems){
			this.itemArray[i].style.opacity = (this.visiblePositionsArray.indexOf(this.itemArray[i].positionIndex) > -1)? 1 : 0;
		}
    }
}

SizmekCarousel.prototype.itemClickHandler = function(e){
	this.stopDemo();
	if(this.spinning)return;
	var p = this.getSizmekCarouselItem(e.target)
	
	if(this.spinOnItemClick && p.positionIndex != 0){
		this.spinToIndex(this.itemArray.indexOf(p))
	} else {
		var i = this.itemArray.indexOf(p);
		if(this.itemMultiplier > 1)i = i % (this.totalItems/this.itemMultiplier)
		Sizmek.dispatch(this, SizmekCarousel.ITEM_CLICK, i)
	}
}

SizmekCarousel.prototype.spinToIndex = function(i){	
	var moves = i - this.index;
	if(Math.abs(moves) > this.totalItems * .5){
		moves = (moves < 0)? moves + this.totalItems : moves - this.totalItems;
	}
	
	this.spin(moves, .5)
}

SizmekCarousel.prototype.getRadianValue = function(itemIndex){
	return Sizmek.roundNumber((this.totalItems - itemIndex + 1) * this.radIncrement + this.radians + this.radianOffset, 4)
}

SizmekCarousel.prototype.spinCompleteHandler = function(){
	this.spinning = false;	
	if(this.blurItems)TweenMax.set(this.positionArray[0], {webkitFilter:"blur(0px)"})
	Sizmek.dispatch(this, SizmekCarousel.SPIN_COMPLETE, this.baseIndex)
}

SizmekCarousel.prototype.buildDuplicateItems = function(){
	t = this.itemArray.length
	n = (this.itemMultiplier) * t;
	for(i = t; i < n; i++){
		a = this.itemArray[i] = this.itemArray[i % t].cloneNode(true);
		a.id = 'item' + (i);
		a.positionIndex = i;
		a.addEventListener('click', this.itemClickHandlerBind);
		this.positionArray[i] = a;
		this.container.appendChild(a)
	}
}

SizmekCarousel.prototype.next = function(e){
	if(this.spinning)return;
	this.spin(1)
	if(e)this.onInteractionHandler();
	Sizmek.log('Next_Arrow');
	EB.userActionCounter('Next_Arrow');
}

SizmekCarousel.prototype.previous = function(e){
	if(this.spinning)return;
	this.spin(-1)
	if(e)this.onInteractionHandler();
	Sizmek.log('Previous_Arrow');
	EB.userActionCounter('Previous_Arrow');
}

SizmekCarousel.prototype.onInteractionHandler = function(){
	Sizmek.pin();
	this.stopDemo();
}

SizmekCarousel.prototype.setRadianOffset = function(){
	this.radianOffset = (this.VorH == SizmekCarousel.HORIZONTAL? 1.57 : 0) - this.getRadianValue(0)
}

SizmekCarousel.prototype.setScaleOffset = function(){
	this.scaleOffset = 1 - Sizmek.roundNumber(1 - (1 - Math.sin(this.radIncrement + this.radians)) * this.depth, 4)
	this.updatePositions();
}

SizmekCarousel.prototype.setNextButton = function(id){
	this.nextButton = document.getElementById(id);
	this.nextButton.addEventListener('click', this.nextBind);
}

SizmekCarousel.prototype.setPrevButton = function(id){
	this.prevButton = document.getElementById(id);
	this.prevButton.addEventListener('click', this.previousBind);
}

SizmekCarousel.prototype.enableSwiping = function(swipeAreaWidth, swipeAreaHeight){
	var self = this;
	
	if(self.ready){
		enable();
	}else{
		Sizmek.listen(this, SizmekCarousel.READY, enable)
	}
	
	function enable(){
		if(typeof SizmekSwiper === 'undefined'){
			Sizmek.log("Please include 'SizmekSwiper.js' in your html header.")
			return;
		}

		var d = document.createElement('div');
		d.id = 'swipeTarget'		
		d.style.width = swipeAreaWidth +'px'
		d.style.height = swipeAreaHeight +'px'
		d.style.left = (-.5 * parseInt(d.style.width)) + 'px'
		d.style.top = (-.5 * parseInt(d.style.height)) + 'px'
		d.style.zIndex = '0'
		d.style.position = 'absolute';
		self.container.appendChild(d);
		
		self.swiper = new SizmekSwiper(self.container.id, self.VorH);
				
		Sizmek.listen(self.swiper, (self.VorH == SizmekCarousel.HORIZONTAL? SizmekSwiper.LEFT : SizmekSwiper.DOWN), self.previousBind);
		Sizmek.listen(self.swiper, (self.VorH == SizmekCarousel.HORIZONTAL? SizmekSwiper.RIGHT : SizmekSwiper.UP), self.nextBind);
		
		Sizmek.unlisten(self, SizmekCarousel.READY, enable)
	}
}

SizmekCarousel.prototype.buildDotNav = function(elementID, startIndex){
	if(this.ready){
		if(typeof SizmekDotNav === 'undefined'){
			Sizmek.log("Please include 'SizmekDotNav.js' in your html header.")
			return;
		}
		if(startIndex === undefined)startIndex = 0;
		this.dotNav = new SizmekDotNav(elementID, this.totalItems, startIndex)
		Sizmek.listen(this.dotNav, SizmekDotNav.INDEX_CHANGE, this.dotChangeHandler.bind(this))
		Sizmek.listen(this, SizmekCarousel.SPIN_START, this.dotChangeHandler.bind(this));
	}else{
		setTimeout(function(){this.buildDotNav(elementID, startIndex)}.bind(this), 100);
	}	
}

SizmekCarousel.prototype.dotChangeHandler = function(e){
	switch(e.type){
		case SizmekCarousel.SPIN_START:
			this.dotNav.selectIndex(this.index)
			break;
		case SizmekDotNav.INDEX_CHANGE:
			this.spinToIndex(e.data);
			this.onInteractionHandler();
			break;
	}
}

SizmekCarousel.prototype.startDemo = function(demoLength, delay){
	this.demoLength = (demoLength == undefined)? this.totalItems : demoLength
	this.demoDelay = (delay === undefined)? 3 : delay;
	this.demoStopped = false;
	this.demoCount = 0;
	
	Sizmek.log('SizmekCarousel Demo: Repeat '+ this.demoLength +' times.  Every '+ this.demoDelay +' seconds.');
		
	this.resumeDemo();
}

SizmekCarousel.prototype.demo = function(){
	if(this.demoLength == 0 || this.demoCount < this.demoLength){
		this.spin(1);
	} else {
		this.stopDemo();
	}
	this.demoCount ++;
}

SizmekCarousel.prototype.resumeDemo = function(){
	this.demoInterval = setInterval(this.demo.bind(this), this.demoDelay * 1000)
	this.demoStopped = false;
}

SizmekCarousel.prototype.stopDemo = function(){
	if(!this.demoStopped)Sizmek.log('SizmekCarousel Demo Stopped.');
	clearInterval(this.demoInterval)
	this.demoStopped = true;
}

SizmekCarousel.prototype.getSizmekCarouselItem = function(el) {
	if (el.positionIndex !== undefined)return el;
	
    while (el.parentNode) {
        el = el.parentNode;
        if (el.positionIndex !== undefined)return el;
    }
    return null;
}