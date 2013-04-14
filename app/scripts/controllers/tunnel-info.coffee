angular.module('socketBridgeApp')
  .controller 'TunnelInfoCtrl', ($scope) ->
    $scope.tunnel = $scope.$parent.tunnel

