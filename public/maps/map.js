var mapper = function () {    
    var map;
    var markers = [];
    var stylesArray = [{
        "featureType": "road",
        "stylers": [{
            "color": "#808080"
        }, {
            "visibility": "off"
        }]
    }, {
        "featureType": "poi",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "administrative.province",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "administrative.country",
        "elementType": "geometry.fill",
        "stylers": [{
            "visibility": "on"
        }]
    }, {
        "featureType": "administrative.locality",
        "elementType": "labels",
        "stylers": [{
            "visibility": "off"
        }]
    }, {
        "featureType": "administrative.country",
        "elementType": "labels",
        "stylers": [{
            "visibility": "off"
        }]
    }];

    return {
		init: function () {
	        map = new google.maps.Map(document.getElementById("map_canvas"), {
	            zoom: 6,
	            center: new google.maps.LatLng('55.5', '-1.4'),
	            mapTypeId: google.maps.MapTypeId.ROADMAP
	        });

	        map.setOptions({
	            styles: stylesArray
	        });
	    },
    	dropMarker: function (latitude, longitude) {
	        var marker = new google.maps.Marker({
	            position: new google.maps.LatLng(latitude, longitude),
	            map: map,
	            icon: 'http://i.imgur.com/0AynL.png',
	            time: new Date()
	        });

            markers.push(marker);
	    },

        trimMarkers: function () {
            var toRemove = jQuery.grep(markers, function (marker, index) {
                var now = new Date();        
                var cutOff = new Date(now);
                cutOff.setMinutes(now.getMinutes() - 10);
                
                return (marker.time < cutOff);
            });

            $.each(toRemove, function () {
                if (markers.indexOf(this) >= 0) {
                    markers[markers.indexOf(this)].setMap(null);
                    markers.splice(markers.indexOf(this), 1);
                }
            });
        }
    };
}();