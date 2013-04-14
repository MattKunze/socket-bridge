'use strict'

describe 'Controller: TunnelInfoCtrl', () ->

  # load the controller's module
  beforeEach module 'socketBridgeYoApp'

  TunnelInfoCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    TunnelInfoCtrl = $controller 'TunnelInfoCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3;
