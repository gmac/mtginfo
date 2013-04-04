module.exports = function( grunt ) {

	grunt.initConfig({
		//pkg: grunt.file.readJSON('package.json'),
		requirejs: {
			compile: {
				options: {
					almond: true,
					baseUrl: "js",
					include: ["main"],
					mainConfigFile: "js/main.js",
					out: "js/mtginfo.js"
				}
			}
		}
	});
	
	grunt.loadNpmTasks("grunt-requirejs");
	grunt.registerTask("default", ["requirejs"]);
};