'use strict'

describe 'Controller: TunnelListCtrl', () ->

  # load the controller's module
  beforeEach module 'socketBridgeYoApp'

  TunnelListCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    TunnelListCtrl = $controller 'TunnelListCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3;
