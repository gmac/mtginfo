define([
	"jquery.scrollto",
	"underscore",
	"backbone",
	"./search-m",
	"./grid-m",
	"./layout-c"
], function( $, _, Backbone, searchModel, gridModel, layout ) {
	
	// Search Results View Controller
	// ------------------------------
	var SearchResultsView = Backbone.View.extend({
		el: "#search-results",
		
		initialize: function() {
			this.listenTo( searchModel, "reset", this.render, this );
		
			// Init view:
			this.minX = parseInt( this.$el.css("left"), 10 );
			this.$el.css("padding-top", layout.top).show();
			
			this.$results = this.$( ".results" );
			this.$list = this.$( "ul" );
			this.$win = $( window ).on("resize", _.bind(this.setHeight, this));
			this.setHeight();
		},
	
		render: function() {
			var html = "";
			this.tmpl = this.tmpl || _.template($("#search-item-tmpl").html());
			this.$results.scrollTop(0);
			
			// Test if there are multiple search results:
			if ( searchModel.length > 1 ) {
			
				// Multiple results:
				searchModel.each(function( model ) {
					html += this.tmpl( model.toJSON() );
				}, this);

				this.$list.html( html );
				this.selectIndex( 0 );
				this.toggle( true );
			
			} else if ( searchModel.length ) {
				// Single result (add directly):
				gridModel.addCard( searchModel.at(0).toJSON() );
				this.toggle( false );
			
			} else {
				// No results:
				this.toggle( false );
			}
		},
		
		// Called by the main application keyboard router:
		keypress: function( which ) {
			
			if ( this.isActive() ) {
				switch ( which ) {
					case 27: this.toggle( false ); return true;
					case 38: this.shiftIndex( -1 ); return true;
					case 40: this.shiftIndex( 1 ); return true;
					case 13: this.add(); return true;
				}
			}
			
			return false;
		},
		
		// Toggles the results panel open and closed:
		// uses an inelegant out-of-scope reference to gridView component (quick hack).
		toggle: function( show ) {
			var self = this;
			var to = (show === true) ? 0 : this.minX;
		
			this.$el.animate({left: to}, {
				step: function( at ) {
					layout.left( at-self.minX );
					self.left = at;
				}
			});
		},
		
		// Selects a card at the specified index:
		selectIndex: function( index, scrollto ) {
			if ( index >= 0 && index < searchModel.length ) {
				var target = this.$results.find(".card:eq("+index+")");
				
				layout.select( target );

				if ( scrollto ) {
					this.$results.scrollTo( target, 500, {offset:{top:-10, left:0}});
				}
			}
		},
		
		// Shifts the list focus up and down:
		shiftIndex: function( dir ) {
			this.selectIndex( layout.selectedIndex()+dir, true );
		},
		
		// Specifies if the panel is current open/active:
		isActive: function() {
			return this.left > this.minX;
		},
		
		// Sets the height of the search results toolbar:
		// only updates when left is not set, or when results bar is visible.
		setHeight: function() {
			if ( !this.left || this.isActive() ) {
				this.$results.height( this.$win.height()-layout.top );
			}
		},
	
		events: {
			"mouseover .card": "hover",
			"click .card": "add",
			"click .close": "toggle"
		},
		
		// Focuses the anchor tag within the event target:
		hover: function( evt ) {
			var target = $( evt.target ).closest("li");
			this.selectIndex( target.index() );
		},
		
		// Adds the event target's associated card to the grid:
		add: function() {
			var model = searchModel.at( layout.selectedIndex() );
			gridModel.addCard( model.toJSON() );
			this.toggle( false );
		}
	});
	
	return new SearchResultsView();
});