var viewModelBuilder = function () {
    
    var sortTopSources = function (left, right) {
		return right.hits() === left.hits() ? 0 : (right.hits() < left.hits() ? -1 : 1);
	}

	return {
	    modelItem: function (name, parent) {
	        var self = this;

	        self.name = ko.observable(name);
	        self.hits = ko.observable(1);
	        self.incrementHits = function () {
	        	self.hits(self.hits() + 1);
	        }

	        self.percentage = ko.computed(function () {
	        	return ((self.hits() / parent.totalVisits()) * 100).toFixed(2) + '%';
	        });
	    },
	    
	    viewModel: function () {
	        var self = this;

	        self.totalVisits = ko.observable(0);
	        self.incrementTotalVisits = function () {
	        	self.totalVisits(self.totalVisits() + 1);
	        }

	        self.topSources = ko.observableArray([]);

	        self.updateTopSources = function (name) {
				name = name === null ? 'no source' : name.toUpperCase();

		      	// check if the name is already in the array
		        var matchedItem = ko.utils.arrayFirst(self.topSources(), function (lastItem) {
		            if (name === lastItem.name()) {
		            	return lastItem;
		            }
		        });

		        if (matchedItem) {
		        	matchedItem.incrementHits();
		        }
		        else {
		        	self.topSources.push(new viewModelBuilder.modelItem(name, self));
		        }

		        self.incrementTotalVisits();
		        self.topSources.sort(sortTopSources);
	        };
	    }
    };
}();