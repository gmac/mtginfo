// Grid View Controller
// Manages the layout and behaviors of the card grid.

define([
	"jquery.scrollto",
	"underscore",
	"backbone",
	"./grid-m",
	"./settings-m",
	"./layout-c"
], function( $, _, Backbone, gridModel, settingsModel, layout ) {
	
	var GridView = Backbone.View.extend({
		el: "#grid",
		
		rows: 0,
		cols: 0,

		initialize: function() {
			var self = this;
			this.listenTo( settingsModel, "change:gridSize", this.resetGrid, this );
			this.listenTo( gridModel, "add remove reset", this.render, this );
			this.listenTo( layout, "left", this.setLeft, this );
			
			this.$win = $( window ).on("resize", _.throttle(function() {
				self.resetGrid();
			}, 100));
		},
	
		render: function() {
			var html = "";
			this.tmpl = this.tmpl || _.template($("#grid-item-tmpl").html());
		
			gridModel.each(function( model ) {
				html += this.tmpl( model.toJSON() );
			}, this);
		
			this.$el.html( html );
			this.resetGrid();
			this.selectIndex( 0 );
		},
		
		// Called by the main application keyboard router:
		keypress: function( which ) {
			
			if ( which >= 49 && which <= 57 ) { // "1-9" keys
				this.selectVisibleIndex( which-49 );
				return true;
				
			} else if ( which >= 37 && which <= 40 ) { // Arrow keys
				var x = 0, y = 0;
				
				switch ( which ) {
					case 37: x = -1; break;
					case 38: y = -1; break;
					case 39: x = 1; break;
					case 40: y = 1; break;
				}
				
				this.shiftSelectionBy( x, y );
				return true;
				
			} else if ( which == 8 ) { // Delete key
				this.removeSelected();
				return true;
				
			} else if ( which == 13 ) { // Enter key
				this.openSelected();
				return true;
			}
			
			return false;
		},
		
		setLeft: function( x ) {
			this.$el.css("left", x);
		},
		
		openSelected: function() {
			var index = layout.selectedIndex();
			
			if ( index >= 0 && index < gridModel.length ) {
				var model = gridModel.at( index );
				open( model.get("url"), "_blank" );
			}
		},
		
		removeSelected: function() {
			var index = layout.selectedIndex();
			
			if ( index >= 0 ) {
				this.removeIndex( index );
				this.selectIndex( index );
			}
		},
		
		clearSelection: function() {
			this.selectIndex( -1 );
		},
		
		selectIndex: function( index ) {
			index = Math.max(-1, Math.min(index, gridModel.length-1));
			
			if ( index >= 0 ) {
				var target = this.$( ".card:eq("+index+")" );
				$.scrollTo( target, 500, {offset:{top:-(layout.top+10), left:0}});
				layout.select( target );
				
			} else {
				layout.deselect();
			}
		},
		
		selectVisibleIndex: function( index ) {
			var offset = this.$win.scrollTop() + layout.top;
			var height = this.$el.find(":first-child").outerHeight();
			var rows = Math.round( offset / height );
			this.selectIndex( this.cols * rows + index );
		},
		
		removeIndex: function( index ) {
			//var selected = layout.selectedIndex();
			gridModel.removeCard( index );
		},
		
		shiftSelectionBy: function( x, y ) {
			var index = layout.selectedIndex();
			
			if ( index >= 0 ) {
				index += (x + y * this.cols);
				index = Math.max(0, Math.min(index, gridModel.length-1));
				this.selectIndex( index );
			}
		},
		
		resetGrid: function() {
			// Constant grid settings:
			var baseW = 312;
			var baseH = 445;
			var margin = 20;
			var sizes = 3;
		
			// Dynamic settings based on current grid size and screen width:
			var winW = this.$win.width();
			var cellW = (baseW + 2 + margin) * (1 / sizes) * settingsModel.get( "gridSize" );
			var cols = Math.round( winW / cellW );
		
			// Calculate new column width percentage:
			// allows 1% margin added for each column.
			var perc = Math.floor( (100-cols) / cols ) - 1;
		
			// Apply new column styles:
			this.$el.children().css({
				marginLeft: "1%",
				marginTop: "1%",
				width: perc +"%"
			});
			
			// Update grid metrics:
			this.rows = Math.floor( gridModel.length / cols );
			this.cols = cols;
		},
	
		events: {
			"click .remove": "onRemove"
		},

		onRemove: function( evt ) {
			var card = $( evt.target ).closest(".card");
			this.removeIndex( card.index() );
		}
	});
	
	return new GridView();
});