'use strict'

angular.module('socketBridgeApp')
  .controller 'ServerHistoryCtrl', ($scope, $http) ->

    history = []
    ($http.get '/api/history').success (data) ->
      $scope.history = data

