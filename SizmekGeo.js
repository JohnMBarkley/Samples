//Authored by John Barkley, Sizmek, Inc. 2016.
//Updated 7/6/17

SizmekGeo.USER_LOCATED = 'userLocated';
SizmekGeo.USER_NOT_LOCATED = 'userNotLocated';
SizmekGeo.LOCATIONS_MAPPED = 'locationsMapped';
SizmekGeo.LOCATIONS_FOUND = 'locationsFound';
SizmekGeo.NO_LOCATIONS_FOUND = 'noLocationsFound';
SizmekGeo.VALID_ZIP_SUBMIT = 'validZipSubmit';
SizmekGeo.INVALID_ZIP_SUBMIT = 'invalidZipSubmit';
SizmekGeo.MAP_INTERACTION = 'mapInteraction';
SizmekGeo.MAP_CREATED = 'mapCreated';
SizmekGeo.WEATHER_LOAD_COMPLETE = 'weatherLoadComplete';
SizmekGeo.WEATHER_LOAD_FAILURE = 'weatherLoadFailure';
SizmekGeo.MAP_READY = 'mapReady';

SizmekGeo.DATA_TAG = 'data';
SizmekGeo.GIZMO_BASE = 'http://gizmo.serving-sys.com/api/data/get/';

function SizmekGeo(){
	this.map, this.userLocation, this.serviceData, this.weatherID, this.weatherSecret, this.platformGeoDataAvailable;
	this.serviceLocationSearchCatalog = {}
	this.mapLocationsArray = [];
	this.addressArray = [];
	this.infoArray = [];
	this.loadGizmoUserLocationData = this.usingFallbackUserLocationData = this.usingFallbackLocationData = false;
	this.allowNonNumericZIP = this.capitalizeUserLocationData = false;
	this.serviceNodeList = this.userAddressString = this.searchedZip = this.lineIDZip = ''
	this.numLocations = this.weatherTimeout = 0;
	this.maxLocations = 1;
	this.testZip = '19406';
	this.urlNodeName = 'URL';
}

SizmekGeo.prototype.locateUser = function(mmGetURL){	
	if(this.userLocation !== undefined){	
		setTimeout(this.dispatchUserLocationData.bind(this), 50);
		return;
	}
	
	this.userLocation = new Object();
	this.lineIDZip = (EB && EB._adConfig && EB._adConfig.lineId)? EB._adConfig.lineId : '';
	this.platformGeoDataAvailable = (EB._adConfig && EB._adConfig.geoData && String(EB._adConfig.geoData.city) != '0' && String(EB._adConfig.geoData.zip) != '0');

	if(this.lineIDZip.length == 5){
		Sizmek.log('Pulling ZIP code from platform lineID - '+ this.lineIDZip)
		this.geocodeUserLocation(this.lineIDZip);
	} else if(this.platformGeoDataAvailable){
		for(var property in EB._adConfig.geoData){
			this.userLocation[property.toLowerCase()] = EB._adConfig.geoData[property];
		}
		
		this.userLocation.zip = EB._adConfig.geoData.zip;
		
		if(this.loadGizmoUserLocationData){
			this.capitalizeUserLocationData = true;
			Sizmek.loadData('http://gizmo.serving-sys.com/api/data/get/637?citycode='+ EB._adConfig.geoData.city, 'json', this.geocodeDataLoadCompleteHandler.bind(this));
		} else {
			setTimeout(this.dispatchUserLocationData.bind(this), 50);
		}
	} else if(mmGetURL){
		Sizmek.log('Platform GeoData unavailable. Loading MMGet Data.')
		Sizmek.loadData(mmGetURL, 'json', this.geocodeDataLoadCompleteHandler.bind(this));
	} else {
		Sizmek.log('Platform GeoData unavailable. Defaulting to "testZip" - '+ this.testZip)
		this.geocodeUserLocation(this.testZip);
	}
}

SizmekGeo.prototype.geocodeUserLocation = function(zip){
	this.userLocation.zip = zip;
	this.capitalizeUserLocationData = this.usingFallbackUserLocationData = true;
	Sizmek.loadData('http://maps.googleapis.com/maps/api/geocode/json?address='+ zip, 'json', this.geocodeDataLoadCompleteHandler.bind(this))
}
		
SizmekGeo.prototype.geocodeDataLoadCompleteHandler = function(data){
	var d = new Object();
	
	if(this.usingFallbackUserLocationData){
		if (data.results.length > 0) {
			d = data.results[0];
			data = new Object();
			data.city = d.address_components[1].long_name;
			data.province = data.region = (d.address_components[4] !== undefined)? d.address_components[3].short_name : d.address_components[2].short_name; 
			data.country = (d.address_components[4] !== undefined)? d.address_components[4].short_name : d.address_components[3].short_name; 
			data.latitude = d.geometry.location.lat;
			data.longitude = d.geometry.location.lng;	
		}else {
			Sizmek.dispatch(this, SizmekGeo.USER_NOT_LOCATED, 'Geocode was unsuccessful: ' + status)
			return;
		}
	}else if(typeof data == 'string' && data.indexOf('=') > 0){
		data = data.split('&');
		for(i = 0; i < data.length; i++){
			d[data[i].split('=')[0]] = data[i].split('=')[1]
		}
		data = d;
	} 
	
	for(var property in data) {
		if(!this.capitalizeUserLocationData){
			this.userLocation[property.toLowerCase()] = data[property];
		}else{
			this.userLocation[property.toLowerCase()] = (data[property].length < 4)? data[property].toUpperCase() : Sizmek.capitalize(data[property])
		}
	}
	
	if(this.userLocation['city-name'])this.userLocation.city = this.userLocation['city-name']
	this.userAddressString = this.userLocation.city +', '+ this.userLocation.region +' '+ this.userLocation.zip
	if(this.zipInput)this.searchedZip = this.zipInput.value = this.userLocation.zip;
	this.dispatchUserLocationData();
}

SizmekGeo.prototype.dispatchUserLocationData = function(){
	console.log(this.userLocation)
	Sizmek.dispatch(this, SizmekGeo.USER_LOCATED, this.userLocation)
}

SizmekGeo.prototype.setUserZIP = function(zip){		
	try{
		this.userLocation.zip = (this.lineIDZip.length < 5)? zip : this.lineIDZip
	}catch(error){
		this.userLocation.zip = zip;
	}
}

SizmekGeo.prototype.searchLocationService = function(serviceID, searchRadiusMiles, serviceBaseNodeName, appendedVarObject){	
	var searchZip, searchID, self = this, ulc = userLocationCompleteHandler.bind(this);
	if(appendedVarObject === undefined)appendedVarObject = {};
				
	if(appendedVarObject.zip === undefined){
		Sizmek.listen(this, SizmekGeo.USER_LOCATED, ulc)
		this.locateUser();	
	} else{
		searchZipForLocations(appendedVarObject.zip);
	}
	
	function userLocationCompleteHandler(e){			
		Sizmek.unlisten(this, SizmekGeo.USER_LOCATED, ulc);
		searchZipForLocations(e.data.zip);
	}
	
	function searchZipForLocations(zip){
		self.searchedZip = zip
		serviceID = Sizmek.getVar('serviceID') || serviceID;
		servideBaseNodeName = Sizmek.getVar('serviceBaseNodeName') || serviceBaseNodeName;
		searchID = SizmekGeo.DATA_TAG +'-'+ serviceID +'-'+ zip +'-'+ searchRadiusMiles;
						
		if(self.serviceLocationSearchCatalog[searchID] === undefined){
			searchURL = SizmekGeo.GIZMO_BASE + serviceID
			appendedVarObject.format = 'json';
			appendedVarObject.prox = Sizmek.getVar('serviceSearchRadius') || searchRadiusMiles;
			appendedVarObject.zip = appendedVarObject.zipcode = zip;			
			Sizmek.loadDataWithVariableObject(searchURL, appendedVarObject, 'json', locationLoadCompleteHandler.bind(self))
		} else {
			locationLoadCompleteHandler(self.serviceLocationSearchCatalog[searchID]);
		}
	}
	
	function locationLoadCompleteHandler(data){		
		if(data === undefined || data[serviceBaseNodeName] === undefined || data[serviceBaseNodeName][0] === undefined){
			if(self.fallbackData !== undefined){
				console.log('Location service returned no locations in ZIP code '+ searchZip +'. Using fallback data.');
				self.usingFallbackLocationData = true;
				alertLocationsFound(this.fallbackData);
				return;
			}
			
			Sizmek.log('Location service returned no locations in ZIP code '+ self.searchedZip +'.');
			Sizmek.dispatch(this, SizmekGeo.NO_LOCATIONS_FOUND, self.searchedZip);
			return;
		} else {
			self.serviceLocationSearchCatalog[searchID] = data;
		}
		
		self.usingFallbackLocationData = false;
		alertLocationsFound(data);
	}
	
	function alertLocationsFound(data){		
		data[serviceBaseNodeName].splice(self.maxLocations)	
		
		if(data !== undefined){
			self.serviceData = data[serviceBaseNodeName];
			self.populateDataArrays(self.serviceData);	
		}
				
		Sizmek.dispatch(self, SizmekGeo.LOCATIONS_FOUND, self.serviceData);
	}
}

SizmekGeo.prototype.searchLocationServiceAndMap = function(serviceID, searchRadiusMiles, serviceBaseNodeName, mapContainerID, appendedVarObject){
	var container = el(mapContainerID), self = this, locDataComp = locationDataLoadCompleteHandler.bind(this), remove = removeListeners.bind(this);
	this.mapLocationsArray = [];
	
	if(typeof SizmekMap === undefined){
		console.log("Please include 'SizmekMap.js' script in your HTML header.")
	}
			
	Sizmek.listen(self, SizmekGeo.LOCATIONS_FOUND, locDataComp)
	Sizmek.listen(self, SizmekGeo.NO_LOCATIONS_FOUND, remove);
	
	this.searchLocationService(serviceID, searchRadiusMiles, serviceBaseNodeName, appendedVarObject)
	
	function locationDataLoadCompleteHandler(e){			
		setTimeout(self.mapLocations.bind(self), 100, mapContainerID);
		removeListeners()
	}
	
	function removeListeners(){
		Sizmek.unlisten(self, SizmekGeo.LOCATIONS_FOUND, locDataComp)
		Sizmek.unlisten(self, SizmekGeo.NO_LOCATIONS_FOUND, remove)
	}
}

SizmekGeo.prototype.mapLocations = function(mapContainerID){	
	this.numLocations = (this.serviceData.length > this.maxLocations)? this.maxLocations : this.serviceData.length;
	this.maplocationsArray = [];
						
	for(i = 0; i < this.numLocations; i++){
		console.log(this.serviceData[i]);
		this.mapLocationsArray[i] = {latitude:Number(this.serviceData[i]['+latitude']), longitude: Number(this.serviceData[i]['+longitude']), address: this.addressArray[i], info:this.infoArray[i]}
		if(this.serviceData[i][this.urlNodeName])this.mapLocationsArray[i].url = this.serviceData[i][this.urlNodeName];
	}
		
	if(this.map === undefined){
		this.map = new SizmekMap(mapContainerID, this.mapLocationsArray);
		Sizmek.listen(this.map, SizmekMap.LOCATIONS_MAPPED, this.locationMappingCompleteHandler.bind(this));
		this.map.sizmekGeo = this;
	} else {
		this.map.mapLocations(this.mapLocationsArray)
	}
	
	Sizmek.dispatch(this, SizmekGeo.MAP_CREATED, this.map)
}

SizmekGeo.prototype.locationMappingCompleteHandler = function(){
	Sizmek.dispatch(this, SizmekGeo.LOCATIONS_MAPPED)
}

SizmekGeo.prototype.setZipCodeInputElements = function(inputFieldID, submitButtonID){
	var self = this;
		
	if(inputFieldID){
		self.zipInput = el(inputFieldID);
		self.zipInput.setAttribute('maxlength', 5);
		self.zipInput.addEventListener('keydown', keyPressHandler.bind(self))
		self.zipInput.addEventListener('focus', clearValue.bind(self));
	}
	
	if(submitButtonID){
		self.zipSubmitButton = el(submitButtonID)
		self.zipSubmitButton.addEventListener('click', validateZipCode.bind(self));
	}
	
	function clearValue(e){
		self.zipInput.value = ''
	}
	
	function keyPressHandler(e){
		if(e.keyCode == 13){
			validateZipCode();
		} else if (!self.allowNonNumericZIP && [8, 48, 49, 50, 51, 52, 53, 54, 55, 56, 57].indexOf(e.which) == -1){
			e.preventDefault();
		}
	}
	
	function validateZipCode(){
		if(Sizmek.dataLoading || self.zipInput.value == self.searchedZip)return;		
		
		if(self.map === undefined || self.map.ready){
			if((self.zipInput && self.zipInput.value.length == 5) || self.allowNonNumericZIP){
				Sizmek.dispatch(self, SizmekGeo.VALID_ZIP_SUBMIT, self.zipInput.value)
			} else {
				Sizmek.dispatch(self, SizmekGeo.INVALID_ZIP_SUBMIT, self.searchedZip)
			}
		}
	}	
}

SizmekGeo.prototype.populateDataArrays = function(data){
	this.serviceNodeList = Sizmek.getVar('serviceNodeList') || this.serviceNodeList;
	
	if(this.serviceNodeList.length > 0){
		this.infoArray = [];
		this.addressArray = [];		
				
		for(var i = 0; i < data.length; i++){
			var address = '', info = '', o = {};
			var nodes = this.serviceNodeList.constructor === Array? this.serviceNodeList : this.serviceNodeList.split(' ');
			
			for(var property in data[i]){
				var p = property.split(' ').join('');
				if(nodes.indexOf(p) > -1)o[p] = data[i][property];
			}
			
			for(n = 0; n < nodes.length; n++){
				if(o[nodes[n]]){
					var val = o[nodes[n]];
					var valueIsZIP = !isNaN(val.replace('-',''));
					var valueIsAddress = (!valueIsZIP && !isNaN(val.charAt(0)));
					var valueIsState = (val.length == 2 && val == val.toUpperCase())
					var space = (valueIsState || (n == 1 && valueIsAddress))? ', ' : ' '
					if(n == 0)space = '';
					//if(!valueIsZIP && !valueIsState)val = Sizmek.capitalize(val)
					address += (((n > 0 && valueIsAddress)? '<br>' : space) + val + (valueIsAddress? '<br>' : ''))
					info += (space + val + (valueIsAddress? ',' : ''));
				}
			}
						
			address = address.split('<br> ').join('<br>').split('<br><br>').join('<br>').split('<br>,').join(',');
			info = info.split(',,').join(',');
			this.addressArray.push(address)
			this.infoArray.push(info);
		}
		
	} else {
		Sizmek.log('Location data arrays cannot be populated until instance of SizmekGeo has "serviceNodeList" property defined.');
	}
}

SizmekGeo.prototype.getFallbackUserLocationDataFromZipCode = function(zip, onCompleteHandler){
	if(onCompleteHandler === undefined)onCompleteHandler = function(){};
	Sizmek.loadDataWithVariableObject('http://maps.googleapis.com/maps/api/geocode/json', {address: zip}, 'json', geocodeCompleteHandler)
		
	function geocodeCompleteHandler(data) {
      	if (data.results.length > 0) {
			var d = data.results[0];
			var c = d.address_components;
			var o = {};
			o.city = d.address_components[1].long_name;
			o.province = o.region = (c[4] !== undefined)? c[3].short_name : c[2].short_name; 
			o.country = (c[4] !== undefined)? c[4].short_name : c[3].short_name; 
			o.latitude = d.geometry.location.lat;
			o.longitude = d.geometry.location.lng;	
			onCompleteHandler(o);
        }else {
        	alert("Geocode was not successful for the following reason: " + status);
      	}
    }
}

SizmekGeo.prototype.loadWeatherData = function(weatherServiceID, weatherServiceSecret){ 
	if(weatherServiceID !== undefined)this.weatherID = weatherServiceID
	if(weatherServiceSecret !== undefined)this.weatherSecret = weatherServiceSecret;
	if(this.weatherID === undefined || this.weatherSecret === undefined || this.weatherID == '' || this.weatherSecret == '') {
		Sizmek.log('Weather functionality requires a HAMweather Aeris Weather consumer ID and consumer secret.  You may create them at "http://www.aerisweather.com/develop/"');
	} else {
		Sizmek.listen(this, SizmekGeo.USER_LOCATED, userLocationCompleteHandler.bind(this))
		this.locateUser();
	}
	
	function userLocationCompleteHandler(e){	
		Sizmek.trackNoun('impression', 'AF_Weather_Object_6119');
		Sizmek.loadDataWithVariableObject('http://api.aerisapi.com/observations/'+ e.data.zip, {client_id: this.weatherID, client_secret: this.weatherSecret}, 'json', this.weatherLoadCompleteHandler.bind(this))
		this.weatherTimeout = setTimeout(this.alertWeatherFailure.bind(this), 8000, 'Weather data call failed to respond.');
	}
};
        
SizmekGeo.prototype.weatherLoadCompleteHandler = function(obj) {	
	if (obj.success == true) {
		Sizmek.dispatch(this, SizmekGeo.WEATHER_LOAD_COMPLETE, obj.response.ob)
	} else {
		this.alertWeatherTimeout(obj.error.description);
	};
	
	clearTimeout(this.weatherTimeout)
}

SizmekGeo.prototype.alertWeatherFailure = function(data){
	Sizmek.dispatch(this, SizmekGeo.WEATHER_LOAD_FAILURE, data)
}

SizmekGeo.prototype.hideMap = function(){
	if(this.map)this.map.hideMap();
}

SizmekGeo.prototype.showMap = function(){
	if(this.map)this.map.showMap();
}

/*---------- Platform Variables ----------*/
//serviceID
//serviceNodeList
//serviceBaseNodeName
//serviceSearchRadius