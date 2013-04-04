define([
	"backbone",
	"store"
], function( Backbone, store ) {
	
	// Grid settings data model:
	var GridSettings = Backbone.Model.extend({
		id: "mtginfo-settings",
		
		defaults: {
			gridSize: 3
		},
		
		getGridSize: function() {
			return String( this.get( "gridSize" ) );
		},
		
		setGridSize: function( size ) {
			size = Math.max(1, Math.min(parseInt(size, 10), 3));
			this.save( "gridSize", size );
		},
		
		toggleGridSize: function() {
			var size = this.get( "gridSize" );
			this.save( "gridSize", size < 3 ? size+1 : 1 );
		},
		
		// Override native Backbone save method:
		save: function() {
			this.set.apply( this, arguments );
			store.set( this.id, this.toJSON() );
		},
		
		load: function() {
			var local = store.get(this.id);
			local && this.set( local );
		}
	});
	
	return new GridSettings();
});