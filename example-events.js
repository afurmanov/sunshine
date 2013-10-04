(function() {
  var Sun = function() {
    return {
      shine : function() {
        EventsHub.dispatch('SUN.SHINE');
      }
    };
  };
  var sun = new Sun();

  var $roomView = $("<div></div>");

  var RoomView = function() {
    EventsHub.subscribe( 'SUN.SHINE', function() {
      $roomView.attr('class', 'light');
    });
  };

  var roomView = new RoomView();

  describe("the room", function() {
    it( "becomes light when sun shine", function() {
      sun.shine();
      expect($roomView).toHaveClass('light');
    });
  });
})();
