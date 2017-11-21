angular.module('starter.services', [])

.factory('PasswordService', function($q, $http) {
    return {
        change: function (pw, taxiid) {
            return $http.post(MAIN_URL+"/changePassword.php", {
                    taxiid: taxiid,
                    password: pw
                }).then(function(response) {
                    return response.data;
                });
        }
    }
})

.factory('RequestService', function($q, $http) {
    return {
        request: function(formData) {
            return $http.post(MAIN_URL+"/trip_add.php", formData).then(function(response) {
                console.log(response);
                return response.data;
            });
        }
    }
})

.factory('LoginService', function($q, $http) {
    return {
        loginUser: function(name, pw) {
            return $http.post(MAIN_URL+"/login.php", {
                    username: name,
                    password: pw
                }).then(function(response) {
                    //console.log(response);
                    window.localStorage.setItem("session_user", JSON.stringify(response.data));
                    return response.data;
                });
        }
    }
})

.factory('TripsService', function($http) {
  // Might use a resource here that returns a JSON array
  var trips = [];

  return {
    remove: function(trip) {
      trips.splice(trips.indexOf(trip), 1);
    },
    getAll: function(user_phone) {
      return $http.post(MAIN_URL+"/trip_all.php", {user_phone: user_phone})
                .then(function(response) {
        			trips = response.data;
        			return trips;
        		});
    },
    countAll: function (user_phone) {
      return $http.post(MAIN_URL+"/trip_count_all.php", {user_phone: user_phone})
                .then(function(response) {
        			trips_num = response.data;
        			return trips_num;
        		});
    },
    getOne: function(tripID) {
        return $http.post(MAIN_URL+"/trip_one.php", {id: tripID})
                  .then(function(response) {
          			trip = response.data;
          			return trip;
          		});
    }
  };
})

.factory('NodeService', function($http) {
  var nodes = [];

  return {
    getAll: function() {
      return $http.post(MAIN_URL+"/api/node.php", {})
                .then(function(response) {
                    //console.log(response.data);
        			return response.data;
        		});
    },
    getOne: function(id) {
        return $http.post(MAIN_URL+"/api/node_one.php", {id: id})
                  .then(function(response) {
                      var adr = [];
                      if (response.data.hem) adr.push(response.data.hem);
                      if (response.data.ngach) adr.push(response.data.ngach);
                      if (response.data.ngo) adr.push(response.data.ngo);
                      if (response.data.duong) adr.push(response.data.duong);
                      if (response.data.huyen) adr.push(response.data.huyen);
                      if (response.data.diachi) adr.push(response.data.diachi);
                      response.data.address = adr.join(', ');
          			return response.data;
          	});
    }
  };
})


.factory('HistoryService', function($http) {
  var histories = [];

  return {
    getAll: function(taxiID) {
      return $http.post(MAIN_URL+"/paycoin_all.php", {taxiid: taxiID})
                .then(function(response) {
        			histories = response.data;
                    console.log(histories);
        			return histories;
        		});
    },
    getOne: function(hID) {
        return $http.post(MAIN_URL+"/paycoin_one.php", {id: hID})
                  .then(function(response) {
          			history = response.data;
          			return history;
          		});
    }
  };
})


.factory('InfriengeService', function($http) {
  var infrienges = [];

  return {
    getAll: function(taxiID) {
      return $http.post(MAIN_URL+"/infrienge_all.php", {taxiid: taxiID})
                .then(function(response) {
        			infrienges = response.data;
                    console.log(infrienges);
        			return infrienges;
        		});
    },
    getOne: function(iID) {
        return $http.post(MAIN_URL+"/infrienge_one.php", {id: iID})
                .then(function(response) {
          			infrienge = response.data;
          			return infrienge;
                });
    }
  };
})
