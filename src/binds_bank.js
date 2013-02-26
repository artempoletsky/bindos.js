(function() {
	ViewModel.binds = {
		log: function(elem, value, context, addArgs) {
			this.findObservable(context, value, addArgs).callAndSubscribe(function(){
				console.log(context, '.', value, '=', this());
			})
		},
		html: function(elem, value, context, addArgs) {
			var $el=$(elem);
			this.findObservable(context, value, addArgs)
			.callAndSubscribe(function(){
				$el.html(this());
			});
		},
		text: function(elem, value, context, addArgs) {
			var $el=$(elem);
			this.findObservable(context, value, addArgs)
			.callAndSubscribe(function(){
				$el.text(this());
			});
		},
		'with': function(elem, value, context, addArgs) {
			return this.findObservable(context, value, addArgs)();
		},
		each: function(elem, value, context, addArgs) {
			var fArray = this.findObservable(context, value, addArgs);
			var $el = $(elem);
			var html = $el.html();
			$el.hide().empty();
			
			if(addArgs)
				addArgs=_.clone(addArgs);
			else
				addArgs={};
			
			fArray.callAndSubscribe(function() {
				$el.hide().empty();
				var array = fArray();
				if(array) {
					_.each(fArray(), function(val,ind) {
						addArgs.$index=ind;
						addArgs.$parent=array;
						addArgs.$value=val;
						var tempDiv = document.createElement('div');
						tempDiv.innerHTML=html;
						ViewModel.findBinds(tempDiv, val, addArgs);
						var $children = $(tempDiv).children();
						$children.appendTo(elem);
					});
				}
				$el.show();
			});
			
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
			var $el=$(elem);
			var obs = ViewModel.findObservable(context, value, addArgs);
			obs.callAndSubscribe(function(){
				$el.val(this());
			});
			$el.change(function(){
				obs($el.val());
			});
		},
		attr: function(elem, value, context, addArgs) {
			var $el=$(elem);
			_.each(this.parseOptionsObject(value),function(condition,attrName){
				ViewModel.findObservable(context, condition, addArgs)
				.callAndSubscribe(function(){
					$el.attr(attrName,this());
				});
			});
		},
		style: function(elem, value, context, addArgs) {
			var $el=$(elem);
			_.each(this.parseOptionsObject(value),function(condition,style){
				ViewModel.findObservable(context, condition, addArgs)
				.callAndSubscribe(function(){
					$el.css(style,this());
				});
			});
		},
		css: function(elem, value, context, addArgs) {
			var $el=$(elem);
			_.each(this.parseOptionsObject(value),function(condition,className){
				ViewModel.findObservable(context, condition, addArgs)
				.callAndSubscribe(function(){
					if(this())
						$el.addClass(className);
					else
						$el.removeClass(className);
				});
			});
		},
		display: function(elem, value, context, addArgs) {
			var $el=$(elem);
			this.findObservable(context, value, addArgs).callAndSubscribe(function(){
				if(this())
					$el.show();
				else
					$el.hide();
			});
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