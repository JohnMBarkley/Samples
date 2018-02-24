//Authored by John Barkley, Sizmek, Inc. 2016.
//Updated 5/30/17

SizmekScroller.INTERACTION = 'scrollerInteraction'
SizmekScroller.READY = 'scrollerReady';
SizmekScroller.SCROLL_START = 'scrollStart';
SizmekScroller.SCROLL_COMPLETE = 'scrollEnd';
SizmekScroller.ITEM_CLICK = 'scrollerItemClick'

SizmekScroller.VERTICAL = 'vertical';
SizmekScroller.HORIZONTAL = 'horizontal';

function SizmekScroller(containerID, columns, rows){
	this.container = document.getElementById(containerID);
	this.columns = (columns !== undefined)? columns : 1;
	this.rows = (rows !== undefined)? rows : 1;
	this.visibleItems = this.rows * this.columns;
	this.VorH = this.scrollHorV = SizmekScroller.HORIZONTAL;
	this.itemMultiplier = this.scrollDirection = 1;
	this.initIndex = this.totalItems = this.baseIndex = this.demoInterval = this.vertSpacer = this.horSpacer = 0
	this.scrollTime = .5;
	this.ready = this.scrolling = this.useFadeTransitions = this.resizing = this.duplicateItems = false;
	this.demoStopped = this.dispatchScrollingEvents = true;
	this.prevButton, this.nextButton, this.tweenOptions;
	this.container.style.overflow = this.container.style.visibility = 'hidden';
	this.scrollIncrement;
	
	Sizmek.registerBoundFunctionReferences(this);
	window.addEventListener('resize', this.containerResizeHandler.bind(this))
	this.container.addEventListener('resize', this.containerResizeHandler.bind(this))
	
	if(this.container.getAttribute('data-src')){
		this.buildItems(this.container.getAttribute('data-src'));
		this.container.removeAttribute('data-src');
	}
}

SizmekScroller.prototype.buildItems = function(items){
	while (this.container.firstChild) {
		this.container.removeChild(this.container.firstChild);
	}
	
	this.itemArray = [];
	this.imageArray = [];
	this.visibleItemsArray = [];
	this.lastVisibleItemsArray = [];
	this.container.style.visibility = 'hidden';
	this.totalItems = this.baseIndex = 0;
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
		
		n = (this.imageArray.length > 0? this.imageArray.length : this.itemArray.length);
		if(this.initIndex > n - 1)this.initIndex = n - 1;
		
		for(var i = 0; i < n; i++){			
			if(this.imageArray.length > 0){
				a = document.createElement('div')
				a.setAttribute('data-src', this.imageArray[i]);
				a.classList.add('scrollerImage');
				this.itemArray[i] = a;
			} else {
				a = this.itemArray[i];
			}
			
			if(a.id == undefined || a.id == '')a.id = 'item'+i;
			a.style.position = 'absolute';
			a.style.transformOrigin = "0 0"
			a.classList.add('scrollerItem');
			if(this.container.classList.contains('retina'))a.classList.add('retina');
			a.positionIndex = i;
			a.addEventListener('click', this.itemClickHandlerBind)
			this.container.appendChild(a)
		}
				
		if(this.duplicateItems)this.itemMultiplier = 2;
		if(this.itemMultiplier > 1)this.buildDuplicateItems();		
		this.totalItems = this.itemArray.length;
		
		Sizmek.loadImagesByClass('scrollerImage', this.init.bind(this));
	}
}

SizmekScroller.prototype.init = function(){	
	this.setRowsAndColumns(this.rows, this.columns)	
	this.ready = true;
		
	if(this.initIndex > 0){
		this.dispatchScrollingEvents = false;
		this.scrollToIndex(this.initIndex, false, 0)
	}
	
	TweenMax.to('#'+this.container.id, .5, {autoAlpha:1, delay:.25});
	Sizmek.dispatch(this, SizmekScroller.READY);
}

SizmekScroller.prototype.containerResizeHandler = function(){
	this.resizing = true;
	this.positionAllItems();
	this.resizing = false;
}

SizmekScroller.prototype.positionAllItems = function(time){
	if(time === undefined)time = -1;
	this.visibleItemsArray = [];
	this.compareVisibleAndTotalItems();

	for(var i = 0; i < this.totalItems; i++){
		this.positionItem(i);
	}	
		
	if(time > -1)this.animateAllItems(time);
	this.sortVisibleItems()
}

SizmekScroller.prototype.positionItem = function(i){
	var d = this.itemArray[i];
			
	if(this.resizing || (d.positionIndex < this.visibleItems)){
		d.column = d.positionIndex % this.columns//Math.floor(d.positionIndex / this.rows);
		d.row = d.positionIndex % this.rows;
							
		this.vertSpacer = Math.round((this.container.offsetHeight - (this.rows * d.offsetHeight)) / (this.rows + 1))
		this.horSpacer = Math.round((this.container.offsetWidth - (this.columns * d.offsetWidth)) / (this.columns + 1))	
		
		d.style.left = ((d.column * (d.offsetWidth + this.horSpacer)) + this.horSpacer) + 'px';
		d.style.top = ((d.row * (d.offsetHeight + this.vertSpacer)) + this.vertSpacer) + 'px';
		d.style.visibility = 'inherit';
		
		if(d.positionIndex < this.visibleItems){
			this.visibleItemsArray[i] = d;
		} else {
			d.style.visibility = 'hidden'
		}
	} else if(!this.ready){
		if(this.scrollHorizontal()){
			d.style.left = this.container.offsetWidth + 'px';
		}else {
			d.style.top = this.container.offsetHeight + 'px';
		}
	}
}

SizmekScroller.prototype.animateAllItems = function(time){
	if(time === undefined)time = 0;
			
	for(var i = 0; i < this.totalItems; i++){
		this.animateItem(i, time);
	}
}

SizmekScroller.prototype.animateItem = function(i, time){
	var d = this.itemArray[i];
		
	if(time > 0){		
		if(this.visibleItemsArray.indexOf(d) > -1 && this.lastVisibleItemsArray.indexOf(d) == -1){
			this.showItem(d, this.scrollDirection, time);
		} else if(this.visibleItemsArray.indexOf(d) == -1 && this.lastVisibleItemsArray.indexOf(d) > -1){
			this.hideItem(d, this.scrollDirection, time);
		}
	}
}
				  
SizmekScroller.prototype.buildDuplicateItems = function(){
	if(this.itemMultiplier < 2)this.itemMultiplier = 2;
	var t = this.totalItems;
	var n = (this.itemMultiplier) * t;
	for(var i = t; i < n; i++){
		var a = this.itemArray[i] = this.itemArray[i % t].cloneNode(true);
		a.id = 'item' + (i);
		a.positionIndex = i;
		a.addEventListener('click', this.itemClickHandlerBind)
		this.container.appendChild(a)
	}
	
	this.totalItems = this.itemArray.length;
}

SizmekScroller.prototype.scrollItems = function(dir, time){
	if(this.scrolling && !this.resizing)return;
	if(dir === undefined)dir = 1;
	if(time === undefined)time = this.scrollTime;
	if(this.dotNav)this.dotNav.disable();
	this.scrolling = true;
	this.scrollDirection = dir;	
		
	for(var i = 0; i < this.scrollIncrement; i++){
		this.baseIndex -= 1*dir
	
		if(this.baseIndex > this.totalItems - 1){
			this.baseIndex = 0;
		}else if(this.baseIndex < 0){
			this.baseIndex = this.totalItems - 1;
		}
		
		for(n = 0; n < this.totalItems; n++){
			var d = this.itemArray[n]
			d.positionIndex += dir
		
			if(d.positionIndex > this.totalItems - 1){
				d.positionIndex = 0;
			}else if(d.positionIndex < 0){
				d.positionIndex = this.totalItems - 1;
			}
		}
	}
		
	if(this.dispatchScrollingEvents)Sizmek.dispatch(this, SizmekScroller.SCROLL_START)
		
	this.positionAllItems(time);
	setTimeout(alertScrollingComplete.bind(this), this.scrollTime*1000 - 10)
		
	function alertScrollingComplete(){
		this.scrolling = false;
		this.dispatchScrollingEvents = true;
		if(this.dotNav)this.dotNav.enable();
	}
}

SizmekScroller.prototype.sortVisibleItems = function(){			
	for(var i = 0; i < this.totalItems; i++){
		this.lastVisibleItemsArray[i] = this.visibleItemsArray[i];
	}		
}

SizmekScroller.prototype.hideItem = function(element, dir, time){
	if(time === undefined)time = this.scrollTime;
	var plusMinus = (dir >  0)? '+=' : '-=';
	var o = {autoAlpha:(this.useFadeTransitions ? 0 : 1)};

	if(this.scrollHorizontal()){
		o.left = plusMinus + this.container.offsetWidth;
	}else{
		o.top = plusMinus + this.container.offsetHeight;
	}
	
	if(this.tweenOptions){
		for(var property in this.tweenOptions){
			o[property] = this.tweenOptions[property]
		}
	}
	
	TweenMax.to(element, time, o);
}

SizmekScroller.prototype.showItem = function(element, dir, time){
	if(time === undefined)time = this.scrollTime;
	var plusMinus = (dir < 0)? '+=' : '-=';
	var o = {autoAlpha:(this.useFadeTransitions ? 0 : 1), onComplete:this.alertScrollComplete.bind(this)};

	if(this.scrollHorizontal()){
		o.left = plusMinus + this.container.offsetWidth;
	}else{
		o.top = plusMinus + this.container.offsetHeight;
	}
	
	if(this.tweenOptions){
		for(var property in this.tweenOptions){
			o[property] = this.tweenOptions[property]
		}
	}

	TweenMax.from(element, time, o);
}

SizmekScroller.prototype.setRowsAndColumns = function(rows, columns){
	if(this.ready && this.rows == rows && this.columns == columns)return;
	this.columns = columns;
	this.rows = rows;
	this.visibleItems = this.scrollIncrement = this.rows * this.columns;
			
	if(this.totalItems < this.visibleItems){
		if(this.rows == 1){
			this.columns = this.totalItems;
		}else if(this.columns == 1){
			this.rows = this.totalItems;
		} else {
			
		}
	} else if(this.scrollIncrement > this.totalItems * .5 && this.totalItems > 1){
		this.buildDuplicateItems();
	}
	
	this.visibleItems = this.scrollIncrement = this.rows * this.columns;
			
	this.containerResizeHandler();	
}

SizmekScroller.prototype.itemClickHandler = function(e){
	this.stopDemo();
	if(this.scrolling)return;
		
	var p = this.getScrollerItem(e.target)
	var i = this.itemArray.indexOf(p);
	if(this.itemMultiplier > 1)i = i % (this.totalItems/this.itemMultiplier)
	Sizmek.dispatch(this, SizmekScroller.ITEM_CLICK, i)
}


SizmekScroller.prototype.compareVisibleAndTotalItems = function(){
	this.visibleItems = this.rows * this.columns;
	
	if(this.prevButton)this.prevButton.style.display = (this.totalItems <= this.visibleItems)? 'none' : 'inherit';
	if(this.nextButton)this.nextButton.style.display = (this.totalItems <= this.visibleItems)? 'none' : 'inherit'; 
}

SizmekScroller.prototype.alertScrollComplete = function(){
	if(this.duplicateItems)this.baseIndex = this.baseIndex % (this.totalItems * .5)
	if(this.dispatchScrollingEvents)Sizmek.dispatch(this, SizmekScroller.SCROLL_COMPLETE, this.baseIndex)
}

SizmekScroller.prototype.setNextButton = function(elementID){
	this.nextButton = document.getElementById(elementID)
	this.nextButton.addEventListener('click', this.next.bind(this))
	this.nextButton.style.visibility = 'inherit';
	this.nextButton.style.visibility = 'block';
	this.nextButton.style.opacity = 1;
}

SizmekScroller.prototype.setPrevButton = function(elementID){
	this.prevButton = document.getElementById(elementID)
	this.prevButton.addEventListener('click', this.previous.bind(this))
	this.prevButton.style.visibility = 'inherit';
	this.prevButton.style.visibility = 'block';
	this.prevButton.style.opacity = 1;
}

SizmekScroller.prototype.enableSwiping = function(){
	var self = this;
	
	if(self.ready){
		enable();
	}else{
		Sizmek.listen(this, SizmekScroller.READY, enable)
	}
	
	function enable(){
		if(typeof SizmekSwiper === 'undefined'){
			Sizmek.log("Please include 'SizmekSwiper.js' in your html header.")
			return;
		}

		var d = document.createElement('div');
		d.id = 'swipeTarget'		
		d.style.width = d.style.height = '100%'
		d.style.zIndex = '0'
		self.container.appendChild(d);
		
		self.swiper = new SizmekSwiper(self.container.id, self.VorH);
				
		Sizmek.listen(self.swiper, (self.scrollHorizontal()? SizmekSwiper.LEFT : SizmekSwiper.DOWN), self.nextBind);
		Sizmek.listen(self.swiper, (self.scrollHorizontal()? SizmekSwiper.RIGHT : SizmekSwiper.UP), self.previousBind);
		
		Sizmek.unlisten(self, SizmekScroller.READY, enable)
	}
}

SizmekScroller.prototype.scrollHorizontal = function(){
	return (this.VorH == SizmekScroller.HORIZONTAL && this.scrollHorV == SizmekScroller.HORIZONTAL)
}

SizmekScroller.prototype.buildDotNav = function(elementID, startIndex){
	if(this.ready){
		if(typeof SizmekDotNav === 'undefined'){
			Sizmek.log("Please include 'SizmekDotNav.js' in your html header.")
			return;
		}
		
		this.dotNav = new SizmekDotNav(elementID, this.totalItems, startIndex)
		Sizmek.listen(this.dotNav, SizmekDotNav.INDEX_CHANGE, this.dotChangeHandler.bind(this))
		Sizmek.listen(this, SizmekScroller.SCROLL_START, this.dotChangeHandler.bind(this))
	}else{
		setTimeout(function(){this.buildDotNav(elementID, startIndex)}.bind(this), 100);
	}	
}

SizmekScroller.prototype.dotChangeHandler = function(e){
	switch(e.type){
		case SizmekScroller.SCROLL_START:
			this.dotNav.selectIndex(this.baseIndex)
			break;
		case SizmekDotNav.INDEX_CHANGE:
			this.scrollToIndex(e.data);
			this.onInteractionHandler();
			break;
	}
}

SizmekScroller.prototype.next = function(e){
	if(this.scrolling)return;
	this.scrollItems(-1)
	if(e)this.onInteractionHandler();
	Sizmek.log('Next_Arrow');
	EB.userActionCounter('Next_Arrow');
}

SizmekScroller.prototype.previous = function(e){
	if(this.scrolling)return;
	this.scrollItems(1)
	if(e)this.onInteractionHandler();
	Sizmek.log('Previous_Arrow');
	EB.userActionCounter('Previous_Arrow');
}

SizmekScroller.prototype.onInteractionHandler = function(){
	this.stopDemo();
	Sizmek.pin();
	Sizmek.dispatch(this, SizmekScroller.INTERACTION)
}

SizmekScroller.prototype.scrollToIndex = function(i, userInitiated, time){
	if(userInitiated === undefined)userInitiated = false;
	if(time === undefined)time = this.scrollTime;
	var increment = this.scrollIncrement;
	var d = this.baseIndex - i;
	if(d == 0) return;
	this.scrollIncrement = Math.abs(d);		
	this.scrollItems((d < 0)? -1 : 1, time);
	this.scrollIncrement = increment;
	if(userInitiated)this.onInteractionHandler();
}

SizmekScroller.prototype.startDemo = function(demoLength, delay){
	if(this.ready){
		this.demoLength = (demoLength == undefined)? Math.round(this.totalItems/this.visibleItems) : demoLength
		this.demoDelay = (delay === undefined)? 3 : delay;
		this.demoStopped = false;
		this.demoCount = 0;

		this.resumeDemo();
		Sizmek.unlisten(this, SizmekScroller.READY)
	} else {
		Sizmek.listen(this, SizmekScroller.READY, function(){this.startDemo(demoLength, delay)}.bind(this))
	}
}

SizmekScroller.prototype.demo = function(){
	if(this.demoLength == 0 || this.demoCount < this.demoLength){
		this.scrollItems(-1);
	} else {
		this.stopDemo();
	}
	this.demoCount ++;
}

SizmekScroller.prototype.resumeDemo = function(){
	this.demoInterval = setInterval(this.demo.bind(this), this.demoDelay * 1000)
	this.demoStopped = false;
}

SizmekScroller.prototype.stopDemo = function(){
	clearInterval(this.demoInterval)
	this.demoStopped = true;
}

SizmekScroller.prototype.getScrollerItem = function(el) {
	if (el.positionIndex !== undefined)return el;
	
    while (el.parentNode) {
        el = el.parentNode;
        if (el.positionIndex !== undefined)return el;
    }
    return null;
}