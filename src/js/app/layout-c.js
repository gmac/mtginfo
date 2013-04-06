// Layout Manager
// Manages aspects of the application layout, including:

// - Defines space reserved for top toolbar.
// - Provides event bus for "left" positioning events.
// - Manages card selection item / index (universally accessible for all views).

define([
	"jquery",
	"underscore",
	"backbone"
], function( $, _, Backbone ) {
	
	var $selectedCard;
	
	return _.extend({
		
		// Defines top buffer reserved for toolbar:
		top: $("#toolbar").height(),
		
		// Triggers "left" events with a new left-X coordinate:
		left: function( leftX ) {
			this.trigger( "left", leftX );
		},
		
		// Selects a card element:
		// elements are <li> items provided by their respective views.
		// only one card may be selected at a time in any one view.
		select: function( $card ) {
			this.deselect();
			$selectedCard = $card.addClass("active");
		},
		
		// Deselects the active card element:
		deselect: function() {
			if ( $selectedCard ) {
				$selectedCard.removeClass("active");
				$selectedCard = null;
			}
		},
		
		// Gets the index of the currently selected card element within its respective layout:
		selectedIndex: function() {
			return $selectedCard ? $selectedCard.index() : -1;
		}

	}, Backbone.Events);
});