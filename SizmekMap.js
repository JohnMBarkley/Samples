//Authored by John Barkley, Sizmek, Inc. 2016.
//Updated 6/8/17

SizmekMap.READY = 'sizmekMapReady';
SizmekMap.MOVE = 'moved';
SizmekMap.ZOOM = 'zoomed';
SizmekMap.INFO_OPEN = 'infoWindowOpened';
SizmekMap.INFO_CLOSE = 'infoWindowClosed';
SizmekMap.MARKER_SELECTED = 'markerSelected';
SizmekMap.MARKER_DISTANCE_CALCULATED = 'distanceCalculated';
SizmekMap.LOCATIONS_MAPPED = 'locationsMapped';

SizmekMap.GOOGLE = 'google'
SizmekMap.MAPQUEST = 'mapquest'

function SizmekMap(containerID, locations){
	this.container = el(containerID);
	this.container.style.display = 'none';
	this.draggable = this.controls = this.clickthroughToMapquest = this.showInitInfo = true;
	this.ready = this.clickthroughToGoogle = this.initZoomComplete = false;
	this.mapType = SizmekMap.MAPQUEST;
	this.apiKey = 'Fmjtd%7Cluua2162nu%2Cb0%3Do5-h4as5'
	this.locations = locations
	this.sizmekGeo, this.map, this.directionsDisplay, this.directionsService;
	this.markerArray = [];
	this.markers;

	setTimeout(this.loadAPI.bind(this), 50);
};	

SizmekMap.prototype.loadAPI = function(){	
	switch(this.mapType){
		case SizmekMap.GOOGLE:
			Sizmek.loadScript('https://maps.googleapis.com/maps/api/js?key=', this.init.bind(this));
			break;
		case SizmekMap.MAPQUEST:
			Sizmek.loadScript('https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/leaflet.js', this.loadMapquest.bind(this))
	}
}

SizmekMap.prototype.loadMapquest = function(){
	Sizmek.loadScript('https://www.mapquestapi.com/sdk/leaflet/v2.2/mq-map.js?key='+ this.apiKey, this.loadMapquestFeatures.bind(this))
}

SizmekMap.prototype.loadMapquestFeatures = function(){
	var featureScriptArray =  ['https://www.mapquestapi.com/sdk/leaflet/v2.s/mq-routing.js?key='+ this.apiKey, 
							   'https://www.mapquestapi.com/sdk/leaflet/v2.s/mq-geocoding.js?key='+ this.apiKey];
	Sizmek.loadMultipleScripts(featureScriptArray, this.loadMapquestStyleSheet.bind(this));
}

SizmekMap.prototype.loadMapquestStyleSheet = function(){	
	Sizmek.loadStyleSheet('https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/leaflet.css', this.init.bind(this))
}

SizmekMap.prototype.init = function(){
	setTimeout(loadMap.bind(this), 100);
	
	function loadMap(){
		Sizmek.trackAction('FEAT_HTML5_6210_LOAD_MAPS');
		this.mapLocations(this.locations);				
		this.showMap();
	}
}

SizmekMap.prototype.showMap = function(){
	if(this.ready){
		if(this.container.style.opacity == 0 || this.container.style.visibilty == 'hidden' || this.container.style.display == 'none'){
			this.container.style.opacity = 0;
			this.container.style.visibility = 'visible';
			this.container.style.display = 'block';
			TweenMax.to(this.container, .5, {opacity:1});
		}
		Sizmek.unlisten(this, SizmekMap.READY, this.showMap.bind(this))
	} else {
		Sizmek.listen(this, SizmekMap.READY, this.showMap.bind(this))
	}
}

SizmekMap.prototype.mapLocations = function(locations){	
	var self = this;
	this.locations = locations;
	this.latitude = locations[0].latitude;
	this.longitude = locations[0].longitude;
	this.markerArray = [];
	this.ready = this.initZoomComplete = false;

	switch(this.mapType){
		case SizmekMap.GOOGLE:
			var bounds = new google.maps.LatLngBounds();
			this.map = new google.maps.Map(this.container, {zoomControl: this.controls, zoom: 1, center: {lat:locations[0].latitude, lng:locations[0].longitude}});
			this.infoWindow = new google.maps.InfoWindow();
			this.infoWindow.visible = false;

			for(i = 0; i < locations.length; i++){
				var latLng = {lat:locations[i].latitude, lng:locations[i].longitude}
				var marker = new google.maps.Marker({position: latLng, map: this.map, title: locations[i].info.split('<br>')[0]});
				bounds.extend(marker.position);
				
				if(locations[i].info && locations[i].info.length > 0){
					marker.addListener('click', function(){this.openInfoWindow(this.markerArray.indexOf(marker))}.bind(this))
				}
				
				this.markerArray.push(marker);
			}
			
			if(locations.length == 1){
				this.map.setZoom(15);
			}else{
				this.map.setCenter(bounds.getCenter());
				this.map.fitBounds(bounds);
			}

			this.map.addListener('zoom_changed', this.mapInteractionHandler.bind(this));
			this.map.addListener('drag', this.mapInteractionHandler.bind(this));
			this.infoWindow.addListener('closeclick', function(){this.visible = false;});
			break;
		case SizmekMap.MAPQUEST:
			var addressArray = []
						
			for(var i = 0; i < this.locations.length; i++){				
				addressArray[i] = this.locations[i].info.split('<br>').join(', ');
				if(isNaN(addressArray[i].charAt[0])){
					var a = addressArray[i].split(', ')
					a.shift();
					addressArray[i] = a.join(', ');
				}
			}
			
			setTimeout(positionMarkers.bind(self), 20)
			
			function positionMarkers(e) {				
				if(this.map == undefined){
					this.map = L.map(this.container.id, {layers: MQ.mapLayer()});					
					this.map.on('doubleclick', this.mapInteractionHandler.bind(this));
					this.map.on('dragstart', this.mapInteractionHandler.bind(this));
					this.map.on('zoomstart', this.mapInteractionHandler.bind(this));
					this.map.on('popupopen', this.mapInteractionHandler.bind(this));
					this.map.on('popupclose', this.mapInteractionHandler.bind(this));
				} else {
					this.map.removeLayer(this.markers);
				}
				
			  	for(i = 0; i < this.locations.length; i++) {
					var marker = L.marker([this.locations[i].latitude, this.locations[i].longitude]);
					marker.bindPopup(this.buildInfoDiv(i).outerHTML);
					this.markerArray.push(marker);
			  	}
				
				self.markers = L.featureGroup(this.markerArray).on('click', function(){this.openInfoWindow(this.markerArray.indexOf(marker))}.bind(this)).addTo(this.map);
				
				if(this.locations.length == 1){
					self.map.setView([self.locations[0].latitude, self.locations[0].longitude], 17)
					
					if(this.showInitInfo)setTimeout(function(){this.openInfoWindow(0, true)}.bind(this), 50)
				} else {
					this.map.fitBounds(self.markers.getBounds());
				}
			}
	}
	
	//this.calculateDistanceToMarker(0);
	this.ready = true;
	Sizmek.dispatch(this, SizmekMap.READY);
	Sizmek.dispatch(this, SizmekMap.LOCATIONS_MAPPED)
}

SizmekMap.prototype.activateGoogleMaps = function(apiKey){
	if(apiKey === undefined){
		console.log('Parameter "apiKey" must be a valid Google Maps API key.');
		return; 	
	}
	
	this.apiKey = apiKey;
	this.mapType = SizmekMap.GOOGLE;
	this.clickthroughToMapquest = false;
	this.clickthroughToGoogle = true;
}

SizmekMap.prototype.buildInfoDiv = function(i){
	var div = document.createElement('div');
	div.id = 'infoWindowContent'+i;
	div.classList.add('infoWindowContent');
	div.style.cursor = 'pointer';
	div.style.pointerEvents = 'all';
	div.innerHTML = this.locations[i].address.split("'").join('’');
	return div;
}

SizmekMap.prototype.openInfoWindow = function(i, initInfo){
	switch(this.mapType){
		case SizmekMap.GOOGLE:
			this.infoWindow.setContent(this.buildInfoDiv(i).outerHTML);
			
			if(this.infoWindow.visible){
				this.infoWindow.setPosition(this.markerArray[i].position);
			}else{
				this.infoWindow.open(this.map, this.markerArray[i])
				this.infoWindow.visible = true;
			}
			break;
		case SizmekMap.MAPQUEST:
			if(initInfo)this.markerArray[i].openPopup();
			break;
	}
		
	setTimeout(this.infoWindowOpenHandler.bind(this), 10);
}

SizmekMap.prototype.infoWindowOpenHandler = function(e){
	var markerIndex = this.getMarkerIndex();
	if(el('infoWindowContent'+ markerIndex) && (this.clickthroughToMapquest || this.clickthroughToGoogle || this.locations[markerIndex].url)){
		el('infoWindowContent'+ markerIndex).addEventListener('click', this.infoWindowClickHandler.bind(this));
	}
	
	Sizmek.trackNoun('Map_Marker_Select', this.locations[markerIndex].info.split('<br>').join(' '));
	this.mapInteractionHandler({type:''});
}

SizmekMap.prototype.infoWindowClickHandler = function(e){
	if (e.target.id.match(/\d+/g)){
		this.launchMarkerClickthrough(Sizmek.parseNum(e.target.id));
	}	
}

SizmekMap.prototype.launchMarkerClickthrough = function(i, interactionName){
	if(interactionName === undefined)interactionName = 'Click_Map_Location';
	var url, address;
				
	if(this.clickthroughToGoogle){
		url = 'https://maps.google.com?q=' + this.locations[i].info.split('<br>').join(',+').split(' ').join('+');
	}else if(this.clickthroughToMapquest){
		if(isNaN(this.locations[i].address.charAt(0))){
			address = this.locations[i].address.split('<br>').splice(1).join(', ').split("'").join(' ');
		}else{
			address = this.locations[i].address.split('<br>').join(', ').split("'").join(' ');
		}
		url = 'https://www.mapquest.com/search/results?centerOnResults=1&query='+encodeURI(address+'&zoom=18');
	}else if(this.locations[i].url){
		url = this.locations[i].url
	}

	if(url){
		console.log(interactionName+':', url);
		EB.clickthrough(interactionName, url, 1);
		Sizmek.trackNoun(interactionName, this.locations[i].info.split('<br>').join(', '))
	}
}

SizmekMap.prototype.getMarkerIndex = function(){	
	for(i = 0; i < this.locations.length; i++){
		if(el('infoWindowContent'+ i))return i;
	}
}

SizmekMap.prototype.calculateDistanceToMarker = function(i){
	if(i >= this.locations.length)return;
	
	if(this.sizmekGeo && this.sizmekGeo.userLocation){
		var distance = Sizmek.roundNumber(SizmekMap.calculateDistance(this.sizmekGeo.userLocation.latitude, this.sizmekGeo.userLocation.longitude, this.locations[i].latitude, this.locations[i].longitude), 1);
		Sizmek.dispatch(this, SizmekMap.MARKER_DISTANCE_CALCULATED, distance);
	}
}

SizmekMap.prototype.mapInteractionHandler = function(e){
	var tracking = (this.ready && this.initZoomComplete)
	
	switch(e.type){
		case 'popupopen':
			var markerIndex = this.getMarkerIndex();
			Sizmek.dispatch(this, SizmekMap.INFO_OPEN, markerIndex)
			Sizmek.dispatch(this, SizmekMap.MARKER_SELECTED, markerIndex)
			if(tracking)Sizmek.trackAction('User_OpenLocation');
			break;
		case 'popupclose':
			Sizmek.dispatch(this, SizmekMap.INFO_CLOSE)
			if(tracking)Sizmek.trackAction('User_CloseLocation');
			break;
		case 'zoomstart': case 'zoom_changed':
			Sizmek.dispatch(this, SizmekMap.ZOOM)
			if(tracking)Sizmek.trackAction('User_ZoomMap');
			break;
		case 'drag': case 'dragstart':
			Sizmek.dispatch(this, SizmekMap.MOVE)
			if(tracking)Sizmek.trackAction('User_MoveMap');
			break;			
	}

	if(tracking){
		Sizmek.pin();
		if(this.sizmekGeo)Sizmek.dispatch(this.sizmekGeo, SizmekGeo.MAP_INTERACTION)
	}
	
	setTimeout(function(){this.initZoomComplete = true}.bind(this), 1000);
}

SizmekMap.prototype.hideMap = function() {
	Sizmek.trackAction('FEAT_HTML5_6210_CLOSE_MAPS');
	this.container.style.display = 'none';
}

SizmekMap.calculateDistance = function(startLat, startLon, endLat, endLon){
	startLat = Math.PI * startLat/180
	endLat = Math.PI * endLat/180 
	return Math.acos(Math.sin(startLat) * Math.sin(endLat) + Math.cos(startLat) * Math.cos(endLat) * Math.cos(Math.PI * (startLon - endLon)/180)) * 180/Math.PI * 60
}


//Add this to the CSS to format the info window.
/*
FOR STYLING INFO WINDOW:
.mqabasicwnd, .infoWindowContent{
	font-size:11px;
	color:#364075;
	text-align:center;
  	width: auto;
	white-space: nowrap;
	cursor:pointer !important;
	pointer-events:all !important;
}
*/