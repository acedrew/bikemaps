function drawBikeStation(station) {
    if(station.statusValue === "Not In Service"){
        return;
    }
    var
        color = "#0b497d",
        title = ("Station #" + station.id + ", " + station.stationName + " Bikes: " + station.availableBikes + " Slots: " + station.availableDocks),
        symbol  =   {
            path: window.bikeIcon,
            scale: 0.1,
            rotation: 0,
            fillColor: color,
            fillOpacity: 0,
            strokeColor: color,
            strokeWeight:   1.5,
            anchor: new google.maps.Point(300, 670)
        };
    if(station.availableBikes === 0 || station.availableDocks === 0) {
        symbol.strokeColor = "#8A1E1A";
    } else if(station.availableBikes < 2 || station.availableDocks < 2) {
        symbol.strokeColor = "#C0C908";
    } 
    //symbol.color = "#C0C908";
    var
        bikeLocation = new google.maps.LatLng(station.latitude, station.longitude),
        options = {
            position: bikeLocation,
            title: title,
            icon: symbol,
            map: map,
            properties: station
        },
        dataWindow = new google.maps.InfoWindow({
            content:  title,
            position: options.position
        });
    if(window.bikeMarkers.hasOwnProperty(station.id)) {
        window.bikeMarkers[station.id].setOptions(options);
    } else {
        window.bikeMarkers[station.id]  = new google.maps.Marker(options);
        google.maps.event.addListener(window.bikeMarkers[station.id], 'click', function (mouseEvent) {
            dataWindow.open(map);
        });
    }

        
}
function setCurrentLocation() {
    if (navigator.geolocation) navigator.geolocation.getCurrentPosition(function(pos) {
        var me = new google.maps.LatLng(pos.coords.latitude, pos.coords.longitude);
        if(!window.myloc) {
            window.myloc = new google.maps.Marker({
                clickable: false,
                icon: new google.maps.MarkerImage('//maps.gstatic.com/mapfiles/mobile/mobileimgs2.png',
                                                                new google.maps.Size(22,22),
                                                                new google.maps.Point(0,18),
                                                                new google.maps.Point(11,11)),
                shadow: null,
                zIndex: 999,
                map: window.map // your google.maps.Map object
            });
        } else {
            window.myloc.setPosition(me);
        }
    }, function(error) {
        return;
        // ...
    });

}
function chabikeInitialize(map) {
    var evntSource = new EventSource('http://radiant-caverns-5667.herokuapp.com/api/stations/stream')
    window.bikeMarkers = {};
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", "http://radiant-caverns-5667.herokuapp.com/api/stations", false);
    xmlHttp.send();
    var responseObject = JSON.parse(xmlHttp.responseText);
    window.citybikes = JSON.parse(responseObject).stationBeanList;
    var j = window.citybikes.length;
    while(j--) {
        drawBikeStation(window.citybikes[j]);
    }
    evntSource.onmessage = function (x) {
        var json = JSON.parse(x.data).stationBeanList;
        var j = json.length;
        while(j--) {
            drawBikeStation(json[j]);
        }
    };
}
function chabusInitialize(map) {

    var evntSource = new EventSource('http://api.chab.us/buses/tail')
    window.buses = {};
    xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", "http://api.chab.us/buses", false);
    xmlHttp.send();
    var initialbuses = JSON.parse(xmlHttp.responseText).features;
    var i = initialbuses.length;
    while(i--) {
        if(initialbuses[i].properties.route != "U") {
            drawBus(initialbuses[i]);
        }
    }
    setCurrentLocation();
    
    evntSource.addEventListener('change', function (x) { 
        var json = JSON.parse(x.data);
        drawBus(json);
        setCurrentLocation();
        
    });
    evntSource.addEventListener('remove', function (x) { 
        var json = JSON.parse(x.data);
        killBus(json);
    });
    //document.addEventListener("visibilitychange", function() { reset(map) });
    google.maps.event.addListenerOnce(map, 'idle', function(){
        document.querySelector("#footer-grab").style.bottom = document.querySelector(".gm-style-cc").clientHeight.toString() + "px";
        console.log(document.querySelector(".gm-style-cc").clientHeight);
    });
    window.onresize = resizeScreen;
    
    

}
