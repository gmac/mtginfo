// Models:
// --------------------------------------------

// Search results model:
var SearchModel = Backbone.Collection.extend({
	
	// Override Backbone-native fetch:
	// Uses custom AJAX to load from local proxy.
	fetch: function( query ) {
		var self = this;
		
		$.ajax({
			url: "proxy.php",
			dataType: "text",
			data: {
				q: query.replace( /\s/g, "+" )
			},
			success: function( res ) {
				self.reset( self.parse(res) );
			}
		});
	},
	
	// Override Backbone-native parse:
	// Parses JSON results out of a mtginfo HTML page.
	parse: function( res ) {
		res = res.match( /src="http:\/\/magiccards.info\/scans\/.+?"[\s\S]+?alt=".+?"/g );
		res = _.map(res, function( item ) {
			var fields = ( /src="(.+?)"[\s\S]+alt="(.+?)"/g ).exec( item );
			return {
				id: fields[1].replace( "http://magiccards.info/scans/", "" ),
				name: fields[2],
				image: fields[1]
			};
		});
		return res;
	}
});


// Card items grid model:
var GridItems = Backbone.Collection.extend({
	localStorage: new Backbone.LocalStorage( "mtg-cards" )
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


var searchModel = new SearchModel();
var gridSettings = new GridSettings();
var gridItems = new GridItems();


// Views:
// --------------------------------------------


// Slider-UI View Controller
// -------------------------
var SliderView = Backbone.View.extend({
	_value: null,
	_input: false,
	
	options: {
		tick: 0.2, // Tick: snap percentage interval across the range. Use 0 to disable.
		precision: 3, // Float precision to maintain for decimal values.
		integer: true // Maintain value as an integer.
	},
	
	initialize: function() {
		// Elements:
		this.$input = this.$( "input" );
		this.$handle = this.$( ".handle" );
		
		// Display metrics:
		this.min = parseFloat( this.$el.attr( "data-min" ) );
		this.max = parseFloat( this.$el.attr( "data-max" ) );
		this.range = this.max - this.min;
		this.pad = Math.round( this.$handle.width() / 2 );
		this.limit = this.$el.width() - ( this.pad * 2 );
		
		// Set initial value to render:
		this.value( this.$input.val() );
	},
	
	render: function() {
		this.$handle.css( "left", this.limit * this.perc() );
		this.$input.val( this._value );
		
		// Trigger change in response to manual input events:
		if ( this._input ) {
			this.$input.trigger( "change" );
		}
	},
	
	// Gets/sets the slider value:
	value: function( val ) {
		if ( val ) {
			if ( typeof val != "number" ) {
				val = parseFloat( val );
			}
			
			// Restrict value range:
			val = Math.max( this.min, Math.min(val, this.max) );
			
			// Snap to ticks, if enabled:
			if ( this.options.tick ) {
				var tick = this.range * this.options.tick;
				val -= this.min;
				val = this.min + tick * Math.round(val / tick);
			}
			
			// Parse as integer, if enabled:
			if ( this.options.integer ) {
				val = parseInt( val, 10 );
			} else {
				var precis = Math.pow( 10, this.options.precision );
				val = Math.round( val * precis ) / precis;
			}
			
			// Rerender when value changes:
			if ( val !== this._value ) {
				this._value = val;
				this.render();
			}
		}
		return this._value;
	},
	
	// Gets/sets the slider's percentage value:
	perc: function( perc ) {
		if ( perc ) {
			// Restrict percentage range:
			perc = Math.max( 0, Math.min(perc, 1) );
			
			// Set new value:
			this.value( this.min + (this.range * perc) );
		}
		return (this._value - this.min) / this.range;
	},
	
	// Event delegations:
	events: {
		"mousedown": "touch",
		"touchstart": "touch"
	},
	
	// Touch start / move / end behaviors:
	touch: function( evt ) {
		var self = this;
		var touch = (evt.type == "touchstart");
		var moveEvent = (touch ? "touchmove" : "mousemove")+".slider";
		var endEvent = (touch ? "touchend" : "mouseup")+".slider";
		
		// Gets the page-X coordinate from an event:
		var getX = function( evt ) {
			var original = evt.originalEvent;
			evt.preventDefault();
			
			if ( touch && original && original.touches ) {
				original.preventDefault && original.preventDefault();
				return original.touches[0].pageX;
			}
			return evt.pageX;
		};
		
		// Apply end/move behaviors:
		$(document)
			.on( endEvent, function( evt ) {
				$(document).off( endEvent +" "+ moveEvent );
				self.capture( getX(evt) );
				self._input = false;
			})
			.on( moveEvent, function( evt ) {
				self.capture( getX(evt) );
			});
		
		// Capture initial input:
		this._input = true;
		this.capture( getX(evt) );
	},
	
	// Input capture handler:
	capture: function( x ) {
		this.perc( (x - (this.$el.offset().left + this.pad) ) / this.limit );
	}
});


// Toolbar View Controller
// -----------------------
var ToolbarView = Backbone.View.extend({
	el: "#toolbar",
	
	initialize: function() {
		this.listenTo( searchModel, "reset", this.render, this );
		this.size = new SliderView( {el: "#grid-size"} );
		this.size.value( gridSettings.get("gridSize") );
		this.$query = this.$( ".query" );
		this.$loader = this.$( ".loading" );
	},
	
	render: function() {
		this.$loader.hide();
	},
	
	events: {
		"change .grid-size": "gridSize",
		"keydown .query": "keypress",
		"click .search": "search",
		"click .reset": "reset",
	},
	
	gridSize: function() {
		gridSettings.save( {gridSize: this.size.value()} );
	},
	
	keypress: function( evt ) {
		if ( evt.keyCode == 13 ) {
			evt.preventDefault();
			this.search();
		}
	},
	
	search: function() {
		this.$loader.show();
		searchModel.fetch( this.$query.val() );
		this.$query.val( "" );
	},

	reset: function() {
		_.invoke( gridItems.models, "destroy" );
	}
});


// Search Results View Controller
// ------------------------------
var SearchResultsView = Backbone.View.extend({
	el: "#search-results",
	
	minX: -351,
	
	initialize: function() {
		var self = this;
		this.listenTo( searchModel, "reset", this.render, this );
		
		// Init view:
		this.bufferTop = $("#toolbar").height();
		this.left = this.minX;
		this.$el.css({
			"padding-top": this.bufferTop,
			"left": this.left
		}).show();
		
		this.$results = this.$( ".results" );
		this.$list = this.$( "ul" );
		this.$win = $( window ).on("resize", _.bind(this.setHeight, this));
		this.setHeight( true );
	},
	
	render: function() {
		var html = "";
		this.itemTmpl = this.itemTmpl || _.template( "<li class='card' data-id='<%= id %>'><img src='<%= image %>' alt='<%= name %>'><button class='add'>+</button></li>" );
		
		// Test if there are multiple search results:
		if ( searchModel.length > 1 ) {
			
			// Multiple results:
			searchModel.each(function( model ) {
				html += this.itemTmpl( model.toJSON() );
			}, this);

			this.$list.html( html );
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
	
	setHeight: function( update ) {
		if ( update || this.left > this.minX ) {
			this.$results.height( this.$win.height()-this.bufferTop );
		}
	},
	
	events: {
		"click .add": "add",
		"click .close": "toggle"
	},
	
	add: function( evt ) {
		var target = $( evt.target ).closest( ".card" );
		var model = searchModel.get( target.attr("data-id") );
		gridItems.create( model.toJSON(), {at: 0} );
		this.toggle( false );
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
		this.itemTmpl = this.itemTmpl || _.template( "<li class='card' data-id='<%= id %>'><img src='<%= image %>' alt='<%= name %>'><button class='remove'>x</button></li>" );
		
		gridItems.each(function( model ) {
			html += this.itemTmpl( model.toJSON() );
		}, this);
		
		this.$el.html( html );
		this.resetGrid();
	},
	
	resetGrid: function() {
		var baseW = 312;
		var baseH = 445;
		var margin = 20;
		
		var winW = this.$win.width();
		var cellW = (baseW + 2 + margin) * 0.2 * gridSettings.get( "gridSize" );
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

var toolsView = new ToolbarView();
var resultsView = new SearchResultsView();
var gridView =  new GridView();
