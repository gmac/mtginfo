define(["jquery.colorbox","underscore","backbone","./search-m","./settings-m","./grid-m","./layout-c"],function(e,t,n,r,i,s,o){var u=n.View.extend({el:"#toolbar",events:{"change #grid-size":"gridSize","click .reset":"reset","click .search":"search","click .info":"openInfo","focus .query":"startSearch"},initialize:function(){this.$query=this.$(".query"),this.$loader=this.$(".loading"),this.$mssg=this.$(".message"),this.$size=this.$("#grid-size"),this.listenTo(r,"reset",this.render,this),this.listenTo(r,"noResults",this.noResults,this),this.listenTo(i,"change",this.render,this),this.render()},render:function(){this.$loader.hide(),this.$size.val(i.getGridSize())},keypress:function(e){return e==13?(this.search(),!0):!1},isSearching:function(){return this.$query.is(":focus")},startSearch:function(){this.isSearching()||(this.$query.val("").focus(),o.deselect())},noResults:function(){this.$mssg.show().delay(2e3).fadeOut()},gridSize:function(){i.setGridSize(this.$size.val())},search:function(){this.$query.val()&&(this.$loader.show(),this.$mssg.hide(),r.fetch(this.$query.val()),this.$query.val("").blur())},reset:function(){s.empty()},openInfo:function(){e("#info").is(":visible")?e.colorbox.close():e.colorbox({inline:!0,href:"#info"})}});return new u});