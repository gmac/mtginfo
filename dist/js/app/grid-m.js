define(["backbone","store"],function(e,t){var n=e.Collection.extend({id:"mtginfo-grid",addCard:function(e){var t=this.get(e.id);t&&this.remove(t,{silent:!0}),this.unshift(e),this.save()},removeCard:function(e){this.remove(this.at(e)),this.save()},empty:function(){this.reset(),this.save()},save:function(){t.set(this.id,this.toJSON())},load:function(){this.reset(t.get(this.id))}});return new n});