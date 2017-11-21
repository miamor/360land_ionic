var browser = {
    isMobile: window.navigator.userAgent.indexOf('iPad') > 0
};
var minZoomAllowSearch = 10;
var minZoom = 5;
var defaultCenter = '20.9947910308838:105.86784362793003'; // hanoi
var options = {city:'',district:'',ward:'',street:''};
//var c_city = c_district = null;
var city = district = ward = street = project = null;
var markerSize = new google.maps.Size(23, 26);
var labelOrigin = new google.maps.Point(0,0);
var iconMarker = {
    default: {
        url: MAIN_URL+'/assets/img/marker5.png',
        scaledSize: markerSize,
        size: markerSize,
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(0, 32)
    },
    hover: {
        url: MAIN_URL+'/assets/img/marker-hover.png',
        scaledSize: markerSize,
        size: markerSize,
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(0, 32)
    },
    select: {
        url: MAIN_URL+'/assets/img/marker.png',
        /*scaledSize: new google.maps.Size(30, 36),
        size: new google.maps.Size(30, 36),
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(0, 32)*/
        scaledSize: markerSize,
        size: markerSize,
        origin: new google.maps.Point(0, 0),
        anchor: new google.maps.Point(0, 32)
    }
};

var zoom_markerView = 13;
var zoom_moderate = 11;
var zoom_utilityView = 16;
var cityList = [];


angular.module('starter.controllers', [])

.controller('AppCtrl', function($scope, $ionicSideMenuDelegate, $state, $ionicHistory, $rootScope, $timeout, $ionicLoading, $location) {
    $scope.userData = userData = JSON.parse(window.localStorage.getItem("session_user"));
    if (!userData) {
        $ionicLoading.hide();
        $state.go('tab.map');
        return false;
    } else {
        // kill this session every 2 seconds
    }
})

.controller('SearchCtrl', function($scope, $state, TripsService, $ionicPopup, $interval, $timeout, $ionicNavBarDelegate, $ionicLoading, $location, $rootScope) {
    $ionicNavBarDelegate.showBackButton(false);
    $scope.userData = userData = JSON.parse(window.localStorage.getItem("session_user"));

    $ionicLoading.show({
        content: 'Loading',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 0
    });

    $scope.check = function () {
        TripsService.countAll(userData.phone).then(function(num) {
            var trips_num = window.localStorage.getItem('trips_num');
            console.log(num+' ~ '+trips_num);
            if (num != trips_num) $scope.refreshItems();
        })
    }

    $scope.theInterval = null;

    $scope.$on('$stateChangeSuccess', function(event, toState, toParams, fromState, fromParams) {
    	if ($location.path() == "/tab/trips") {
            $scope.theInterval = $interval(function(){
                $scope.check();
            }.bind(this), 1000);
            $scope.$on('$destroy', function () {
                $interval.cancel($scope.theInterval)
            });

            $scope.refreshItems();
        }
    });

    $scope.refreshItems = function () {
        if (userData) {
            $ionicLoading.show({
                content: 'Loading',
                animation: 'fade-in',
                showBackdrop: true,
                maxWidth: 200,
                showDelay: 0
            });

            TripsService.getAll(userData.phone).then(function(response) {
                console.log('hehe');
                console.log(response);
                var trips_num = response.total;
                window.localStorage.setItem('trips_num', trips_num);

                $scope.trips = response.data;

                $ionicLoading.hide();
            });
        }
    }

    $scope.view = function(tripID) {
        $state.go('tab.trips.view', {tripID: tripID});
    }
})
.controller('TripsViewCtrl', function($scope, $state, $stateParams, TripsService, $ionicPopup, $interval, $ionicNavBarDelegate, $ionicLoading, $timeout) {
    $ionicNavBarDelegate.showBackButton(true);
    $scope.userData = userData = JSON.parse(window.localStorage.getItem("session_user"));

    $ionicLoading.show({
        content: 'Loading',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 0
    });

    $scope.tripID = $stateParams.tripID;
    $scope.trip = {};

    TripsService.getOne($scope.tripID).then(function(response) {
        $timeout(function() {
            console.log(response);
            console.log('~~~');
            $scope.trip = response;

            if (response.is_round == 0) {
                document.getElementsByTagName("notround")[0].classList.remove("ng-hide");
                document.getElementsByTagName("round")[0].classList.add("ng-hide");
            } else {
                document.getElementsByTagName("round")[0].classList.remove("ng-hide");
                document.getElementsByTagName("notround")[0].classList.add("ng-hide");
            }
            $scope.trip = response; //Assign data received to $scope.data

            $ionicLoading.hide();
        }, 100);
    });
})

.controller('MapCtrl', function($scope, $state, $cordovaGeolocation, $timeout, $interval, NodeService, $ionicPopup, ionicTimePicker, ionicDatePicker, $ionicLoading) {
    $ionicLoading.show({
        content: 'Loading',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 0
    });

    var options = {timeout: 10000, enableHighAccuracy: true};
    markerArray = [];

    $scope.disableTap = function() {
        container = document.getElementsByClassName('pac-container');
        for (i = 0; i < container.length; i++) {
            container[i].setAttribute('data-tap-disabled', 'true');
        }
        console.log('disableTap');
    }

    $scope.goback = function () {
        detailsForm = document.getElementById('trip-user-details');
        detailsForm.classList.remove('active');
    }



    $scope.data = [];
    $scope.dataProject = [];
    $scope.map = null;
    $scope.mapPoly = null;
    $scope.polyline = null;
    $scope.listLatlgn = null;
    $scope.projectOverlay = new Array();
    $scope.markerCluster = null;
    $scope.markerPoint = new google.maps.Marker();
    $scope.autocomplete = null;
    $scope.geocoder = new google.maps.Geocoder();
    $scope.circle = null;

    $scope.currentPID = null;
    $scope.currentPjID = null;
    $scope.currentUID = null;

    $scope.BoxSearchPlace = null;
    $scope.tooltip = null;
    //$scope.btnUpdateMapIdleResult = $('.btn-map-update-result');
    //$scope.isDrawing = s.lstPoint != undefined && s.lstPoint != '';
    $scope.isDrawing = false;
    $scope.isMapIdle = false;
    $scope.isShowRefreshButton = false;
    $scope.isShowUtil = false;
    $scope.isDetails = false;
    $scope.infoBoxOptions = {
        disableAutoPan: false,
        maxWidth: 0,
        pixelOffset: new google.maps.Size(-188, 20),
        zIndex: 1000,
        boxClass: 'bdsInfoWindow',
        closeBoxURL: "http://file4.batdongsan.com.vn/images/Product/Maps/close.png",
        infoBoxClearance: new google.maps.Size(1, 1),
        isHidden: false,
        alignBottom: true,
        enableEventPropagation: false
    };
    $scope.infoWindow = new google.maps.InfoWindow();
    $scope.infoTipWindow = new google.maps.InfoWindow({
        maxWidth: 250,
        maxHeight: 120
    });
    $scope.searchtype = 0;
    $scope.isMapResize = false;

    $scope.minLat = $scope.minLng = $scope.maxLat = $scope.maxLng = null;
    $scope.pointPos = null;
    $scope.circleAroundSearchPoint = null;

    $scope.init = function (lat, lng) {
        var k = {
            center: new google.maps.LatLng(lat, lng),
            zoom: zoom_moderate,
            MapTypeId: google.maps.MapTypeId.ROADMAP,
            draggable: true,

            overviewMapControl: true,
            overviewMapControlOptions: {
                opened: false
            },
            panControl: false,
            rotateControl: false,
            scaleControl: false,
            mapTypeControl: false,
            mapTypeControlOptions: {
                style: google.maps.MapTypeControlStyle.DROPDOWN_MENU,
                position: google.maps.ControlPosition.LEFT_TOP
            },
            zoomControl: false,
            zoomControlOptions: {
                position: google.maps.ControlPosition.LEFT_BOTTOM
            },
            fullscreenControl: false,
            fullscreenControlOptions: {
                position: google.maps.ControlPosition.LEFT_BOTTOM
            },
            streetViewControl: false,
            streetViewControlOptions: {
                position: google.maps.ControlPosition.LEFT_BOTTOM
            }
        };
        $scope.map = new google.maps.Map(document.getElementById('map'), k);

        this.map.controls[google.maps.ControlPosition.RIGHT_TOP].push(document.getElementById('controlUtility'));
        this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('mapSide'));

        var styles = [{"featureType":"administrative","elementType":"geometry","stylers":[{"visibility":"off"}]},{"featureType":"poi","stylers":[{"visibility":"off"}]},{"featureType":"road","elementType":"labels.icon","stylers":[{"visibility":"off"}]},{"featureType":"transit","stylers":[{"visibility":"off"}]}];
        var styledMap = new google.maps.StyledMapType(styles, {name: "Styled Map"});
        this.map.mapTypes.set('styled_map', styledMap);
        this.map.setMapTypeId('styled_map');

        this.map.controls[google.maps.ControlPosition.LEFT_TOP].push(document.getElementById('controlArea'));
        $('#controlArea').show();

        var input = document.getElementById('input_location');
        var options = {
            //types: ['(cities)'],
            componentRestrictions: {country: 'vn'}
        };
        this.markerPoint.setMap($scope.map);
        this.markerPoint.setVisible(false);

        this.autocomplete = new google.maps.places.Autocomplete(input, options);
        this.autocomplete.bindTo('bounds', this.map);

        google.maps.event.addDomListener(input, 'keydown', function(event) {
            if (event.keyCode === 13) {
                event.preventDefault();
            }
        });

        this.autocomplete.addListener('place_changed', function() {
            var place = $scope.autocomplete.getPlace();
            $scope.searchByLocation(place);
            //return false;
        });

        var locationData = null;
        if (this.listLatlgn != null) {
            this.polyline = new google.maps.Polygon({
                path: this.listLatlgn,
                editable: true,
                strokeColor: '#08b0e4',
                strokeWeight: 1,
                fillColor: '#00c2ff',
                fillOpacity: 0.1
            });
            this.polyline.setMap(this.map);
            this.findPoint(this.polyline);
            this.catchChangePolyline();
        }


        $scope.theInterval = null;

        $scope.theInterval = $interval(function() {
            var pacContainers = document.getElementsByClassName('pac-container');
            if (pacContainers.length) {
                $interval.cancel($scope.theInterval);
                $scope.disableTap();

                // load nodes
                $scope.loadNodes();

                $ionicLoading.hide();
            }
        }.bind(this), 1000);

        $scope.$on('$destroy', function () {
            $interval.cancel($scope.theInterval)
        });

    };


    $scope.geocodeaddress = function (address) {
        $scope.geocoder.geocode({'address': address}, function(results, status) {
            if (status === 'OK') {
                //$scope.map.setCenter(results[0].geometry.location);
                return results[0]
            } else {
                return false;
            }
        });
    }

    this.showSearchPoint = function () {
        $scope.map.setCenter($scope.pointPos);

        if (!this.currentPID) this.map.setZoom(zoom_moderate);
        else this.map.setZoom(zoom_markerView);

        //$scope.map.setZoom(zoom_moderate);
        $scope.markerPoint.setPosition($scope.pointPos);
        $scope.markerPoint.setVisible(true);

        if (this.circleAroundSearchPoint == null) {
            this.circleAroundSearchPoint = new google.maps.Circle({
                center: $scope.pointPos,
                radius: parseInt($scope.pointRadius),
                strokeColor: '#08b0e4',
                strokeWeight: 1,
                fillColor: '#00c2ff',
                fillOpacity: 0.1
                //fillOpacity: 0.4
            });
        } else {
            this.circleAroundSearchPoint.setOptions({
                center: $scope.pointPos,
                radius: parseInt($scope.pointRadius)
            });
        }
        this.circleAroundSearchPoint.setMap(this.map);
        var bounds = this.circleAroundSearchPoint.getBounds();

        $scope.minLat = bounds.f.b;
        $scope.minLng = bounds.b.b;
        $scope.maxLat = bounds.f.f;
        $scope.maxLng = bounds.b.f;

        if (this.currentPID) {
            this.markerPoint.setVisible(true);
        }
    }

    $scope.searchByLocation = function (place) {
        if (place) {
            $scope.markerPoint.setVisible(false);
            if (!place.geometry) {
                window.alert("No details available for input: '" + place.name + "'");
                return;
            }
            if (place.geometry.viewport) {
                $scope.map.fitBounds(place.geometry.viewport);
            } else {
                //$scope.map.setCenter(place.geometry.location);
                //$scope.map.setZoom(zoom_moderate);
            }
            //$scope.markerPoint.setPosition(place.geometry.location);
            //$scope.markerPoint.setVisible(true);
            //console.log(place);

            $scope.pointPos = place.geometry.location;

            //if (place.geometry.location != this.input.location.value) productControlerObj.ChangeUrlForNewContext();

            this.showSearchPoint();
            //productControlerObj._SearchAction();
        }
    }


    $scope.loadNodes = function () {
        NodeService.getAll().then(function(data) {
            $scope.showMap(data);
        })
    }

    $scope.showMap = function(a, b) {
        this.data = [];
        for (var i = 0; i < a.length; i++) {
            if (this.isInPolyline(a[i].latitude, a[i].longitude)) {
                if (a[i].avatar == null || a[i].avatar == '') a[i].avatar = MAIN_URL+'/assets/img/noimage.png';
                this.data.push(a[i])
            }
        }
        this.showPoint(this.data, b);
        return this.data
    };

    $scope.showPoint = function(a, b) {
        //this.clearPoint();

        $scope.markers = a.map(function(location, i) {
            return new MarkerWithLabel({
                position: new google.maps.LatLng(location.latitude, location.longitude),
                icon: iconMarker.default,
                labelContent: location.price,
                labelAnchor: labelOrigin,
                labelClass: "marker-label", // your desired CSS class
                labelInBackground: true,
            });
        });

        $.each($scope.markers, function (i, oneMarker) {
            //if ($scope.map.getZoom() >= 12) oneMarker.setMap($scope.map);
            oneMarker.id = a[i].id;
            oneMarker.addListener('click', function() {
                $scope.showInfoWindow(this.id);
            });
            oneMarker.addListener('mouseover', function() {
                if (this.id != $scope.currentPID) {
                    this.setIcon(iconMarker.hover)
                }
            });
            oneMarker.addListener('mouseout', function() {
                if (this.id != $scope.currentPID) {
                    this.setIcon(iconMarker.default)
                }
            })
        })
        if (b !== undefined && b) {
            if (this.polyline != undefined && this.polyline != null) {
                var g = new google.maps.LatLngBounds();
                this.polyline.getPath().forEach(function(e) {
                    g.extend(e)
                });
                this.map.fitBounds(g)
            }
        }

        if (this.currentPID) {
            this.showInfoWindow(this.currentPID, true);
        }

        $scope.markerCluster = new MarkerClusterer($scope.map, $scope.markers, {
            imagePath: 'https://developers.google.com/maps/documentation/javascript/examples/markerclusterer/m'
        });
    };

    $scope.showInfoWindow = function(d, isInit = false) {
        if (!isInit) {
            //this.ClearUtilitiesAroundPoint();
            this.isShowUtil = false;
            //this.input.isShowUtil.value = 0;
            //productControlerObj.ChangeUrlForNewContext();
        }
        var data = null;
        var key = null;

        var runSet = false;
        if (!isInit && d != this.currentPID) runSet = true;

        if (d == undefined || d == null) {
            d = this.currentPID;
        } else if (d != this.currentPID && this.currentPID != null) {
            var t = this.findMarkerKey(this.currentPID);
            var u = this.markers[t];

            //this.input.product.value = this.currentPID = d;
            key = this.findMarkerKey(this.currentPID);
            var e = this.markers[key];
            var f = this.findDataInfo(key);
            data = f;
            if (u != undefined && u != null) {
                u.setIcon(iconMarker.default);
                if (f != undefined && f != null) {
                    u.setZIndex(6 - f.vip)
                }
            }
        } else if (d == this.currentPID) {}
        //this.input.product.value = d;

        if (this.markers != undefined) {
            if (!key) key = this.findMarkerKey(d);
            if (!data) data = this.findDataInfo(key);
        }

        if (this.infoTipWindow) this.infoTipWindow.close();
        if (this.infoWindow) this.infoWindow.close();

        if (key != null && data) {
            var h = this.markers[key];
            if (runSet) {
                if (!this.isShowUtil && this.map.getZoom() < zoom_markerView) this.map.setZoom(zoom_markerView);
                else {
                    //this.input.zoom.value = this.map.getZoom();
                    //productControlerObj.ChangeUrlForNewContext();
                }
                this.map.setCenter(h.position);
            }
            h.setIcon(iconMarker.select);
            //h.setZIndex(300);
            this.currentPID = data.id;

            /*if (isInit) {
                if (this.isDetails) {
                    productControlerObj.ShowDetails(this.currentPID);
                } else if (this.isShowUtil) {
                    productControlerObj.ShowMoreInfo(h.position.lat(), h.position.lng());
                }
            }*/

            $('.map-item-info-title').html(data.title);
            $('.map-item-info-price span').html(data.price);
            $('.map-item-info-bed').html(data.room);
            $('.map-item-info-contact_phone').html(data.contact_phone);
            $('.map-item-info-address').html(data.address);
            $('.map-item-info-des').html(data.details);
            $('.map-item-info-thumb').attr('src', data.avatar);
            $('.map-item-view-utilities').hide().attr('href', 'javascript:productControlerObj.ShowMoreInfo(' + data.latitude + ',' + data.longitude + ')');
            //$('.map-item-gotoview').attr('href', 'javascript:productControlerObj.ShowDetails("' + data.id + '")');
            $('.map-item-gotoview').click(function () {
                $state.go('tab.map.view', {id: data.id})
            })

            if (!isInit || !this.isShowUtil) {
                $('.map-item-info-board').show();
            }

            $('.map-item-info-close').click(function () {
                $('.map-item-info-board').hide();
                $scope.closeInfoWindowCallBack(h);
            })
        }
    };


    $scope.closeInfoWindowCallBack = function (h) {
        //if (!this.isShowUtil) {
            h.setIcon(iconMarker.default);
            //this.input.product.value = this.currentPID = '';

            //this.input.isShowUtil.value = 0;
            this.isShowUtil = false;
            //this.ClearUtilitiesAroundPoint();
            //productControlerObj.ChangeUrlForNewContext();
        //}
    };

    $scope.isInPolyline = function(a, b) {
        if (this.polyline != undefined && this.polyline != null) {
            return google.maps.geometry.poly.containsLocation(new google.maps.LatLng(a, b), this.polyline)
        }
        return true
    };
    $scope.clearPoint = function() {
        if (this.infoWindow) this.infoWindow.close();
        //this.ClearUtilitiesAroundPoint();

        if (this.markers != undefined) {
            for (var t = 0; t < this.markers.length; t++) {
                this.markers[t].setMap(null)
            }
            this.markers = []
        }
        if (this.markerCluster != null) {
            this.markerCluster.clearMarkers()
        }
    };
    $scope.callBackClearPointEvent = function() {};

    $scope.findDataInfo = function(i) {
        if (this.data != undefined && this.data.length > 0) {
            return this.data[i]
        }
    };
    $scope.findMarkerKey = function(a) {
        if (this.data != undefined && this.data.length > 0) {
            for (var i = 0; i < this.data.length; i++) {
                if (this.data[i].id == a) {
                    return i
                }
            }
        }
    };
    $scope.findMarker = function(a) {
        if (this.markers != undefined) {
            for (var i = 0; i < this.markers.length; i++) {
                if (this.markers[i].id == a) {
                    return this.markers[i]
                }
            }
        }
        return null
    };

    /*$cordovaGeolocation.getCurrentPosition(options).then(function(position) {
        var latLng = new google.maps.LatLng(position.coords.latitude, position.coords.longitude);

        $scope.init(position.coords.latitude, position.coords.longitude);

    }, function(error) {
        console.log("Could not get location");
    });*/

    $scope.init(21.033, 105.85);
    /*var latLng = new google.maps.LatLng(21.033, 105.85);
    var mapOptions = {
      zoom: 11,
      center: latLng,
      mapTypeId: google.maps.MapTypeId.ROADMAP
    };
    $scope.map = new google.maps.Map(document.getElementById("map"), mapOptions);
    */

})

.controller('MapViewCtrl', function ($scope, $ionicPopup, $state, $timeout, $interval, NodeService, $ionicPopup, $ionicLoading) {
    $ionicLoading.show({
        content: 'Loading',
        animation: 'fade-in',
        showBackdrop: true,
        maxWidth: 200,
        showDelay: 0
    });

    $scope.item = null;
    NodeService.getOne().then(function(data) {
        //$scope.showMap(data);
        $scope.item = data;
        console.log(data);
        $ionicLoading.hide();
    })
})


.controller('LogoutCtrl', function($scope, $ionicPopup, $state) {
    window.localStorage.removeItem("session_user");
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
    $scope.userData = userData = JSON.parse(window.localStorage.getItem("session_user"));

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
