(function() {
	
	// Models:

	// Search results model:
	var SearchModel = Backbone.Collection.extend({
		url: "proxy.php",
	
		// Override Backbone-native fetch:
		// Uses custom AJAX to load from local proxy.
		fetch: function( query ) {
			var self = this;
		
			$.ajax({
				url: "proxy.php",
				dataType: "text",
				data: {
					q: escape(query)
				},
				success: function( res ) {
					self.reset( self.parse(res) );
				}
			});
		},
	
		// Override Backbone-native parse:
		// Parses JSON results out of a mtginfo HTML page.
		parse: function( res ) {
			// Find all card image tags within results:
			res = res.match( /src="http:\/\/magiccards.info\/scans\/.+?"[\s\S]+?alt=".+?"/g );
		
			// Format card image tags:
			res = _.map(res, function( item ) {
				var fields = ( /src="(.+?)"[\s\S]+alt="(.+?)"/g ).exec( item );
				var image = fields[1];
				return {
					id: image.replace( "http://magiccards.info/scans/", "" ),
					name: fields[2],
					image: image,
					url: image.replace( /^(.+)\/scans\/.+\/(.+)\/(.+)\..+/g, "$1/$2/en/$3.html" )
				};
			});
			return res;
		}
	});


	// Card items grid model:
	var GridItems = Backbone.Collection.extend({
		localStorage: new Backbone.LocalStorage( "mtg-cards" ),
	
		empty: function() {
			this.localStorage._clear();
			this.reset();
		}
	});


	// Grid settings data model:
	var GridSettings = Backbone.Model.extend({
		id: "settings",
		localStorage: new Backbone.LocalStorage( "mtg-settings" ),
	
		defaults: {
			gridSize: 3
		},

		toggleGridSize: function() {
			var size = this.get( "gridSize" );
			this.save( "gridSize", size < 3 ? size+1 : 1 );
		}
	});

	
	// Model instances:
	var searchModel = new SearchModel();
	var gridSettings = new GridSettings();
	var gridItems = new GridItems();


	// Views:
	
	// MTGInfo Application
	// -------------------
	var MTGInfo = _.extend({
		
		// Top buffer height reserved for toolbar:
		bufferTop: $("#toolbar").height(),
		
		// Startup function to launch the app:
		start: function() {
			gridSettings.fetch();
			gridItems.fetch();
			toolsView.startSearch();
		}
		
	}, Backbone.Events);
	
	
	// Toolbar View Controller
	// -----------------------
	var ToolbarView = Backbone.View.extend({
		el: "#toolbar",
		
		events: {
			"change #grid-size": "gridSize",
			"click .reset": "reset",
			"click .search": "search",
			"keydown .query": "keypress",
			"focus .query": "startSearch"
		},
		
		initialize: function() {
			this.$query = this.$( ".query" );
			this.$loader = this.$( ".loading" );
			this.$mssg = this.$( ".message" ).hide().css("visibility", "visible");
			this.$size = this.$( "#grid-size" );
			
			this.listenTo( searchModel, "reset", this.render, this );
			this.listenTo( gridSettings, "change", this.render, this );
			this.listenTo( MTGInfo, "message", this.setMessage, this );
		},
		
		render: function() {
			this.$loader.hide();
			this.$size.val( gridSettings.get("gridSize").toString() );
		},
		
		isSearching: function() {
			return this.$query.is( ":focus" );
		},
		
		startSearch: function( evt ) {
			if ( !this.isSearching() ) {
				this.$query.val( "" ).focus();
				MTGInfo.trigger( "search" );
				evt && evt.preventDefault();
			}
		},
		
		setMessage: function( message ) {
			this.$mssg.text( message ).show().delay( 2000 ).fadeOut();
		},
		
		gridSize: function() {
			gridSettings.save( "gridSize", this.$size.val() );
		},
	
		keypress: function( evt ) {
			if ( evt.keyCode == 13 && this.$query.val() ) {
				evt.preventDefault();
				this.search();
			}
		},
	
		search: function() {
			this.$loader.show();
			this.$mssg.hide();
			searchModel.fetch( this.$query.val() );
			this.$query.val( "" ).blur();
		},

		reset: function() {
			gridItems.empty();
		}
	});


	// Search Results View Controller
	// ------------------------------
	var SearchResultsView = Backbone.View.extend({
		el: "#search-results",
		
		initialize: function() {
			var self = this;
			this.listenTo( searchModel, "reset", this.render, this );
		
			// Init view:
			this.minX = parseInt( this.$el.css("left"), 10 );
			this.$el.css("padding-top", MTGInfo.bufferTop).show();
			
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
				gridItems.create( searchModel.at(0).toJSON(), {at: 0} );
				this.toggle( false );
			
			} else {
				// No results:
				this.toggle( false );
				MTGInfo.trigger( "message", "No results found." );
			}
		},
	
		// Toggles the results panel open and closed:
		// uses an inelegant out-of-scope reference to gridView component (quick hack).
		toggle: function( show ) {
			var self = this;
			var to = (show === true) ? 0 : this.minX;
		
			this.$el.animate({left: to}, {
				step: function( at ) {
					gridView.$el.css({left: -(self.minX)+at });
					self.left = at;
				}
			});
		},
		
		// Selects a card at the specified index:
		selectIndex: function( index, scrollto ) {
			if ( index >= 0 && index < searchModel.length ) {
				var to = this.$results
					.find("li")
					.removeClass("active")
					.filter(":eq("+index+")")
					.addClass("active");
					
				this.selectedIndex = index;

				if ( scrollto ) {
					this.$results.scrollTo( to, 500, {offset:{top:-10, left:0}});
				}
			}
		},
		
		// Shifts the list focus up and down:
		shiftIndex: function( dir ) {
			this.selectIndex( this.selectedIndex+dir, true );
		},
		
		// Specifies if the panel is current open/active:
		isActive: function() {
			return this.left > this.minX;
		},
		
		// Sets the height of the search results toolbar:
		// only updates when left is not set, or when results bar is visible.
		setHeight: function() {
			if ( !this.left || this.isActive() ) {
				this.$results.height( this.$win.height()-MTGInfo.bufferTop );
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
		add: function( evt ) {
			evt && evt.preventDefault();
			var model = searchModel.at( this.selectedIndex );
			gridItems.create( model.toJSON(), {at: 0} );
			this.toggle( false );
		},
		
		// Triggered in response to keydown:
		// event is captured in the WINDOW scope, not locally.
		keydown: function( evt ) {
			var handled = false;
			
			if ( this.isActive() ) {
				handled = true;
				
				switch ( evt.which ) {
					case 27: this.toggle( false ); break;
					case 38: this.shiftIndex( -1 ); break;
					case 40: this.shiftIndex( 1 ); break;
					case 13: this.add(); break;
					default: handled = false;
				}
			}
			
			return handled;
		}
	});


	// Grid View Controller
	// --------------------
	var GridView = Backbone.View.extend({
		el: "#grid",
		
		rows: 0,
		cols: 0,
		selectedIndex: -1,
		
		initialize: function() {
			var self = this;
			this.listenTo( gridSettings, "change:gridSize", this.resetGrid, this );
			this.listenTo( gridItems, "add remove reset", this.render, this );
			this.listenTo( MTGInfo, "search", this.clearSelection, this );
			this.$win = $( window ).on("resize", _.throttle(function() {
				self.resetGrid();
			}, 100));
		},
	
		render: function() {
			var html = "";
			this.tmpl = this.tmpl || _.template($("#grid-item-tmpl").html());
		
			gridItems.each(function( model ) {
				html += this.tmpl( model.toJSON() );
			}, this);
		
			this.$el.html( html );
			this.resetGrid();
			this.selectAtIndex( 0 );
		},
		
		clearSelection: function() {
			this.selectAtIndex( -1 );
		},
		
		selectAtIndex: function( index ) {
			var children = this.$el.children().removeClass( "active" );
			index = Math.max(-1, Math.min(index, gridItems.length-1));
			
			if ( index >= 0 ) {
				var target = children.eq( index ).addClass( "active" );
				$.scrollTo( target, 500, {offset:{top:-MTGInfo.bufferTop-10, left:0}});
			}

			this.selectedIndex = index;
		},
		
		removeAtIndex: function( index ) {
			gridItems.at( index ).destroy();
		},
		
		openIndex: function( index ) {
			if ( index >= 0 && index < gridItems.length ) {
				var model = gridItems.at( index );
				open( model.get("url"), "_blank" );
			}
		},
		
		removeSelected: function() {
			if ( this.selectedIndex >= 0 ) {
				this.removeAtIndex( this.selectedIndex );
				this.selectAtIndex( this.selectedIndex );
			}
		},
		
		setSelectionAt: function( index ) {
			var offset = this.$win.scrollTop() + MTGInfo.bufferTop;
			var height = this.$el.find(":first-child").outerHeight();
			var rows = Math.round( offset / height );
			this.selectAtIndex( this.cols * rows + index );
		},
		
		shiftSelectionBy: function( x, y ) {
			var index = this.selectedIndex;
			
			if ( index >= 0 ) {
				index += (x + y * this.cols);
				index = Math.max(0, Math.min(index, gridItems.length-1));
				this.selectAtIndex( index );
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
			var cellW = (baseW + 2 + margin) * (1 / sizes) * gridSettings.get( "gridSize" );
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
			this.rows = Math.floor( gridItems.length / cols );
			this.cols = cols;
		},
	
		events: {
			"click .remove": "onRemove"
		},

		onRemove: function( evt ) {
			var card = $( evt.target ).closest(".card");
			this.removeAtIndex( card.index() );
		},
		
		keydown: function( evt ) {
			var handled = true;
			
			if ( evt.which >= 49 && evt.which <= 57 ) {
				
				// "1-9" keys
				this.setSelectionAt( evt.which-49 );
				
			} else if ( evt.which >= 37 && evt.which <= 40 ) {
				
				// Arrow keys
				var x = 0, y = 0;
				
				switch ( evt.which ) {
					case 37: x = -1; break;
					case 38: y = -1; break;
					case 39: x = 1; break;
					case 40: y = 1; break;
				}
				
				this.shiftSelectionBy( x, y );
				
			} else if ( evt.which == 8 ) {
				
				// Delete key
				this.removeSelected();
				
			} else if ( evt.which == 13 ) {

				// Enter key
				this.openIndex( this.selectedIndex );
				
			} else {
				handled = false;
			}
			
			return handled;
		}
	});
	
	// View instances:
	var toolsView = new ToolbarView();
	var resultsView = new SearchResultsView();
	var gridView =  new GridView();
	MTGInfo.start();
	
	// Keyboard controller:
	$(window).on("keydown", function( evt ) {
		//console.log( evt.which );
		var handled = false;
		
		if ( evt.which == 27 ) { // "ESC"
			resultsView.toggle( false );
			handled = true;
		}
		else if ( !toolsView.isSearching() ) {
			
			if ( evt.which == 191 ) { // "?" key
				toolsView.startSearch( evt );
				handled = true;
				
			} else if ( evt.which == 71 ) { // "G" key
				gridSettings.toggleGridSize();
				handled = true;
				
			} else  if ( resultsView.isActive() ) {
				handled = resultsView.keydown( evt );
				
			} else {
				handled = gridView.keydown( evt );
			}
		}
		
		if ( handled ) {
			evt.preventDefault();
		}
	});
	
	
}).call(this);
