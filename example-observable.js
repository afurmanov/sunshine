(function() {
  var Sun = function() {
    return {
      shining : null
    };
  };

  var sun = new Sun();

  var $roomView = $("<div></div>");

  var RoomView = function() {
    Ember.addObserver(sun, 'shining', function() {
      if (Ember.get(sun, 'shining')) {
        $roomView.attr('class', 'light');
      } else {
        $roomView.attr('class', 'dark');
      }
    });
  };

  var roomView = new RoomView();

  describe("the room", function() {
    it( "becomes light when sun shine", function() {
      Ember.set(sun, 'shining', true);
      expect($roomView).toHaveClass('light');
    });
  });
})();
