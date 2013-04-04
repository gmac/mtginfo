define([
	"backbone",
	"store"
], function( Backbone, store ) {
	
	// Card items grid model:
	var GridItems = Backbone.Collection.extend({
		
		id: "mtginfo-grid",
		
		addCard: function( json ) {
			this.add( json, {at: 0} );
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