//Authored by John Barkley, Sizmek, Inc. 2016.
//Updated 5/30/17

SizmekDotNav.INDEX_CHANGE = 'indexChange';

function SizmekDotNav(containerID, numDots, initIndex){
	if(numDots <= 0 || numDots === undefined)console.log('SizmekDotNav: Second parameter must be greater than 0.');
	if(initIndex === undefined)initIndex = 0;
	this.index = initIndex;
	this.dotsArray = [];
	this.container = document.getElementById(containerID);
	this.container.classList.add('dotNav');
	this.enabled = true;
	
	for(i = 0; i < numDots; i++){
		var dot = document.createElement('div');
		this.container.appendChild(dot);
		this.dotsArray.push(dot);
		dot.classList.add('dot');
		if(i == initIndex)dot.classList.add('current');
		dot.addEventListener('click', this.dotClickHandler.bind(this));
		dot.id = 'dot'+i
	}
	
	this.buildBaseStyles();
}

SizmekDotNav.prototype.enable = function(){
	this.enabled = true;
}

SizmekDotNav.prototype.disable = function(){
	this.enabled = false;
}

SizmekDotNav.prototype.dotClickHandler = function(e){
	if(!this.enabled)return;
	var i = this.dotsArray.indexOf(e.target);
	this.selectIndex(i, true);
	EB.userActionCounter('User_Dot_Selection');
}

SizmekDotNav.prototype.selectIndex = function(i, userInitiated){
	if(userInitiated === undefined)userInitiated = false;
	if(i !== this.index){
		this.dotsArray[this.index].classList.remove('current');
		this.dotsArray[i].classList.add('current');
		this.index = i;
		if(userInitiated)Sizmek.dispatch(this, SizmekDotNav.INDEX_CHANGE, i);
	}	
}

SizmekDotNav.prototype.buildBaseStyles = function(){
	var style = document.createElement('style');
	var head = document.head || document.getElementsByTagName('head')[0]
	var cssString = '.dotNav .dot{position: relative; display: inline-block; float: left; left:0px; top:0px; margin: 0 5px; width:10px; height:10px; cursor: pointer;'+
								'border-radius: 50%; text-indent: -999em; cursor: pointer; opacity: .5; transition: opacity 0.3s ease;'+
								'-moz-transition: opacity 0.3s ease; -webkit-transition: opacity 0.3s ease;}'+
					'.dotNav {width:auto; height:auto; white-space:nowrap;}'+
					'.dotNav .dot.current{opacity:1;}'+
					'.dotNav .dot:hover{opacity:.75;}'
	style.type = 'text/css';
	style.setAttribute('rel', 'stylesheet');
	if (style.styleSheet){
		style.styleSheet.cssText = cssString;
	} else {
		style.appendChild(document.createTextNode(cssString));
	}
	head.appendChild(style);
}