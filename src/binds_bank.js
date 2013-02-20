(function() {
	ViewModel.binds = {
		log: function(elem, value, context, addArgs) {
			var comp = this.findObservable(context, value, addArgs);
			console.log(context, '.', value, '=', comp());
		},
		html: function(elem, value, context, addArgs) {
			var comp = this.findObservable(context, value, addArgs);
			var fn = function() {
				$(elem).html(comp());
			}
			fn();
			comp.subscribe(fn);
		},
		text: function(elem, value, context, addArgs) {
			var comp = this.findObservable(context, value, addArgs);
			var fn = function() {
				$(elem).text(comp());
			}
			fn();
			comp.subscribe(fn);
		},
		'with': function(elem, value, context, addArgs) {
			return this.findObservable(context, value, addArgs)();
		},
		each: function(elem, value, context, addArgs) {
			var fArray = this.findObservable(context, value, addArgs);
			var $el = $(elem);
			var html = $el.html();
			$el.hide().empty();
			addArgs||(addArgs={});
			var fn = function() {
				$el.hide().empty();
				var array = fArray();
				if(array) {
					$.each(array, function(ind, val) {
						addArgs.$index=ind;
						addArgs.$parent=array;
						addArgs.$value=val;
						var tempDiv = document.createElement('div');
						$(tempDiv).html(html);
						ViewModel.findBinds(tempDiv, val, addArgs);
						var $children = $(tempDiv).children();
						$children.appendTo(elem);
					});
				}
				$el.show();
			};
			fn();
			fArray.subscribe(fn);
			return false;
		},
		eachModel: function(elem, value, context, addArgs) {
			var collectionObs=this.findObservable(context, value, addArgs);
			var html = $(elem).html();
				
			var rebindCollection=function(collection){
				var i = 0;
				addArgs||(addArgs={});
				var renderModel = function(model, index) {
					var tempDiv = document.createElement('div');
					$(tempDiv).html(html);
					
					//model.__index__ = collection.getIndex(model);

					var obs = Observable(model);
					addArgs.$index=index;
					addArgs.$parent=collection;
					ViewModel.findBinds(tempDiv, obs, addArgs);

					var $children = $(tempDiv).children();
					if(index == 0) {
						$children.prependTo(elem);
					} else if($children.length && $(elem).children().eq(index*$children.length).length) {
						$children.insertBefore($(elem).children().eq(index*$children.length));
					} else {
						$children.appendTo(elem);
					}

					var ctx = {};
					model.on('change',function(e) {
						obs.fire();
					}, ctx).on('cut',function(from) {
						if(from === collection) {
							$children.empty().remove();
							collection.fire('cut', model);
						}
						model.off(0, 0, ctx);
						obs.destroy();
						delete obs;
					}, ctx);
					i++;
				};
				if(collection.length) {
					collection.each(renderModel)
				}
				collection.on('add', renderModel);
				$(elem).show();
			}
				
				
			var fn=function(){
				$(elem).hide();
				$(elem).empty();
				var collection = collectionObs();
				if(collection)
				{
					rebindCollection(collection);
				}
			}
			fn();
			collectionObs.subscribe(fn);
				
			return false;
		},
		value: function(elem, value, context, addArgs) {
			var comp = ViewModel.findObservable(context, value, addArgs);
			var fn = function() {
				$(elem).val(comp());
			}
			fn();
			comp.subscribe(fn);
		},
		attr: function(elem, value, context, addArgs) {
			value = value.match(/^{([\s\S]+)}$/)[1];
			var attrs = value.split(/\s*,\s*/);
			for(var i = attrs.length - 1; i >= 0; i--) {
				var arr = attrs[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);
				var comp = ViewModel.findObservable(context, arr[2], addArgs);
				(function(elem,attr,comp){
					var fn=function(){
						$(elem).attr(attr,comp());
					}
					fn();
					comp.subscribe(fn);
				})(elem,arr[1],comp);
			}
		},
		style: function(elem, value, context, addArgs) {
			value = value.match(/^{([\s\S]+)}$/)[1];
			var attrs = value.split(/\s*,\s*/);
			for(var i = attrs.length - 1; i >= 0; i--) {
				var arr = attrs[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);

				var comp = ViewModel.findObservable(context, arr[2], addArgs);
				(function(elem,attr,comp){
					var fn=function(){
						$(elem).css(attr,comp());
					}
					fn();
					comp.subscribe(fn);
				})(elem,arr[1],comp);
			}
		},
		css: function(elem, value, context, addArgs) {
			value = value.match(/^{([\s\S]+)}$/)[1];

			var attrs = value.split(/\s*,\s*/);
			for(var i = attrs.length - 1; i >= 0; i--) {
				var arr = attrs[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);
				(function(val, className) {
					var comp = ViewModel.findObservable(context, val, addArgs);

					var fn = function() {

						if(comp()) {
							$(elem).addClass(className);
						} else {
							$(elem).removeClass(className);
						}
					}
					fn();
					comp.subscribe(fn);
				})(arr[2], arr[1])

			}
		},
		display: function(elem, value, context, addArgs) {
			var comp = this.findObservable(context, value, addArgs);
			var $el=$(elem);
			var fn = function() {
				if(!!comp()) {
					$el.show();
				} else {
					$el.hide();
				}
			}
			fn();
			comp.subscribe(fn);
		},
		click: function(elem, value, context,addArgs) {
			var fn = this.findObservable(context, value, addArgs)();
			var $el = $(elem);
			$el.click(function() {
				fn.apply(context,arguments);
			});
		}
	};
})();