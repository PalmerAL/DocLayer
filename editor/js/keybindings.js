//keybinding api

/* example:

		scratchpad.keybindings.addBinding(102, function() {
			_.startsearch();
		})
		
		(note that the keycodes are keypress - see http://asquare.net/javascript/tests/KeyCode.html) 
		
		*/

scratchpad.modules.define("keybindings", {
addBinding: function(keyset, eventFunction) {
Mousetrap.bind(keyset, function(e) {
    eventFunction();
    return false;
});
},
	init: function() {
		console.log("initialized keyboard shortcuts module");
	}
});