angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicSideMenuDelegate, $state, $ionicHistory, $rootScope, $timeout, $ionicLoading, $location) {
    $scope.userData = userData = JSON.parse(window.localStorage.getItem("session"));
})

.controller('TripsCtrl', function($scope, $state, TripService, $ionicPopup, $interval, $timeout, $ionicNavBarDelegate, $ionicLoading) {
    $ionicNavBarDelegate.showBackButton(false);
    $scope.userData = userData = JSON.parse(window.localStorage.getItem("session"));

    $ionicLoading.show({
        content: 'Loading',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 0
    });
    TripService.getAll(userData.id).then(function(response) {
        $timeout(function() {
            $scope.trips = response; //Assign data received to $scope.data
            $ionicLoading.hide();
        }, 1000);
    });
    $scope.view = function(tripID) {
        $state.go('tab.trips.view', {tripID: tripID});
    }
})
.controller('TripsViewCtrl', function($scope, $state, $stateParams, TripService, $ionicPopup, $interval, $ionicNavBarDelegate, $ionicLoading, $timeout) {
    $ionicNavBarDelegate.showBackButton(true);
    $scope.userData = userData = JSON.parse(window.localStorage.getItem("session"));

    $ionicLoading.show({
        content: 'Loading',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 0
    });
    TripService.getOne($scope.hID).then(function(response) {
        $timeout(function() {
            $scope.trip = response; //Assign data received to $scope.data
            $ionicLoading.hide();
        }, 1000);
    });
})

.controller('MapCtrl', function($scope, $state, $cordovaGeolocation, $timeout, RequestService, $ionicPopup) {
    var options = {timeout: 10000, enableHighAccuracy: true};
    markerArray = [];

    $scope.request = function () {
        from = document.getElementById('start').value;
        to = document.getElementById('end').value;
        name = document.getElementById('name').value;
        phone = document.getElementById('phone').value;
        seat = document.getElementById('seat').value;
        guess_num = document.getElementById('guess_num').value;
        time = document.getElementById('time').value;
        is_round = document.getElementById('is_round').value;
        details = document.getElementById('details').value;
        PNR = document.getElementById('PNR').value;
        //console.log(name+' '+phone+' '+from+' '+to+' '+seat+' '+guess_num+' '+PNR);
        if (name && phone && from && to && seat > 0 && guess_num > 0 && time) {
            formData = {
                'name': name,
                'phone': phone,
                'from': from,
                'to': to,
                'seat': seat,
                'guess_num': guess_num,
                'PNR': PNR,
                'time': time,
                'is_round': is_round,
                'details': details
            };
            //console.log(formData);
            RequestService.request(formData).then(function(data) {
                console.log(data);
                if (data == 1) {
                    var alertPopup = $ionicPopup.alert({
                        title: 'Thành công!',
                        template: 'Chuyến của bạn đã được gửi! Admin sẽ kiểm duyệt và liên hệ với bạn theo số điện thoại đã đăng kí trong thời gian sớm nhất.',
                        scope: $scope,
                        buttons: [{
                              text: 'Đóng',
                              type: 'button-assertive'
                        }]
                    });
                }
            })
        } else {
            var alertPopup = $ionicPopup.alert({
                title: 'Lỗi!',
                template: 'Bạn phải nhập đầy đủ thông tin để đặt xe!',
                scope: $scope,
                buttons: [{
                      text: 'Đóng',
                      type: 'button-assertive'
                }]
            });
        }
    }

    $scope.showSteps = function (directionResult, markerArray, stepDisplay, map) {
    	// For each step, place a marker, and add the text to the marker's infowindow.
    	// Also attach the marker to an array so we can keep track of it and remove it
    	// when calculating new routes.
    	var myRoute = directionResult.routes[0].legs[0];
    	for (var i = 0; i < myRoute.steps.length; i++) {
    		var marker = markerArray[i] = markerArray[i] || new google.maps.Marker;
    		marker.setMap(map);
    		marker.setPosition(myRoute.steps[i].start_location);
    		$scope.attachInstructionText(stepDisplay, marker, myRoute.steps[i].instructions, map);
    	}
    }

    $scope.attachInstructionText = function (stepDisplay, marker, text, map) {
    	google.maps.event.addListener(marker, 'click', function() {
    		// Open an info window when the marker is clicked on, containing the text
    		// of the step.
    		stepDisplay.setContent(text);
    		stepDisplay.open(map, marker);
    	});
    }

    $scope.calculateAndDisplayRoute = function (directionsDisplay, directionsService, stepDisplay, map) {
        console.log(document.getElementById('start').value);
        console.log(document.getElementById('end').value);

    // First, remove any existing markers from the map.
	for (var i = 0; i < markerArray.length; i++) {
		markerArray[i].setMap(null);
	}
    markerArray = [];

	// Retrieve the start and end locations and create a DirectionsRequest using
	// {travelMode} directions.
	directionsService.route({
		origin: document.getElementById('start').value,
		destination: document.getElementById('end').value,
		travelMode: document.getElementById('travelMode').value // DRIVING | BICYCLING | TRANSIT | WALKING
	}, function(response, status) {
		// Route the directions and pass the response to a function to create
		// markers for each step.
		if (status === 'OK') {
			document.getElementById('warnings-panel').innerHTML = '<b>' + response.routes[0].warnings + '</b>';
			directionsDisplay.setDirections(response);

        	$scope.showSteps(response, stepDisplay, map);

			var distance = response.routes[0].legs[0].distance.text;
			var time = response.routes[0].legs[0].duration.text;
			document.getElementById('box-search-one-distance').innerHTML = distance;
			document.getElementById('box-search-one-time').innerHTML = time;
			document.getElementById('box-search-one-route').visibility = true;
		} else {
			console.log('Directions request failed due to ' + status);
		}
	});
    }

    $scope.getDirection = function (map, pos) {
    	map.setZoom(13);

    	// Instantiate a directions service.
    	var directionsService = new google.maps.DirectionsService;
    	var geocoder = new google.maps.Geocoder();

		map.setCenter(pos);

		geocoder.geocode({
			'location': pos
		}, function (results, status) {
			if (status == google.maps.GeocoderStatus.OK) {
				if (results[0]) {
				//	document.getElementById('start').value = results[0].formatted_address;

        			// Create a renderer for directions and bind it to the map.
        			var directionsDisplay = new google.maps.DirectionsRenderer({map: map});
        			// Instantiate an info window to hold step text.
        			var stepDisplay = new google.maps.InfoWindow;

					$scope.calculateAndDisplayRoute(directionsDisplay, directionsService, stepDisplay, map);
				} else {
					console.log('No results found');
				}
			} else {
				console.log('Geocoder failed due to: ' + status);
			}
		});

    }

    $scope.map_select = function(map, autocomplete, infowindow, type) {
        for (var i = 0; i < markerArray.length; i++) {
    		markerArray[i].setMap(null);
    	}
        markerArray = [];

        var labels = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

        var infowindowContent = document.getElementById('infowindow-content-'+type);
		infowindow.setContent(infowindowContent);

        infowindow.close();
        var place = autocomplete.getPlace();
        if (!place.geometry) {
            return;
        }
        if (place.geometry.viewport) {
            map.fitBounds(place.geometry.viewport);
        } else {
            map.setCenter(place.geometry.location);
            map.setZoom(10);
        }
        console.log(place);
        if (type == 0) document.getElementById('start').value = place.formatted_address;
        else if (type == 1) document.getElementById('end').value = place.formatted_address;

        index = type;
        var marker_now = new google.maps.Marker({
            label: labels[index++ % labels.length],
            map: map
        });
        marker_now.setPlace({
            placeId: place.place_id,
            location: place.geometry.location
        });

        marker_now.setVisible(true);
        google.maps.event.addListener(marker_now, 'click', function() {
            infowindow.setContent('<div><strong>'+place.name+'</strong><br/>' + place.formatted_address + '<br>' +
            place.place_id + '</div>');
            infowindow.open(map, this);
        });

        if (document.getElementById('start').value != null && document.getElementById('end').value != null)
            $scope.getDirection(map, place.geometry.location);
    }

    var myLatlng = new google.maps.LatLng(43.07493,-89.381388);

    var mapOptions = {
      center: myLatlng,
      zoom: 16,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    var map = new google.maps.Map(document.getElementById("map"),
        mapOptions);

    $cordovaGeolocation.getCurrentPosition(options).then(function(position) {
        var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);
        console.log(position.coords.latitude);
        console.log(position.coords.longitude);

        var mapOptions = {
            zoom: 15,
            mapTypeId: google.maps.MapTypeId.ROADMAP,
            center: latLng
        };

        $scope.map = new google.maps.Map(document.getElementById("map"));

        //Wait until the map is loaded
        google.maps.event.addListenerOnce($scope.map, 'idle', function() {
            var marker = markerArray[0] = new google.maps.Marker({
                map: $scope.map,
                position: latLng,
                animation: google.maps.Animation.DROP
            });

            /*var infoWindow = new google.maps.InfoWindow({
                content: "Here I am!"
            });

            google.maps.event.addListener(marker, 'click', function () {
                infoWindow.open($scope.map, marker);
            });*/


            var sidebar = document.getElementById('pac-sidebar');
            var from = document.getElementById('pac-from');
            var to = document.getElementById('pac-to');
            $scope.map.controls[google.maps.ControlPosition.LEFT].push(sidebar);

            var autocomplete_from = new google.maps.places.Autocomplete(from);
            var autocomplete_to = new google.maps.places.Autocomplete(to);
            autocomplete_from.bindTo('bounds', $scope.map);
            autocomplete_to.bindTo('bounds', $scope.map);


            var infowindow = new google.maps.InfoWindow();

            autocomplete_to.addListener('place_changed', function() {
                $scope.map_select($scope.map, autocomplete_to, infowindow, 1);
            });
            autocomplete_from.addListener('place_changed', function() {
                $scope.map_select($scope.map, autocomplete_from, infowindow, 0);
            });

        });

    }, function(error) {
        console.log("Could not get location");
        console.log(error);
    });

})

.controller('LogoutCtrl', function($scope, $ionicPopup, $state) {
    window.localStorage.removeItem("session");
    userData = null;
    navIcons = document.getElementsByClassName("ion-navicon");
    for (i = 0; i < navIcons.length; i++) navIcons[i].classList.add("ng-hide");
    $state.go('tab.login');
})

.controller('LoginCtrl', function($scope, LoginService, $ionicPopup, $state, $ionicSideMenuDelegate, $ionicNavBarDelegate, $ionicHistory, $rootScope) {
    $ionicNavBarDelegate.showBackButton(false);

    $scope.data = {};

    $scope.login = function() {
        LoginService.loginUser($scope.data.username, $scope.data.password).then(function(data) {
            console.log(data);
            if (data == -1) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Lỗi!',
                    template: 'Tên đăng nhập hoặc mật khẩu không đúng!',
                    scope: $scope,
                    buttons: [{
                          text: 'Đóng',
                          type: 'button-assertive'
                    }]
                });
            } else if (data == 0) {
                var alertPopup = $ionicPopup.alert({
                    title: 'Lỗi!',
                    template: 'Tên đăng nhập hoặc mật khẩu không đúng!',
                    scope: $scope,
                    buttons: [{
                          text: 'Đóng',
                          type: 'button-assertive'
                    }]
                });
            } else {
                userData = data;

                //document.getElementsByTagName("info")[0].innerHTML = userData.name;
                //document.getElementsByTagName("coin")[0].innerHTML = userData.coin+"k";

                navIcons = document.getElementsByClassName("ion-navicon");
                for (i = 0; i < navIcons.length; i++) navIcons[i].classList.remove("ng-hide");

                $state.go('tab.map');
            }
        })
    }
})

.controller('AccountCtrl', function($scope, $state, $stateParams, $ionicPopup, $interval, $timeout, $ionicNavBarDelegate, $ionicLoading) {
    $ionicNavBarDelegate.showBackButton(false);
    $scope.userData = userData = JSON.parse(window.localStorage.getItem("session"));

    if (userData) {
        $ionicLoading.show({
            content: 'Loading',
            animation: 'fade-in',
            showBackdrop: true,
            maxWidth: 200,
            showDelay: 0
        });
        $timeout(function() {
            console.log(userData);
            $scope.account = userData;
            $ionicLoading.hide();
        }, 1000);
    }
});
