// Keyboard Controller:
// All keyboard commands are handled at the window level by this main router.
// Keyboard input is prioratized at the application level, then handed off to individual views.
// Only one view may recieve keyboard events at a time.

define([
	"jquery",
	"./settings-m",
	"./toolbar-v",
	"./search-v",
	"./grid-v"
], function( $, settingsModel, toolbarView, searchView, gridView ) {
	
	// Double-tap timer control:
	var doubleTap = (function() {
		var timer;
		var storedKey;
		
		function reset() {
			storedKey = null;
		}

		return {
			test: function( key ) {
				var prev = storedKey;
				storedKey = key;
				
				clearTimeout( timer );
				timer = setTimeout( reset, 200 );
				
				return (prev == key);
			}
		};
	}());
	
	// Keyboard controller:
	$(window).on("keydown", function( evt ) {
		
		var which = evt.which;
		var isDouble = doubleTap.test( which );
		var handled = true;
		
		//console.log( which );
		
		if ( which == 27 ) { // "ESC" (close results)
			searchView.toggle( false );
			
		} else if ( toolbarView.isSearching() ) {
			handled = toolbarView.keypress( which, isDouble );
			
		} else if ( which == 191 ) { // "?" key (search)
			toolbarView.startSearch( which );
			
		} else if ( which == 71 ) { // "G" key (grid size)
			settingsModel.toggleGridSize();
		
		} else if ( which == 73 ) { // "I" key (info)
			toolbarView.openInfo();
				
		} else if ( searchView.isActive() ) {
			handled = searchView.keypress( which, isDouble );
			
		} else {
			handled = gridView.keypress( which, isDouble );
		}

		if ( handled ) {
			evt.preventDefault();
		}
	});
	
	return {};
});