angular.module('socketBridgeApp')
  .controller 'TunnelListCtrl', ($scope, $http) ->

    $scope.tunnels = []
    ($http.get '/api/tunnels').success (data) ->
      $scope.tunnels = data
