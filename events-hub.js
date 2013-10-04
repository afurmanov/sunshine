/*global $:false */
var EventsHub = (function(){
  "use strict";
  var events = {};

  return {
    subscribe : function(event, callback) {
      events[event] = events[event] || [];
      events[event].push(callback);
    },

    dispatch : function(event) {
      $.each(events, function(e) {
        if (e == event) {
          $.each(events[event], function(i, callback) {
            callback.call();
          });
        }
      });
    }
  };
})();
