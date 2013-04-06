define([
	"backbone",
	"store"
], function( Backbone, store ) {
	
	// Card items grid model:
	var GridItems = Backbone.Collection.extend({
		
		id: "mtginfo-grid",
		
		addCard: function( model ) {
			// Remove any existing instance of the card:
			var current = this.get( model.id );
			if ( current ) this.remove( current, {silent:true} );
			
			// Add new instance at the front of the grid queue.
			this.unshift( model );
			this.save();
		},
		
		removeCard: function( index ) {
			this.remove( this.at(index) );
			this.save();
		},
		
		empty: function() {
			this.reset();
			this.save();
		},
		
		save: function() {
			store.set( this.id, this.toJSON() );
		},
		
		load: function() {
			this.reset( store.get(this.id) );
		}
	});
	
	return new GridItems();
});