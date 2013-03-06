(function() {
	ViewModel.binds = {
		log: function(elem, value, context, addArgs) {
			this.findObservable(context, value, addArgs).callAndSubscribe(function(){
				console.log(context, '.', value, '=', this());
			})
		},
		src: function(elem,value,context,addArgs){
			this.findObservable(context, value, addArgs)
			.callAndSubscribe(function(val){
				elem.src=val?val:'';
			});
		},
		html: function(elem, value, context, addArgs) {
			//var $el=$(elem);
			this.findObservable(context, value, addArgs)
			.callAndSubscribe(function(val){
				elem.innerHTML=val;
			});
		},
		text: function(elem, value, context, addArgs) {
			var $el=$(elem);
			this.findObservable(context, value, addArgs)
			.callAndSubscribe(function(val){
				$el.text(val);
			});
		},
		'with': function(elem, value, context, addArgs) {
			return this.findObservable(context, value, addArgs)();
		},
		each: function(elem, value, context, addArgs) {
			var fArray = this.findObservable(context, value, addArgs);
			var $el = $(elem);
			var html = $el.html();
			$el.empty();
			
			if(addArgs)
				addArgs=_.clone(addArgs);
			else
				addArgs={};
			//console.log(elem);
			fArray.callAndSubscribe(function(array) {
				$el.empty();
			//	console.log(array);
				if(array) {
					_.each(array, function(val,ind) {
						addArgs.$index=ind;
						addArgs.$parent=array;
						addArgs.$value=val;
						var tempDiv = document.createElement('div');
						tempDiv.innerHTML=html;
						ViewModel.findBinds(tempDiv, val, addArgs);
						$el.append(tempDiv.innerHTML);
					});
				}
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
			obs.callAndSubscribe(function(value){
				$el.val(value);
			});
			$el.change(function(){
				obs($el.val());
			});
		},
		attr: function(elem, value, context, addArgs) {
			_.each(this.parseOptionsObject(value),function(condition,attrName){
				ViewModel.findObservable(context, condition, addArgs)
				.callAndSubscribe(function(val){
					if(val)
						elem.setAttribute(attrName, val)
					else
						elem.removeAttribute(attrName);
				});
			});
		},
		style: function(elem, value, context, addArgs) {
			var $el=$(elem);
			_.each(this.parseOptionsObject(value),function(condition,style){
				ViewModel.findObservable(context, condition, addArgs)
				.callAndSubscribe(function(value){
					$el.css(style,value);
				});
			});
		},
		css: function(elem, value, context, addArgs) {
			var $el=$(elem);
			_.each(this.parseOptionsObject(value),function(condition,className){
				ViewModel.findObservable(context, condition, addArgs)
				.callAndSubscribe(function(value){
					if(value)
						$el.addClass(className);
					else
						$el.removeClass(className);
				});
			});
		},
		display: function(elem, value, context, addArgs) {
			var $el=$(elem);
			this.findObservable(context, value, addArgs).callAndSubscribe(function(value){
				if(value)
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
