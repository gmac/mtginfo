define([
	"jquery",
	"underscore",
	"backbone"
], function( $, _, Backbone ) {

	// Search results model:
	var SearchModel = Backbone.Collection.extend({
		url: "proxy.php",
		
		// Override Backbone-native fetch:
		// Uses custom AJAX to load from local proxy.
		fetch: function( query ) {
			Backbone.Collection.prototype.fetch.call(this, {
				data: {q: escape(query)},
				dataType: "text"
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
			
			if ( !res.length ) {
				this.trigger( "noResults" );
			}
			
			return res;
		}
	});
	
	return new SearchModel();
});