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
	
	// Keyboard controller:
	$(window).on("keydown", function( evt ) {
		
		var which = evt.which;
		var handled = true;
		
		if ( which == 27 ) { // "ESC" (close results)
			searchView.toggle( false );
			
		} else if ( toolbarView.isSearching() ) {
			handled = toolbarView.keypress( which );
			
		} else if ( which == 191 ) { // "?" key (search)
			toolbarView.startSearch( which );
			
		} else if ( which == 71 ) { // "G" key (grid size)
			settingsModel.toggleGridSize();
		
		} else if ( searchView.isActive() ) {
			handled = searchView.keypress( which );
			
		} else {
			handled = gridView.keypress( which );
		}

		if ( handled ) {
			evt.preventDefault();
		}
	});
	
	return {};
});