define(["backbone","store"],function(e,t){var n=e.Model.extend({id:"mtginfo-settings",defaults:{gridSize:3},getGridSize:function(){return String(this.get("gridSize"))},setGridSize:function(e){e=Math.max(1,Math.min(parseInt(e,10),3)),this.save("gridSize",e)},toggleGridSize:function(){var e=this.get("gridSize");this.save("gridSize",e<3?e+1:1)},save:function(){this.set.apply(this,arguments),t.set(this.id,this.toJSON())},load:function(){var e=t.get(this.id);e&&this.set(e)}});return new n});