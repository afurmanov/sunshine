(function() {
  var $roomView = $("<div></div>");
  var Sun = function() {
    return {
      shine : function() {
        $roomView.attr('class', 'light');
      }
    };
  }

  var sun = new Sun();

  describe("the room", function() {
    it( "becomes light when sun shine", function() {
      sun.shine();
      expect($roomView).toHaveClass('light');
    });
  })
})()
