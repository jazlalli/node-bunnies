var viewModelBuilder = function () {

    var sortTopSources = function (left, right) {
        return right.hits() === left.hits() ? 0 : (right.hits() < left.hits() ? -1 : 1);
    }

    return {
        modelItem: function (mediasource, parent) {
            var self = this;

            self.mediasource = ko.observable(mediasource);
            self.hits = ko.observable(1);
            self.incrementHits = function () {
                self.hits(self.hits() + 1);
            }

            self.percentage = ko.computed(function () {
                return ((self.hits() / parent.pageViewCount()) * 100)
                    .toFixed(2) + '%';
            });
        },

        viewModel: function () {
            var self = this;

            self.pageViewCount = ko.observable(0);
            self.incrementPageViewCount = function () {
                self.pageViewCount(self.pageViewCount() + 1);
            }

            self.pageViews = ko.observableArray([]);
            self.pageViewRate = ko.computed(function () {
                var toRemove = jQuery.grep(self.pageViews(), function (pageview, index) {
                    var now = new Date();
                    var cutOff = new Date(now);
                    cutOff.setMinutes(now.getMinutes() - 1);
                    
                    return (pageview < cutOff);
                });
           

                $.each(toRemove, function () {
                    if (self.pageViews().indexOf(this) >= 0) {
                        self.pageViews().splice(self.pageViews().indexOf(this), 1);
                    }
                });

                return self.pageViews().length;
            });

            self.topMediaSources = ko.observableArray([]);

            self.update = function (mediasource) {
                if (mediasource == null || mediasource === '') {
                    mediasource = 'no source';
                }

                console.log(mediasource);
                mediasource = mediasource.toUpperCase();

                // check if the name is already in the array
                var matchedItem = ko.utils.arrayFirst(self.topMediaSources(), function (lastItem) {
                    if (mediasource === lastItem.mediasource()) {
                        return lastItem;
                    }
                });

                if (matchedItem) {
                    matchedItem.incrementHits();
                } else {
                    self.topMediaSources.push(new viewModelBuilder.modelItem(mediasource, self));
                }

                self.pageViews.push(new Date());
                self.incrementPageViewCount();
                self.topMediaSources.sort(sortTopSources);
            };
        }
    };
}();