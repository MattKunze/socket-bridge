'use strict'

describe 'Controller: ServerHistoryCtrl', () ->

  # load the controller's module
  beforeEach module 'socketBridgeYoApp'

  ServerHistoryCtrl = {}
  scope = {}

  # Initialize the controller and a mock scope
  beforeEach inject ($controller, $rootScope) ->
    scope = $rootScope.$new()
    ServerHistoryCtrl = $controller 'ServerHistoryCtrl', {
      $scope: scope
    }

  it 'should attach a list of awesomeThings to the scope', () ->
    expect(scope.awesomeThings.length).toBe 3;
