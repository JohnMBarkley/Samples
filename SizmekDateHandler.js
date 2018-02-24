//Authored by John Barkley, Sizmek, Inc. 2016.
//Updated 5/30/17

function SizmekDateHandler(dateString){	
	this.dateStringArray = []
	this.dateArray = []
	this.today = new Date()
	this.yesterday = new Date()
	this.datePunctuation = '-'
	this.dateSeparator = '|';
	this.conditionReported = false;
	this.i = 0;
	
	if(Sizmek.countOccurrences(dateString, '/', false) > 1)this.datePunctuation = '/';
	if(Sizmek.countOccurrences(dateString, ',', false) > 0){
		this.dateSeparator = ',';
	}else if(Sizmek.countOccurrences(dateString, ' ', false) > 0){
		this.dateSeparator = ' ';
	}
	
	if((dateString.indexOf(this.dateSeparator) == -1 || dateString.indexOf(this.dateSeparator) > 5) && (Sizmek.countOccurrences(dateString, this.datePunctuation, false) % 2 == 0)){
		this.yesterday.setDate(this.yesterday.getDate() - 1)
	
		this.dateStringArray = dateString.split(this.dateSeparator);
		this.dateStringArray.unshift((this.yesterday.getMonth()+1)+this.datePunctuation+this.yesterday.getDate()+this.datePunctuation+this.yesterday.getFullYear());	
		this.todayDateString = (this.today.getMonth()+1)+this.datePunctuation+this.today.getDate()+this.datePunctuation+this.today.getFullYear()
		
		for(var i = 0; i < this.dateStringArray.length; i++){
			var a = this.dateStringArray[i].split(this.datePunctuation)
			this.assignDateCondition(i, a[0], a[1], a[2])
		}
		
		this.i = this.getCurrentCondition();
	} else {
		Sizmek.log("WARNING: SizmekDateHandler object's 'dateString' parameter should be formatted in one of the following ways: \n'D-M-YYYY|DD-MM-YYYY'\n'D/M/YYYY|DD/MM/YYYY'\n'D-M-YYYY,DD-MM-YYYY'\n'D/M/YYYY,DD/MM/YYYY'")
	}
}

SizmekDateHandler.prototype.assignDateCondition = function(conditionIndex, month, date, year){
	if(this.dateArray[conditionIndex] == undefined){
		this.dateArray[conditionIndex] = new Date(year, month - 1, date, 0, 0, 0, 0)
		Sizmek.log('SizmekDateHandler:>  Condition', conditionIndex +':', this.dateArray[conditionIndex])
	} 
}

SizmekDateHandler.prototype.getCurrentCondition = function(){
	for(var n = this.dateArray.length - 1; n > 0; n--){
		if(this.today > this.dateArray[n]){
			return this.reportCondition(n)
		}
	}
	
	return this.reportCondition(0);
}

SizmekDateHandler.prototype.getCurrentConditionDateString = function(){	
	return this.dateStringArray[this.getCurrentCondition()]
}

SizmekDateHandler.prototype.getNextConditionDateString = function(allowToday){	
	if(allowToday == undefined)allowToday = false;

	if(allowToday && this.getCurrentConditionDateString() == this.todayDateString){
		return this.getCurrentConditionDateString();
	} else {
		return this.dateStringArray[this.getCurrentCondition()+1]
	}
}

SizmekDateHandler.prototype.getPreviousConditionDateString = function(allowToday){	
	if(allowToday == undefined)allowToday = false;

	if(allowToday && this.getCurrentConditionDateString() == this.todayDateString){
		return this.getCurrentConditionDateString();
	} else {
		return this.dateStringArray[this.getCurrentCondition()-1]
	}
}

SizmekDateHandler.prototype.reportCondition = function(n){
	if(!this.conditionReported){
		Sizmek.log('SizmekDateHandler:>  Current Condition:', n, '---', this.dateArray[n])
		this.conditionReported = true;
	}
	return n
}