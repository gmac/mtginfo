requirejs.config({
	paths: {
		"backbone": "lib/backbone",
		"jquery": "lib/jquery",
		"jquery.colorbox": "lib/jquery.colorbox",
		"jquery.scrollto": "lib/jquery.scrollto",
		"store": "lib/store",
		"underscore": "lib/underscore"
	}
});


define([
	"app/keyboard-c",
	"app/settings-m",
	"app/grid-m",
], function( keyboard, settingsModel, gridModel ) {
	
	settingsModel.load();
	gridModel.load();
});