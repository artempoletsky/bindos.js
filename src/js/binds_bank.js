(function(){
	ViewModel.binds={
		html: function(elem,value,context){
			var comp=ViewModel.findObservable(context, value);
			var fn=function(){
				$(elem).html(comp());
			}
			fn();
			comp.subscribe(fn);
		},
		'with': function (elem,value,context){
			var comp=ViewModel.findObservable(context, value);
			return comp();
		},
		each: function (elem,value,context){
			var collection=ViewModel.findObservable(context, value)();
			
			var html=$(elem).html();
			$(elem).empty();
			
			collection.on('add',function(e){
				//console.log(e.model);
				var tempDiv=document.createElement('div');
				$(tempDiv).html(html);
				var obs=Observable(e.model);
				ViewModel.findBinds(tempDiv, obs);
				var $children=$(tempDiv).children();
				$children.appendTo(elem);
				e.model.one('remove',function(){
					$children.remove();
				}).on('change',function(e){
					obs.fire();
				})
			});
			return false;
		},
		value: function (elem,value,context){
			var comp=ViewModel.findObservable(context, value);
			var fn=function(){
				$(elem).val(comp());
			}
			fn();
			comp.subscribe(fn);
		},
		attr: function (elem,value,context){
			value=value.match(/^{([\s\S]+)}$/)[1];
			//console.log(context);
			var attrs=value.split(/\s*,\s*/);
			for(var i=attrs.length-1;i>=0;i--)
			{
				var arr=attrs[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);
				var comp=ViewModel.findObservable(context, arr[2]);
				var fn=function(){
					$(elem).attr(arr[1],comp());
				}
				fn();
				comp.subscribe(fn);
			}
		},
		style: function (elem,value,context){
			value=value.match(/^{([\s\S]+)}$/)[1];
			//console.log(context);
			var attrs=value.split(/\s*,\s*/);
			for(var i=attrs.length-1;i>=0;i--)
			{
				var arr=attrs[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);
				//console.log(arr);
				var comp=ViewModel.findObservable(context, arr[2]);
				var fn=function(){
					$(elem).css(arr[1],comp());
				}
				fn();
				comp.subscribe(fn);
			}
		},
		css: function (elem,value,context){
			value=value.match(/^{([\s\S]+)}$/)[1];
			//console.log(context);
			var attrs=value.split(/\s*,\s*/);
			for(var i=attrs.length-1;i>=0;i--)
			{
				var arr=attrs[i].match(/^\s*(\S+?)\s*:\s*(\S[\s\S]*\S)\s*$/);
				var comp=ViewModel.findObservable(context, arr[2]);
				var fn=function(){
					if(comp())
					{
						$(elem).addClass(arr[1]);
					}
					else
					{
						$(elem).removeClass(arr[1]);
					}
				}
				fn();
				comp.subscribe(fn);
			}
		}
	};
})();
