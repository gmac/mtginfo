// Toolbar View Controller:
// Manages behaviors of the top toolbar, including search input, grid size, and reset.

define([
	"jquery.colorbox",
	"underscore",
	"backbone",
	"./search-m",
	"./settings-m",
	"./grid-m",
	"./layout-c"
], function( $, _, Backbone, searchModel, settingsModel, gridModel, layout ) {

	var ToolbarView = Backbone.View.extend({
		el: "#toolbar",
		
		events: {
			"change #grid-size": "gridSize",
			"click .reset": "reset",
			"click .search": "search",
			"click .info": "openInfo",
			"focus .query": "startSearch"
		},
		
		initialize: function() {
			this.$query = this.$( ".query" );
			this.$loader = this.$( ".loading" );
			this.$mssg = this.$( ".message" );
			this.$size = this.$( "#grid-size" );
			
			this.listenTo( searchModel, "reset", this.render, this );
			this.listenTo( searchModel, "noResults", this.noResults, this );
			this.listenTo( settingsModel, "change", this.render, this );
			this.render();
		},
		
		render: function() {
			this.$loader.hide();
			this.$size.val( settingsModel.getGridSize() );
		},
		
		// Called by the main application keyboard router:
		keypress: function( which ) {
			if ( which == 13 ) {
				this.search();
				return true;
			}
			return false;
		},
		
		// Specifies if search text is being entered:
		isSearching: function() {
			return this.$query.is( ":focus" );
		},
		
		// Starts a new search:
		// new search focuses search input and deselects card layout.
		startSearch: function() {
			if ( !this.isSearching() ) {
				this.$query.val( "" ).focus();
				layout.deselect();
			}
		},
		
		// Triggers in response to empty search results:
		noResults: function() {
			this.$mssg.show().delay( 2000 ).fadeOut();
		},
		
		// Triggered in response to changing grid size using the select menu:
		gridSize: function() {
			settingsModel.setGridSize( this.$size.val() );
		},
		
		// Submits a new query to the seach model:
		search: function() {
			if ( this.$query.val() ) {
				this.$loader.show();
				this.$mssg.hide();
				searchModel.fetch( this.$query.val() );
				this.$query.val( "" ).blur();
			}
		},
		
		// Resets the application by emptying cards cache:
		reset: function() {
			gridModel.empty();
		},
		
		// Opens the info panel:
		openInfo: function() {
			if ( !$("#info").is(":visible") ) {
				$.colorbox({ inline: true, href: "#info" });
			} else {
				$.colorbox.close();
			}
		}
	});
	
	return new ToolbarView();
});