(function() {
  var Sun = function() {
    var _shinePromise = $.Deferred();
    return {
      whenShine : function() {
        return _shinePromise.promise();
      },
      shine : function() {
        _shinePromise.resolve();
      }
    };
  };
  var sun = new Sun();

  var $roomView = $("<div></div>");

  var RoomView = function() {
    _lightenRoom = function() {
      $roomView.attr('class', 'light');
    };
    sun.whenShine().then(_lightenRoom);
  };

  var roomView = new RoomView();

  describe("the room", function() {
    it( "becomes light when sun shine", function() {
      sun.shine();
      expect($roomView).toHaveClass('light');
    });
  });
})();
