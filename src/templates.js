(function(){
	var rawTemplates={};
	var templates={};
	ViewModel.tmpl={
		getRawTemplate:function(name){
			return rawTemplates[name];
		},
		getTemplate:function(name){
			return templates[name];
		},
		create: function(name,rawText,selfObservable,addArgs,parentTagName){
			var tempDiv = document.createElement(parentTagName||'div');
			addArgs=addArgs||{};
			tempDiv.innerHTML=rawText;
			
			var self=selfObservable();
			var dummySelfObject={};
			selfObservable.subscribe(function(){
				_.each(dummySelfObject,function(observ,key){
					observ(this()[key]);
				});
			});
			
			_.each(selfObservable(),function(val,key){
				dummySelfObject[key]=Observable(val);
			});
			
			ViewModel.findBinds(tempDiv, dummySelfObject, addArgs);
			
			templates[name]=function(self,newAddArgs){
				
				selfObservable(self);
				_.each(newAddArgs,function(val,key){
					if(addArgs[key]&&Observable.isObservable(addArgs[key]))
						addArgs[key](val);
				});
				
				return tempDiv.innerHTML;
			};
			templates[name].childrenLength=$(tempDiv).children().length;
			
			return templates[name];
		}
	}
	
	ViewModel.binds.template=function(elem,value,context,addArgs){
		var $el=$(elem);
		var vals=value.split(/\s*,\s*/);
		var raw=$el.html();
		rawTemplates[vals[0]]=raw;
		if(vals[1])
		{
			var self=this.findObservable(context, vals[1], addArgs);
			this.tmpl.create(vals[0],raw,self,addArgs,elem.tagName.toLowerCase());
		}
		$el.remove();
		return false;
	}
	
})();