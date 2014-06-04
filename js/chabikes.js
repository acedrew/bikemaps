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
    }
    google.maps.event.addListener(window.bikeMarkers[station.id], 'click', function (mouseEvent) {
        dataWindow.open(map);
    });

        
}
    
function drawBus(bus) {
    if(bus.properties.route == "U") {
        return
    }
    var color = "#000000";
    var headings = {
        N: 0,
        NNE: 22.5,
        NE: 45,
        ENE: 67.5,
        E: 90,
        ESE: 112.5,
        SE: 135,
        SSE: 157.5,
        S: 180,
        SSW: 202.5,
        SW: 225,
        WSW: 247.5,
        W: 270,
        WNW: 292.5,
        NW: 315,
        NNW: 337.5
    }
    if(bus.properties.route == "33" || bus.properties.route == "34") {
        color = "#029f5b"
    }
    var symbol = {
        path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
        scale: 3,
        rotation: heading,
        fillColor: color,
        strokeColor: color
    }
    buslocation =  new google.maps.LatLng(bus.geometry.coordinates[1], bus.geometry.coordinates[0]);
    var heading = headings[bus.properties.heading];
    if(!window.buses[bus.id]) {
        window.buses[bus.id] = new google.maps.Marker({
            position: buslocation,
            title: ("Bus #" + bus.id + ", Route #" + bus.properties.route),
            icon: symbol,
            map: map,
            properties: bus.properties
            });
            google.maps.event.addListener(window.buses[bus.id], 'click', function (mouseEvent) {
                var dataWindow = new google.maps.InfoWindow({
                    content:  ("Bus #" + bus.id + ", Route #" + bus.properties.route + ", Towards: " + bus.properties.stop),
                    position: window.buses[bus.id].position
                });
                dataWindow.open(map);
            });
    } else {
        window.buses[bus.id].setPosition(buslocation);
        var iconUpdate = window.buses[bus.id].getIcon();
        iconUpdate.rotation = heading;
        window.buses[bus.id].setIcon(iconUpdate);
    }
}
    
function killBus(bus) {
    if(window.buses[bus.id]) {
        window.buses[bus.id].setMap(null);
        window.buses[bus.id] = null;
        delete window.buses[bus.id];
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
function reset(map) {
    console.log('reset');
    var keys = [];
    for(var k in window.buses) keys.push(k);
    var i = keys.length;
    while(i--) {
        window.buses[keys[i]].setMap(null);
        window.buses[keys[i]] = null;
        delete window.buses[keys[i]];
    }
    chabusInitialize(map);
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
