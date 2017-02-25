//Load data from Foursquare
function foursquareCall(data) {
    var foursquareUrl = "https://api.foursquare.com/v2/venues/search?ll=37.77926,-122.419265&query=yoga&client_id=POWMWFWIJYX2DYSPVDZGWUALNC4RON5ROTEPHNDZKIYOTUTR&client_secret=PHC4Z52PPQJM5SMCLNN4UAGVYW5PQIKOWX23FDQWLCVB3J3S&v=20170203";

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

            result.forEach (function (item) {
                data.push(new Venue(item));
            })
        }
    });
}

//Model 
//constructor function for each yoga studio (i.e. Venue instance) to be place on the map
var Venue = function (data) {
    var self = this;
    this.name = ko.observable(data.name);
    this.address = ko.observable(data.location.formattedAddress);
    this.phone = ko.observable(data.contact.formattedPhone);
}

//ViewModel constructor function
function ViewModel () {
    var self = this;
    
    this.venueList = ko.observableArray([]);
    foursquareCall(this.venueList);

    //Knockout Bindings for the Header
    //assign initial visibility status for the selection icons and the option box
    this.hamburgerIcon = ko.observable (true);
    this.crossIcon = ko.observable (false);
    this.optionsBox = ko.observable (false);

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

var vm = new ViewModel() 
ko.applyBindings (vm);

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
        //center: {lat: 37.77926, lng: -122.419265}, //City Hall
        zoom: 14,
        styles: styles,
        mapTypeControl: false
    });
}


