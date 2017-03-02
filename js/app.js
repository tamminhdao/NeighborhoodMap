// Google Map
var map;

function initMap() {
    //style the map
    var styles = [
        {
            featureType: 'poi',
            elementType: 'poi.attraction',
            stylers : [
                { weight: 10 }
            ]
        },
        {
            featureType: 'poi',
            elementType: 'poi.park',
            stylers : [
                { weight: 9 }
            ]
        },
        {
            featureType: 'road',
            elementType: 'road.highway',
            stylers : [
                { visibility: 'simplified' }
            ]
        },
        {
            featureType: 'road.highway',
            elementType: 'labels.icon',
            stylers: [
              { visibility: 'off' }
            ]
        },
        {
            featureType: 'administrative',
            elementType: 'administrative.neighborhood',
            stylers : [
                { visibility: 'off' }
            ]
        }
    ];
    map = new google.maps.Map(document.getElementById('map'), {
        center: {lat: 37.77733, lng: -122.441415}, //Panhandle
        //center: {lat: 37.776259, lng: -122.432758}, //Painted Lady
        zoom: 14,
        styles: styles,
        mapTypeControl: false
    });
}

//Error handling for Google Maps APIs
function errorHandling () {
    var notice = '<h1 align="center"> GOOGLE MAPS DOESN\'T WORK!</h1>';
    notice += '<h1 align="center"> Please try again later! </h1>'
    $('.options-box').append(notice);
    $('#map').append(notice);
}

//Load data from Foursquare
function foursquareCall(dataArray) {
    $.ajax({
        method: "GET",
        url: "https://api.foursquare.com/v2/venues/search?ll=37.77926,-122.419265&query=yoga&radius=5000&client_id=POWMWFWIJYX2DYSPVDZGWUALNC4RON5ROTEPHNDZKIYOTUTR&client_secret=PHC4Z52PPQJM5SMCLNN4UAGVYW5PQIKOWX23FDQWLCVB3J3S&v=20170203",
        dataType: 'jsonp',
    }).done (function (response) {
        var result = response.response.venues;
        //push each item of the Foursquare response into venueList array, while conveniently convert them into Venue instances
        result.forEach (function (item) {
            dataArray.push(new Venue(item)); 
        });
        //extend map bounds to include all markers on the screen
        var bounds = new google.maps.LatLngBounds();
        dataArray().forEach (function (venue) {
            bounds.extend(venue.marker.position);
        });
        //make sure map markers always fit on screen as user resizes their browser window
        google.maps.event.addDomListener(window, 'resize', function() {
            map.fitBounds(bounds);
        });
    }).fail (function(jqXHR, textStatus, errorThrown) {
        console.log ('Status code: ' + jqXHR.status); 
        console.log ('Text status: ' + textStatus);
        console.log ('Error thrown: ' + errorThrown);
        window.alert ('Cannot retrieve data from Foursquare at the moment!');
    });
}

//Model 
//constructor function for each yoga studio (i.e. Venue instance) to be place on the map
var Venue = function (data) {
    var self = this;
    this.name = ko.observable(data.name) || 'No name provided';
    this.address = data.location.address || 'No address provided';
    this.phone = data.contact.formattedPhone || 'No phone number provided';
    this.lat = data.location.lat;
    this.lng = data.location.lng;

    var markerImage = {
    url: 'https://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ '0091ff' +
    '|40|_|%E2%80%A2',
    size: new google.maps.Size(21, 34),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(10, 34),
    scaledSize: new google.maps.Size(21, 34)
    };

    var selectedMarkerImage = {
    url: 'https://chart.googleapis.com/chart?chst=d_map_spin&chld=1.15|0|'+ 'ff6666' +
    '|40|_|%E2%80%A2',
    size: new google.maps.Size(21, 34),
    origin: new google.maps.Point(0, 0),
    anchor: new google.maps.Point(10, 34),
    scaledSize: new google.maps.Size(21, 34)
    };

    this.marker = new google.maps.Marker({
        title: self.name(),
        position: new google.maps.LatLng (self.lat, self.lng),
        map: map,
        icon: markerImage,
        animation: google.maps.Animation.DROP
    });

    this.toggleBounce = function() {
        self.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            self.marker.setAnimation(null);
        }, 1400);
      };

    this.infowindow = new google.maps.InfoWindow ({
        content: '<div>' + 'Name: ' + self.name() + '<br><br>'
                        + 'Address: ' + self.address + '<br><br>' 
                        + 'Phone: ' + self.phone + '</div>',
        position: new google.maps.LatLng (self.lat, self.lng),
        isOpen: false
    });

    this.openInfoWindow = function () {
        self.infowindow.open(map, self.marker);
        self.infowindow.isOpen = true;
    };

    this.closeInfoWindow = function () {
        self.infowindow.close(map, self.marker);
        self.infowindow.isOpen = false;
    };

    //Create an onclick event to open an infowindow when each marker is clicked
    this.marker.addListener('click', function() {
        if (self.infowindow.isOpen === true) {
            self.closeInfoWindow ();
            self.marker.setIcon(markerImage);
        }
        else
            self.openInfoWindow();
            self.toggleBounce();
    });

    this.showInfo = function () {
        map.panTo(self.marker.getPosition());
        self.marker.setIcon(selectedMarkerImage);
        self.marker.setVisible(true);
        self.toggleBounce();
        self.openInfoWindow();
    };

    this.resetMarker = function() {
        self.marker.setIcon(markerImage);
        self.marker.setVisible(true);
        self.closeInfoWindow();
    };
}

//ViewModel constructor function
function ViewModel () {
    var self = this;

    //populate the venueList with data loaded from Foursquare APIs
    //bind venueList with <ul> to be display on the option menu
    this.venueList = ko.observableArray([]);
    foursquareCall(this.venueList);
    //console.log (self.venueList());

    this.selectedStudio = ko.observable ();
    this.setStudio = function(clickedOption) {
        self.selectedStudio(clickedOption);
        if (clickedOption !== null) {
            self.selectedStudio().showInfo();
        }
    };

    this.recenterMap = function () {
        map.panTo(new google.maps.LatLng (37.77733, -122.44141));
    };

    //Filter
    this.filter = ko.observable(""); //has to specify type string for lower case method to kick in
    this.filterByKeyword = ko.computed (function() {
        if (self.filter() !== "") {
            var filter_text = self.filter().toLowerCase();
            return ko.utils.arrayFilter (self.venueList(), function(venue) {
                if (venue.name().toLowerCase().includes(filter_text)) {
                    return true;
                }
                else {
                    venue.marker.setVisible(false);
                    //close any infowindow previously opened
                    venue.closeInfoWindow();
                    return false;
                }
            });
        }
        else {
            self.venueList().forEach (function (venue) {
                venue.marker.setVisible(true);
            });
            //make sure the Google Maps API is finished loading or var map is considered undefined
            if (map !== undefined) {
                self.recenterMap();
            }
            return self.venueList();
        }
    }, ViewModel);


    //Knockout Bindings for the Header
    //assign initial visibility status for the selection icons and the option box
    this.hamburgerIcon = ko.observable (false);
    this.crossIcon = ko.observable (true);
    this.optionsBox = ko.observable (true);

    //show options box when click on hamburger icon, alternate between hamburger and cross icons
    this.showOptions = function() {
        self.hamburgerIcon(false);
        self.crossIcon(true);
        self.optionsBox(true);
    };

    //hide options box when click on hamburger icon, alternate between hamburger and cross icons
    this.hideOptions = function() {
        self.crossIcon(false);
        self.hamburgerIcon(true);
        self.optionsBox(false);
    };

    this.pageRefresh = function() {
        //recenter the map
        self.recenterMap();
        //remove any selected list item
        self.setStudio(null);
        //reset filter text-box
        self.filter("");
        //reset all markers
        self.venueList().forEach (function (venue) {
            venue.resetMarker();
        });
    };
}

var vm = new ViewModel(); 
ko.applyBindings (vm);
