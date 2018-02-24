//Authored by John Barkley, Sizmek, Inc. 2016.
//Updated 11/27/17

Sizmek.testing = (window.location.protocol.indexOf('file') === 0 || String(window.location).indexOf('http://127.0.0.1:8887') === 0);
Sizmek.isExpPanel = Sizmek.ready = Sizmek.pinned = Sizmek.dataLoading = Sizmek.collapseTimeoutSet = false;
Sizmek.localFontFolder = 'fonts';
Sizmek.borderColor = 'black';
Sizmek.collapseTimeout = Sizmek.dataLoadTimeout = 0;

Sizmek.PAUSE_VIDEOS = 'pauseVideos';
Sizmek.READY = 'sizmekReady';
Sizmek.BASE_SCRIPTS = ['https://secure-ds.serving-sys.com/BurstingcachedScripts/libraries/greensock/1_18_0/TweenMax.min.js'];
Sizmek.LOGO_REPOSITORY = 'https://services.serving-sys.com/HostingServices/Creative/Logo_Repository/';
Sizmek.IMAGE_FIT_ARRAY = ['fit', 'fitLeft', 'fitRight', 'fitCenter', 'fitTop', 'fitBottom', 'fitTopRight', 'fitTopLeft', 'fitBottomRight', 'fitBottomLeft']
Sizmek.IMAGE_PROXY = 'http://gizmo.serving-sys.com/api/data/get/942?imagepath='

function Sizmek(){}

Sizmek.initAd = function(isExpPanel, onReadyHandler){
	if(onReadyHandler === undefined)onReadyHandler = function(){};
	if(isExpPanel === undefined)isExpPanel = false;
	Sizmek.isExpPanel = isExpPanel;
	Sizmek.listen(document, Sizmek.READY, onReadyHandler);
		
	if(Sizmek.isExpPanel){
		try{
			if(!Sizmek.pinned)el('panel').addEventListener('mouseleave', Sizmek.collapse)
			Sizmek.dimensions = el('panel').offsetWidth +'x'+ el('panel').offsetHeight;
			EB.initExpansionParams(0, 0, el('panel').offsetWidth, el('panel').offsetHeight);
		}catch(e){}
	} else {
		try{
			Sizmek.dimensions = el('banner').offsetWidth +'x'+ el('banner').offsetHeight;

		}catch(e){}		
	}

	if(navigator.onLine){
		Sizmek.loadMultipleScripts(Sizmek.BASE_SCRIPTS, Sizmek.scriptReadyHandler)
	}else{
		Sizmek.scriptReadyHandler();
	}	
}

Sizmek.scriptReadyHandler = function(){
	if(typeof adkit == 'object'){
		adkit.onReady(Sizmek.preloadImages);
	} else if(typeof EB == 'object'){
		if(!EB.isInitialized()) {
			EB.addEventListener(EBG.EventName.EB_INITIALIZED, Sizmek.preloadImages);
		} else {
			Sizmek.preloadImages()
		}
	} else if(navigator.onLine){
		Sizmek.log('Please include either "adkit.js" or "EBLoader.js" script in your HTML header.')
	} else {
		Sizmek.preloadImages();
	}
}

Sizmek.preloadImages = function(){
	Sizmek.loadImagesByClass('preload', Sizmek.alertReady)
}

Sizmek.alertReady = function(){
	Sizmek.ready = true;
	Sizmek.dispatch(document, Sizmek.READY, null, 100);
}

Sizmek.loadImagesByClass = function(className, onCompleteHandler, baseFolder) {
	baseFolder = (baseFolder === undefined)? '' : baseFolder + '/';
	if(onCompleteHandler === undefined)onCompleteHandler = function(){};
	var useAltRetinaImages = (window.devicePixelRatio >= 2)
	var nodeList = document.querySelectorAll('.'+className+'');
	var arr = [];
    var newImages = [];
    var loadedImages = 0;
	var img, n;
			
	if(nodeList.length == 0){
		onCompleteHandler();
		return;
	}

    for (i = 0; i < nodeList.length; i++) {
		imgSource = nodeList[i].getAttribute('data-src')
 		img = nodeList[i].nodeName == 'IMG'? nodeList[i] : new Image();
		img.crossOrigin = 'Anonymous';
        newImages.push(img);
		if(img.getAttribute('id') === null){
			if(nodeList[i].getAttribute('id') === null){
				img.id = className + i
			} else {
				img.id = nodeList[i].getAttribute('id') + '_img';
			}
		}
		
		if(nodeList[i].nodeName == 'DIV' && nodeList[i].children.length == 1 && nodeList[i].children[0].nodeName == 'IMG'){
			nodeList[i].removeChild(nodeList[i].firstChild);
		}
		
        if(imgSource !== null) {
			arr.push(nodeList[i])
			var folder = nodeList[i].classList.contains('shared')? 'assets/images/' : 'images/';
			if(imgSource.toLowerCase().indexOf('.gif') == imgSource.length - 4)imgSource +='?'+ new Date().getTime()
			if(imgSource.indexOf('http') != 0){
				imgSource = baseFolder + folder + imgSource
			}
			nodeList[i].useAltRetinaImages = (useAltRetinaImages && nodeList[i].classList.contains('retina'))
			if(nodeList[i].useAltRetinaImages){
				imgSource = imgSource.substring(0, imgSource.lastIndexOf('.')) + '@2x' + imgSource.substring(imgSource.lastIndexOf('.'), imgSource.length)
				nodeList[i].classList.remove('retina');
			}
						
			img.node = nodeList[i];
			img.addEventListener('load', imageLoadCompleteHandler);
        	img.addEventListener('error', imageLoadCompleteHandler);
			img.src = Sizmek.SSL(imgSource);
			nodeList[i].removeAttribute('data-src')
        }
    }
			
    function imageLoadCompleteHandler(e) {		
		var fit, cssString, img = e.target;
		var isSVG = (img.src.indexOf('.svg') == img.src.length - 4)
		
		loadedImages++;
						
		if(isSVG && img.node.getAttribute('class').indexOf('fit') == -1){
			img.node.classList.add('fit')
		}
		
		if(img.node.nodeName != 'IMG'){
			if(img.node.firstChild){
				img.node.insertBefore(img, img.node.firstChild);
			}else{
				img.node.appendChild(img);
			}
			
			if(img.node.getAttribute('class').indexOf('fit') > -1){
				for(n = 0; n < Sizmek.IMAGE_FIT_ARRAY.length; n++){
					if(img.node.classList.contains(Sizmek.IMAGE_FIT_ARRAY[n])){
						fit = Sizmek.IMAGE_FIT_ARRAY[n];
						break;
					}
				}
			}
			
			if(fit !== undefined){
				img.style.maxWidth = img.style.maxHeight = '100%'
				img.style.overflow = 'hidden'
				
				switch(fit){
					case 'fit': case 'fitCenter':
						img.style.top = img.style.left = '50%';
						img.style.transform = img.style.MozTransform = img.style.WebkitTransform = 'translate(-50%,-50%)';
						break;
					case 'fitLeft':
						img.style.top = '50%';
						img.style.left = '0px';
						img.style.transform = img.style.MozTransform = img.style.WebkitTransform = 'translateY(-50%)';
						break;
					case 'fitRight':
						img.style.top = '50%';
						img.style.right = '0px';
						img.style.transform = img.style.MozTransform = img.style.WebkitTransform = 'translateY(-50%)';
						break;
					case 'fitTop':
						img.style.left = '50%';
						img.style.top = '0px';
						img.style.transform = img.style.MozTransform = img.style.WebkitTransform = 'translateX(-50%)';
						break;
					case 'fitBottom':
						img.style.left = '50%';
						img.style.bottom = '0px';
						img.style.transform = img.style.MozTransform = img.style.WebkitTransform = 'translateX(-50%)';
						break;
					case 'fitTopLeft':
						img.style.top = img.style.left = '0px';
						break;
					case 'fitTopRight':
						img.style.top = img.style.right = '0px';
						break;
					case 'fitBottomRight':
						img.style.bottom = img.style.right = '0px';
						break;
					case 'fitBottomLeft':
						img.style.bottom = img.style.left = '0px';
						break;
				}
			} else if(!isSVG){
				var w = ((img.naturalWidth && img.naturalWidth > 0) ? img.naturalWidth : img.width)
				var h = ((img.naturalHeight && img.naturalHeight > 0) ? img.naturalHeight : img.height)
				
				if(img.node.useAltRetinaImages){
					TweenLite.set(img, {transformOrigin: '0% 0%', scaleX:.5, scaleY:.5});	
					img.node.style.width = w * .5 + 'px';
					img.node.style.height = h * .5 + 'px';
				} else {
					img.node.style.width = w + 'px';
					img.node.style.height = h + 'px';
				}
			}
		}
		
		if(isSVG)substituteSVG(img)
		img.style.position = 'absolute';
		img.style.pointerEvents = 'none';
		img.removeEventListener('load', imageLoadCompleteHandler);
        img.removeEventListener('error', imageLoadCompleteHandler);

        if(loadedImages == arr.length)onCompleteHandler(newImages);
    }
	
	function substituteSVG(img, data){
		Sizmek.loadData(img.src, 'xml', substitute)
		
		function substitute(data){
			img.node.innerHTML = data;
			svg = img.node.firstChild;
			if(img.id)svg.id = img.id;
			if(img.getAttribute('class'))svg.setAttribute('class', img.getAttribute('class'));
			if(svg.classList)svg.classList.add('replaced-svg')
			if(svg.removeAttribute)svg.removeAttribute('xmlns:a');
			if(svg.style){
				svg.style.position = 'absolute';
				svg.style.pointerEvents = 'none';
				svg.style.width = svg.style.height = '100%';
			}
			if(svg.setAttribute){
				svg.setAttribute('height', '100%')
				svg.setAttribute('width', '100%')
			}
		}
	}
}

Sizmek.cropImageBorder = function(image){
	var canvas = document.createElement('canvas'), imageData, data;
    var context = canvas.getContext("2d");
	var w = image.naturalWidth, h = image.naturalHeight;
	canvas.setAttribute('width', w)
	canvas.setAttribute('height', h)
	context.drawImage(image, 0, 0)

	imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    data = imageData.data;
       
	function isWhite(x, y) {
		var rgb =  {red:   data[(w * y + x) * 4], green: data[(w * y + x) * 4 + 1],  blue:  data[(w * y + x) * 4 + 2]};
		return rgb.red == 255 && rgb.green == 255 && rgb.blue == 255;
	}
	
    function scanY(fromTop) {
		var offset = fromTop ? 1 : -1;
		for(var y = fromTop ? 0 : h - 1; fromTop ? (y < h) : (y > -1); y += offset) {
			for(var x = 0; x < w; x++) {
				if (!isWhite(x, y))return y;                        

			}
		}
		return null;
	}
           
	function scanX(fromLeft) {
		var offset = fromLeft? 1 : -1;
		for(var x = fromLeft ? 0 : w - 1; fromLeft ? (x < w) : (x > -1); x += offset) {
			for(var y = 0; y < h; y++) {
				if (!isWhite(x, y))return x;                        
			}
		}
		return null;
	}
	var cropTop = scanY(true), cropBottom = scanY(false), cropLeft = scanX(true), cropRight = scanX(false), cropWidth = cropRight - cropLeft, cropHeight = cropBottom - cropTop;
    canvas.setAttribute('width', cropWidth);
    canvas.setAttribute('height', cropHeight);
   	context.drawImage(image, cropLeft, cropTop, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
	image.src = canvas.toDataURL();
}


Sizmek.loadData = function(url, dataType, onCompleteHandler){
	var xobj, data, dataLoadTimeout = setTimeout(dataLoadFailureHandler, 7000);	
	if(onCompleteHandler === undefined)onCompleteHandler = function(){};
	if(dataType === undefined)dataType = 'json';
	dataType = dataType.toLowerCase();
	Sizmek.dataLoading = true;
	url = Sizmek.SSL(Sizmek.sortURLVariables(url))
	
	if (window.XDomainRequest) { 
		xobj = new XDomainRequest();
	} else if (window.XMLHttpRequest) {
		xobj = new XMLHttpRequest();
	} else {
		xobj = new ActiveXObject('Microsoft.XMLHTTP');
	}
	
	
	xobj.onload = dataLoadCompleteHandler;
	xobj.onerror = dataLoadFailureHandler;
	xobj.open('GET', url, true);
	Sizmek.log('LOAD:', url)
	
	if (xobj.overrideMimeType){
		if(dataType == 'json'){
			xobj.overrideMimeType('application/json')
		} else {
			xobj.overrideMimeType("text/plain; charset=x-user-defined"); 
			xobj.setRequestHeader("Content-Type","text/plain");
		}
	}
	
	xobj.send(null);
	
	function dataLoadCompleteHandler(){
		Sizmek.dataLoading = false;
		switch(dataType){
			case 'json': 
				try{
					data = JSON.parse(xobj.responseText);
				} catch(e) {
					data = xobj.responseText;
				}
				break;
			case 'xml': 
				data = xobj.responseText;
				break;
		}
		
		xobj.onerror = xobj.onload = null;
		clearTimeout(dataLoadTimeout)
		onCompleteHandler(data);
	}
	
	function dataLoadFailureHandler(){
		xobj.onerror = xobj.onload = null;
		clearTimeout(dataLoadTimeout)
		onCompleteHandler('Data Load Error')
	}
}

Sizmek.sortURLVariables = function(url){
	if(url.indexOf('?') > -1){
		var v = url.split('?'), o = {}, a = [], b = v[0], v = v[1].split('&'), url = b +'?';
		for(i = 0; i < v.length; i++){
			s = v[i].split('=');
			o[s[0]] = s[1];
			a[i] = s[0]
		}
		a.sort();		
		for(i = 0; i < v.length; i++){
			url += ((i > 0? '&' : '')+ a[i] +'='+ o[a[i]]);
		}
	}
	return url;
}

Sizmek.loadDataWithVariableObject = function(baseURL, varObject, dataType, onCompleteHandler){
	Sizmek.loadData(baseURL + Sizmek.buildURLVarString(varObject), dataType, onCompleteHandler);
}

Sizmek.buildURLVarString = function(varObject){
	var varString = '';
	var i = 0;
	
	for(var property in varObject){
		varString += ((i == 0? '?' : '&') + property +'='+ varObject[property])
		i++;
	}
	
	return varString;
}

Sizmek.loadMultipleScripts = function(scriptsArray, scriptsLoadCompleteHandler){
	if(scriptsArray.constructor !== Array)scriptsArray = [scriptsArray];
	var scriptsLoaded = 0;
	
	for(var i = 0; i < scriptsArray.length; i++){
		Sizmek.loadScript(scriptsArray[i], scriptLoadCompleteHandler)
	}
	
	function scriptLoadCompleteHandler(){
		scriptsLoaded ++
		if(scriptsLoaded == scriptsArray.length){
			scriptsLoadCompleteHandler();
		}
	}
}

Sizmek.loadScript = function(url, onCompleteHandler){
	if(onCompleteHandler === undefined)onCompleteHandler = function(){};
	var script = document.createElement('script');
	script.type = 'text/javascript';
	script.onload = onCompleteHandler;
	script.src = Sizmek.SSL(url)
	document.getElementsByTagName('head')[0].appendChild(script);
}


Sizmek.loadStyleSheet = function(url, onCompleteHandler){
	if(onCompleteHandler === undefined)onCompleteHandler = function(){};
	var headTag = document.getElementsByTagName('head')[0];
	var linkTag = document.createElement('link');
	linkTag.onload = onCompleteHandler;
	linkTag.type = 'text/css';
	linkTag.rel = 'stylesheet';
	linkTag.href = Sizmek.SSL(url)
	headTag.insertBefore(linkTag, headTag.firstChild);
}

Sizmek.loadFonts = function(fileNames, onCompleteHandler){
	if(onCompleteHandler === undefined)onCompleteHandler = function(){};		
	if(typeof fileNames == 'string')fileNames = [fileNames]
	var fontsLoaded = 0;
	
	for(var i = 0; i < fileNames.length; i++){
		var f = new Font();
		f.src = (fileNames[i].indexOf('http:') == -1)? Sizmek.localFontFolder +'/'+ fileName : fileName;	
		f.onload = fontLoadCompleteHandler
	}
	
	function fontLoadCompleteHandler(e){
		fontsLoaded ++;
		if(fontsLoaded == fileNames.length){
			onCompleteHandler();
		}	
	}
}

Sizmek.trackClick = function(interactionName, url){
	(url && url.length > 0)? EB.clickthrough(interactionName, url) : EB.clickthrough(interactionName);
	Sizmek.log(interactionName);
}

Sizmek.trackAction = function(interactionName){
	Sizmek.log(interactionName);
	EB.userActionCounter(interactionName);
}

Sizmek.trackNoun = function(interactionName, nounString){
	try{
		var nounTracker = new Image();
		var baseURL = 'https://bs.serving-sys.com/BurstingPipe/adServer.bs?cn=tf&c=19&mc=imp&pli=16478984&PluID=0&ord=%time%&rtu=-1&pcp=$$';
		nounTracker.src = baseURL +'sID='+ EB._adConfig.sID + '|adID=' + EB._adConfig.adId + '|interactionName='+ interactionName +'|noun='+ nounString + '$$';
	}catch(e){
		//console.log(e)
	}
	Sizmek.log('NOUN: "'+ interactionName +'" = "'+ nounString +'"');
}

Sizmek.expand = function(e){
	Sizmek.log('Expand')
	EB.expand();
}

Sizmek.collapse = function(e){
	Sizmek.log('Collapse')
	EB.collapse();
	clearTimeout(Sizmek.collapseTimeout);
}

Sizmek.pin = function(){
	if(!Sizmek.pinned){
		try{
			el('panel').removeEventListener('mouseleave', Sizmek.collapse)
			Sizmek.pinned = true;
			Sizmek.log('Pin')
		}catch(e){}
	}
}

Sizmek.unpin = function(){
	if(Sizmek.pinned){
		try{
			el('panel').addEventListener('mouseleave', Sizmek.collapse)
			Sizmek.log('Unpin')
			Sizmek.pinned = false;
		}catch(e){}
	}
}

Sizmek.setAutoCollapse = function(delay){
	Sizmek.log('Auto-collapse in '+ delay +' seconds.');
	Sizmek.collapseTimeoutSet = true;
	Sizmek.collapseTimeout = setTimeout(Sizmek.collapse, delay*1000)
}

Sizmek.cancelAutoCollapse = function(){
	if(Sizmek.collapseTimeoutSet){
		Sizmek.log('Auto-collapse cancelled.');
		Sizmek.collapseTimeoutSet = false;
		clearTimeout(Sizmek.collapseTimeout);
	}
}

Sizmek.show = function(){
	if(Sizmek.ready){
		var body = document.getElementsByTagName('BODY')[0]
		var divs = body.querySelectorAll('div')
		var container;
				
		if(el('panel') !== null){
			container = el('panel');
		}else if(el('banner') !== null){
			container = el('banner');
		}
		
		var c = '#'+ container.id;
		var cssString = c +' {display: block; position: relative; overflow:hidden; border: solid 1px '+ Sizmek.borderColor +'; box-sizing: border-box; opacity: 0; top:0px; left:0px;}'+
						c +' span, '+ c +'.unselectable{pointer-events:none;}'+
						c +' .hidden{visibility:hidden; opacity:0;}'+
						c +' .center{top:50%; left:50%; transform:translate(-50%, -50%); -moz-transform:translate(-50%, -50%); -webkit-transform:translate(-50%, -50%);}'+
						c +' .centerHor{left:50%; transform:translateX(-50%); -moz-transform:translateX(-50%); -webkit-transform:translateX(-50%);}'+
						c +' .centerVert{top:50%; transform:translateY(-50%); -moz-transform:translateY(-50%); -webkit-transform:translateY(-50%);}';
					
		Sizmek.defineStyle(cssString);

		for(var i = 0; i < divs.length; i++){
			divs[i].style.position = 'absolute';
			divs[i].style.cursor = 'pointer';
			divs[i].style.userSelect = divs[i].style.MozUserSelect = divs[i].style.WebkitUserSelect = 'none';
		}
		
		TweenLite.to(container, .5, {autoAlpha:1});
		Sizmek.unlisten(document, Sizmek.READY, Sizmek.show)
	} else {
		Sizmek.listen(document, Sizmek.READY, Sizmek.show)
	}
}

Sizmek.listen = function(element, type, callback){
	Sizmek.changeListenerState(element, type, callback, true)
}

Sizmek.unlisten = function(element, type, callback){
	Sizmek.changeListenerState(element, type, callback, false)
}
		
Sizmek.changeListenerState = function(element, type, callback, add){
	var f = (add? 'addEventListener' : 'removeEventListener')
	if(typeof element == 'string' && element.indexOf(' ') > -1)element = element.split(' ');
	if(typeof type == 'string' && type.indexOf(' ') > -1)type = type.split(' ');
	if(element.constructor !== Array)element = [element]
	if(type.constructor !== Array)type = [type]
	
	for(i = 0; i < element.length; i++){
		for(n = 0; n < type.length; n++){
			if(typeof element[i] == 'string' && element[i].indexOf('#') == 0)element[i] = el(element[i].replace('#',''))
			Sizmek.getEventTarget(element[i])[f](type[n], callback, false);
		}
	}
}

Sizmek.dispatch = function(element, type, data, delay){
	var e = document.createEvent('Event');
	if(delay === undefined)delay = 0;
	if(data != undefined)e.data = data;
	
	if(delay == 0){
		dispatch()
	} else {
		setTimeout(dispatch, delay)
	}

	function dispatch(){
		e.initEvent(type, true, true);
		Sizmek.getEventTarget(element).dispatchEvent(e)
	}
}

Sizmek.getEventTarget = function(element){
	if(element instanceof HTMLElement || element == document){
		return element;
	}else if(typeof element.dispatcher == 'undefined'){
		element.dispatcher = document.createElement('div')
		element.dispatcher.style.display = 'none';
		return element.dispatcher;
	} else {
		return element.dispatcher;
	}
}

Sizmek.stopVideos = function(){
	Sizmek.dispatch(document, Sizmek.PAUSE_VIDEOS)
}

Sizmek.countOccurrences = function(string, subString, allowOverlapping){
    string+='', subString+='';
    if(subString.length<=0) return string.length+1;

    var n=0, pos=0;
    var step=allowOverlapping?1:subString.length;

    while(true){
        pos=string.indexOf(subString,pos);
        if(pos>=0){ ++n; pos+=step; } else break;
    }
    return n;
}

Sizmek.roundNumber = function(n, decimalPlaces, truncate) {
	var f = (truncate)? Math.floor : Math.round;	
	return f((n)*Math.pow(10, decimalPlaces))/Math.pow(10, decimalPlaces)
}

Sizmek.parseNum = function(str){
	return Number(str.match(/\d/g).join(''));
}

Sizmek.freezeAllGIFs = function(){
	[].slice.apply(document.images).filter(isGIF).map(Sizmek.freezeGIF);

	function isGIF(i) {
		return /^(?!data:).*\.gif/i.test(i.src);
	}
}

Sizmek.freezeGIF = function(image) {
    var c = document.createElement('canvas');
    c.width = image.width;
    c.height = image.height;
    c.getContext('2d').drawImage(image, 0, 0, c.width, c.height);
    try {
        image.src = c.toDataURL('image/gif');
    } catch(e) {
        for (var i = 0, a; a = image.attributes[i]; i++){
            c.setAttribute(a.name, a.value);
		}
        image.parentNode.replaceChild(c, image);
    }
}

Sizmek.setExpansionEvent = function(eventType){
	if(Sizmek.ready){
		if(eventType === undefined)eventType = 'mouseenter';
		try{
			if(EB.isMobileDevice())eventType = 'click';
		}catch(e){}
		
		try{
			var d = document.createElement('div');
			d.id = 'expandArea'
			d.style.position = 'absolute';
			d.style.width = d.style.height = '100%';
			d.style[(el('banner').offsetWidth > el('banner').offsetHeight * 1.5? 'right' : 'top')] = (eventType != 'click')? '40px' : '0px';			
			d.addEventListener(eventType, Sizmek.expand);
			el('banner').appendChild(d);
		}catch(e){}
		
		Sizmek.unlisten(document, Sizmek.READY, function(){Sizmek.setExpansionEvent(eventType)})
	}else{
		Sizmek.listen(document, Sizmek.READY, function(){Sizmek.setExpansionEvent(eventType)})
	}
}

Sizmek.getVar = function(varName){
	if(EB._adConfig && EB._adConfig.customJSVars){
		return EB._adConfig.customJSVars[varName];
	} else {
		return null
	}
}

Sizmek.getInstancesOf = function(object, scope) {
	"use strict";
	var instances = [];
	for(var v in scope) {
		if(scope.hasOwnProperty(v) && scope[v] instanceof object) {
			instances.push(v);
		}
	}
	return instances;
}

Sizmek.capitalize = function(string){
	string = string.toString().toLowerCase();
	var exceptions = ['Of', 'The', 'In', 'For']
	var a = String(string).split('');
	for(i = 0; i < a.length; i++){
		if(i == 0 || string.charAt(i-1) == ' '){
			a[i] = a[i].toUpperCase();
		}
	}
	string = a.join('');
	
	for(i = 0; i < exceptions.length; i++){
		string = string.split(exceptions[i]).join(exceptions[i].toLowerCase());
	}
	
	return string;
}

Sizmek.defineStyle = function(cssString){
	var style = document.createElement('style');
	var head = document.head || document.getElementsByTagName('head')[0]
	style.type = 'text/css';
	style.setAttribute('rel', 'stylesheet');
	if (style.styleSheet){
		style.styleSheet.cssText = cssString;
	} else {
		style.appendChild(document.createTextNode(cssString));
	}
	head.appendChild(style);
}

Sizmek.parseLineBreaks = function(string, lineBreak, removeArray){
	string = string.split(lineBreak).join('<br>');
	for(var i = 0; i < removeArray.length; i++){
		string = string.split(removeArray[i]).join('');
	}
	return string;
}

Sizmek.randomBetween = function(min, max){
	return Math.round(min - .5 + Math.random() * (max - min + 1));
}

Sizmek.log = function(input){
	var string = '';
	for(i = 0; i < arguments.length; i++)string += (arguments[i] +' ');
	console.log('SIZMEK:> '+ string);
}

Sizmek.SSL = function(url){
	var t = ['cdds','cgizmo','smq','smqd','speed','spd','stripe', 'gizmo'];
	if(document.location.protocol=='https:'){
		for(var i = 0; i < t.length; i++){
			if(url.search(t[i]) > 0){
				url = url.replace(t[i],t[i]+'-s');
			}
		}
		
		if(url.indexOf('ds.serving-sys.com/BurstingScript/') > -1){
			url = url.replace('http://', 'https://secure-');
		}
		
		url = url.replace('http://','https://');
	}
	return url;
}

Sizmek.getBrowser = function(){
	var userAgent = navigator.userAgent.toLowerCase();
	if(userAgent.indexOf("msie") > -1 || userAgent.indexOf("trident") > -1 || userAgent.indexOf("edge") > -1) {
		return "ie";
	} else if(userAgent.indexOf("chrome")>-1) {
		return "chrome";
	} else if(userAgent.indexOf("safari")>-1) {
		return "safari";
	} else if(userAgent.indexOf("mozilla")>-1) {
		return "firefox";
	} else {
		return "other";
	}
}

Sizmek.registerBoundFunctionReferences = function(object){
	for(var property in object){
		if(object[property] instanceof Function){
			object[property +'Bind'] = object[property].bind(object)
		}
	}
}

function el(id){
	return document.getElementById(id);
}

if (typeof EBModulesToLoad === 'undefined') {
	EBModulesToLoad = ['EBCMD', 'EBAPI'];
} else if(EBModulesToLoad.indexOf('EBCMD') == -1){
	EBModulesToLoad.push('EBCMD');
	EBModulesToLoad.push('EBAPI');
}