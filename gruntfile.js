module.exports = function( grunt ) {

	grunt.initConfig({
		
		requirejs: {
			dist: {
				options: {
					almond: true,
					modules: [{name: 'main'}],
					dir: "dist",
					appDir: "src",
					baseUrl: "js",
					mainConfigFile: "src/js/main.js"
				}
			}
		},
		
		replace: {
			dist: {
				src: ['dist/index.html'],
				dest: 'dist/index.html',
				replacements: [{
					from: /<!--require-->[\s\S]+?<!--\/require-->/g,
					to: '<script src="js/main.js"></script><script>require(["main"]);</script>'
				}]
			}
		}
		
	});
	
	grunt.loadNpmTasks("grunt-requirejs");
	grunt.loadNpmTasks("grunt-text-replace");
	grunt.registerTask("default", ["requirejs", "replace"]);
};