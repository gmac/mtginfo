define(["jquery.scrollto","underscore","backbone","./search-m","./grid-m","./layout-c"],function(e,t,n,r,i,s){var o=n.View.extend({el:"#search-results",initialize:function(){this.listenTo(r,"reset",this.render,this),this.minX=parseInt(this.$el.css("left"),10),this.$el.css("padding-top",s.top).show(),this.$results=this.$(".results"),this.$list=this.$("ul"),this.$win=e(window).on("resize",t.bind(this.setHeight,this)),this.setHeight()},render:function(){var n="";this.tmpl=this.tmpl||t.template(e("#search-item-tmpl").html()),this.$results.scrollTop(0),r.length>1?(r.each(function(e){n+=this.tmpl(e.toJSON())},this),this.$list.html(n),this.selectIndex(0),this.toggle(!0)):r.length?(i.addCard(r.at(0).toJSON()),this.toggle(!1)):this.toggle(!1)},keypress:function(e){if(this.isActive())switch(e){case 27:return this.toggle(!1),!0;case 38:return this.shiftIndex(-1),!0;case 40:return this.shiftIndex(1),!0;case 13:return this.add(),!0}return!1},toggle:function(e){var t=this,n=e===!0?0:this.minX;this.$el.animate({left:n},{step:function(e){s.left(e-t.minX),t.left=e}})},selectIndex:function(e,t){if(e>=0&&e<r.length){var n=this.$results.find(".card:eq("+e+")");s.select(n),t&&this.$results.scrollTo(n,500,{offset:{top:-10,left:0}})}},shiftIndex:function(e){this.selectIndex(s.selectedIndex()+e,!0)},isActive:function(){return this.left>this.minX},setHeight:function(){(!this.left||this.isActive())&&this.$results.height(this.$win.height()-s.top)},events:{"mouseover .card":"hover","click .card":"add","click .close":"toggle"},hover:function(t){var n=e(t.target).closest("li");this.selectIndex(n.index())},add:function(e){e&&e.preventDefault();var t=r.at(s.selectedIndex());i.addCard(t.toJSON()),this.toggle(!1)}});return new o});