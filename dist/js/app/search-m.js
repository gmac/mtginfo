define(["jquery","underscore","backbone"],function(e,t,n){var r=n.Collection.extend({url:"proxy.php",fetch:function(t){var n=this;e.ajax({url:"proxy.php",dataType:"text",data:{q:escape(t)},success:function(e){n.reset(n.parse(e))}})},parse:function(e){return e=e.match(/src="http:\/\/magiccards.info\/scans\/.+?"[\s\S]+?alt=".+?"/g),e=t.map(e,function(e){var t=/src="(.+?)"[\s\S]+alt="(.+?)"/g.exec(e),n=t[1];return{id:n.replace("http://magiccards.info/scans/",""),name:t[2],image:n,url:n.replace(/^(.+)\/scans\/.+\/(.+)\/(.+)\..+/g,"$1/$2/en/$3.html")}}),e.length||this.trigger("noResults"),e}});return new r});