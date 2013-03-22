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
	
		initialize: function() {
			this.fetch();
		}
	});

	
	// Model instances:
	var searchModel = new SearchModel();
	var gridSettings = new GridSettings();
	var gridItems = new GridItems();


	// Views:

	// Toolbar View Controller
	// -----------------------
	var ToolbarView = Backbone.View.extend({
		el: "#toolbar",
	
		initialize: function() {
			this.listenTo( searchModel, "reset", this.render, this );
			this.$query = this.$( ".query" );
			this.$loader = this.$( ".loading" );
			this.$size = this.$( "#grid-size" ).val( gridSettings.get("gridSize") );
			this.startSearch();
		},
		
		searching: function() {
			return this.$query.is( ":focus" );
		},
		
		startSearch: function( evt ) {
			if ( !this.searching() ) {
				this.$query.val( "" ).focus();
				evt && evt.preventDefault();
			}
		},
		
		render: function() {
			this.$loader.hide();
		},
	
		events: {
			"change #grid-size": "gridSize",
			"keydown .query": "keypress",
			"click .search": "search",
			"click .reset": "reset",
		},
		
		gridSize: function() {
			gridSettings.save( {gridSize: this.$size.val()} );
		},
	
		keypress: function( evt ) {
			if ( evt.keyCode == 13 && this.$query.val() ) {
				evt.preventDefault();
				this.search();
			}
		},
	
		search: function() {
			this.$loader.show();
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
			this.bufferTop = $("#toolbar").height();
			this.$el.css("padding-top", this.bufferTop).show();
			
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
		isOpen: function() {
			return this.left > this.minX;
		},
		
		// Sets the height of the search results toolbar:
		// only updates when left is not set, or when results bar is visible.
		setHeight: function() {
			if ( !this.left || this.isOpen() ) {
				this.$results.height( this.$win.height()-this.bufferTop );
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
			if ( this.isOpen() ) {
				switch ( evt.which ) {
					case 27: evt.preventDefault(); return this.toggle( false );
					case 38: evt.preventDefault(); return this.shiftIndex( -1 );
					case 40: evt.preventDefault(); return this.shiftIndex( 1 );
					case 13: evt.preventDefault(); return this.add();
				}
			}
		}
	});


	// Grid View Controller
	// --------------------
	var GridView = Backbone.View.extend({
		el: "#grid",
	
		initialize: function() {
			var self = this;
			this.listenTo( gridSettings, "change:gridSize", this.resetGrid, this );
			this.listenTo( gridItems, "add remove reset", this.render, this );
			this.$win = $( window ).on("resize", _.throttle(function() {
				self.resetGrid();
			}, 100));
		
			gridItems.fetch();
		},
	
		render: function() {
			var html = "";
			this.tmpl = this.tmpl || _.template($("#grid-item-tmpl").html());
		
			gridItems.each(function( model ) {
				html += this.tmpl( model.toJSON() );
			}, this);
		
			this.$el.html( html );
			this.resetGrid();
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
			var perc = Math.floor( (100-cols) / cols );
		
			// Apply new column styles:
			this.$el.children().css({
				marginLeft: "1%",
				marginTop: "1%",
				width: (perc-1)+"%"
			});
		},
	
		events: {
			"click .remove": "onRemove"
		},

		onRemove: function( evt ) {
			var card = $( evt.target ).closest(".card");
			gridItems.get(card.attr("data-id")).destroy();
		}
	});
	
	// View instances:
	var toolsView = new ToolbarView();
	var resultsView = new SearchResultsView();
	var gridView =  new GridView();
	
	
	// Keyboard controller:
	$(window).on("keydown", function( evt ) {
		if ( !toolsView.searching() ) {
			if ( evt.which == 83 ) {
				toolsView.startSearch( evt ); // "S" key
			} else {
				resultsView.keydown( evt );
			}
		}
	});
	
	
}).call(this);
