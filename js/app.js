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
        //center: {lat: 37.77733, lng: -122.441415}, //Panhandle
        center: {lat: 37.776259, lng: -122.432758}, //Painted Lady
        zoom: 14,
        styles: styles,
        mapTypeControl: false
    });
/*
    //this did not turn out well. zoom is way off
    var bounds = new google.maps.LatLngBounds();
    vm.venueList().forEach (function (venue) {
         bounds.extend(venue.marker.position);
    })
    map.fitBounds(bounds);*/
}


//Load data from Foursquare
function foursquareCall(dataArray) {
    var foursquareUrl = "https://api.foursquare.com/v2/venues/search?ll=37.77926,-122.419265&query=yoga&radius=5000&client_id=POWMWFWIJYX2DYSPVDZGWUALNC4RON5ROTEPHNDZKIYOTUTR&client_secret=PHC4Z52PPQJM5SMCLNN4UAGVYW5PQIKOWX23FDQWLCVB3J3S&v=20170203";

    //Handle Error
    var requestTimeout = setTimeout (function(){
        window.alert ("Foursquare is taking longer than usual to response.");
    }, 5000); //wait 5 sec

    $.ajax({
        url: foursquareUrl,
        dataType: 'jsonp',
        success: function (response) {
            //If ajax resquest went through, abort error alert
            clearTimeout (requestTimeout);

            var result = response.response.venues;
            //push each item of the Foursquare response into venueList array, while conveniently convert them into Venue instances
            result.forEach (function (item) {
                dataArray.push(new Venue(item)); 
            })
        }
    });
}

//Model 
//constructor function for each yoga studio (i.e. Venue instance) to be place on the map
var Venue = function (data) {
    var self = this;
    this.name = ko.observable(data.name);
    this.address = data.location.address;
    this.phone = data.contact.formattedPhone;
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
                    })

    this.toggleBounce = function() {
        self.marker.setAnimation(google.maps.Animation.BOUNCE);
        setTimeout(function () {
            self.marker.setAnimation(null);
        }, 1450);
      }

    this.infowindow = new google.maps.InfoWindow ({
        content: '<div>' + 'Name: ' + self.name() + '<br><br>'
                        + 'Address: ' + self.address + '<br><br>' 
                        + 'Phone: ' + self.phone + '</div>',
        position: new google.maps.LatLng (self.lat, self.lng),
        isOpen: false
    })

    this.openInfoWindow = function () {
        self.infowindow.open(map, self.marker);
        self.infowindow.isOpen = true;
    }

    this.closeInfoWindow = function () {
        self.infowindow.close(map, self.marker);
        self.infowindow.isOpen = false;
    }

    //Create an onclick event to open an infowindow when each marker is clicked
    this.marker.addListener('click', function() {
        if (self.infowindow.isOpen == true) {
            self.closeInfoWindow ();
            self.marker.setIcon(markerImage);
        }
        else
            self.openInfoWindow();
    })

    this.showInfo = function () {
        map.panTo(self.marker.getPosition());
        self.marker.setIcon(selectedMarkerImage);
        self.marker.setVisible(true);
        self.toggleBounce();
        self.openInfoWindow();
    }
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
    }
    
    this.recenterMap = function () {
        map.panTo(new google.maps.LatLng (37.77733, -122.44141));
    }
    
    //Filter
    this.filter = ko.observable(""); //has to specify type string for lower case method to kick in
    this.filterByKeyword = ko.computed (function() {
        var filter_text = self.filter().toLowerCase();
        if (!filter_text) {
            self.venueList().forEach (function (venue) {
                venue.marker.setVisible(true);
            })
            //make sure the Google Maps API is finished loading or var map is considered undefined
            if (map !== undefined) {
                self.recenterMap();
            }
            return self.venueList();
        }
        else {
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
            })
        }
    }, ViewModel);

    this.pageRefresh = function() {
        //recenter the map
        self.recenterMap();
        //remove any selected list item
        self.setStudio(null);
    }

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
}

var vm = new ViewModel(); 
ko.applyBindings (vm);
