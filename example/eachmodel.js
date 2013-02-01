(function(){
	var modelToObservables=function(attrs, oModel , context) {
		
		var observables={};
		_.each(attrs, function(val,prop){
			observables[prop]=(function(prop, context) {
				return Computed(function() {
					var mod = oModel();
					if(!mod) {
						return '';
					}
					return mod.prop(prop);
				}, context)
			})(prop, context);
		});
		
		return observables;
	}
	ViewModel.compAsync=false;
	
	ViewModel.binds.eachModelLight=function(elem, value, context, addArgs) {
		var collectionObs=this.findObservable(context, value, addArgs);
		var $el=$(elem);
		var ctx={};
		var oldCollection;
		var rawTemplate=$el.html();
		
		var elName=elem.tagName.toLowerCase();
		//console.log(rawTemplate);
		//когда меняется целая коллекция
		var rebindCollection=function(collection){
			$el.empty();
			if(oldCollection)
				oldCollection.off(0,0,ctx);
			oldCollection=collection;
			
			if(!collection)
				return;
			
			
			var tempChildrenLen=1;
			//вместо многих tempDiv и modelObservable только по одной
			//template принимает модель и возвращает ее текстовое html представление
			var template=(function(collection){
				var modelClass=collection.model;
				var tempDiv = document.createElement(elName);
				tempDiv.innerHTML=rawTemplate;
				var modelObservable=Observable();
				var context=modelToObservables((new modelClass()).toJSON(), modelObservable, collection);
				//var oIndex=Observable(0);
				var addArgs={
					$index: Observable(),
					$parent: Observable()
				}
				ViewModel.findBinds(tempDiv, context, addArgs);
			
				tempChildrenLen=$(tempDiv).children().length;
				
				return function(model, $index, $parent){
					addArgs.$index($index);
					addArgs.$parent($parent);
					modelObservable(model);
					//return '<li>'+context.name()+'</li>'
					//console.log(context.name());
					return tempDiv.innerHTML;
				};
			})(collection);
			
			var i=-1;
			//склеивает все представления всех моделей в коллекции
			$el.html(collection.reduce(function(memo,model){
				i++;
				return memo+template(model,index+i,collection);
			},''));
		
			collection.on('add', function(newModels, index) {
				var i=-1;
				//склеивает все новые представления всех новых моделей в коллекции
				var html=_.reduce(newModels,function(memo,model){
					i++;
					return memo+template(model,index+i,collection);
				},'');
				
				if(index == 0) {
					$el.prepend(html);
				} else if(tempChildrenLen && $el.children().eq(index*tempChildrenLen).length) {
					$el.children().eq(index*tempChildrenLen).after(html);
				} else {
					$el.append(html);
				}		
			},ctx);
			collection.on('cut', function(model, index) {
				$el.children().slice(index,index+tempChildrenLen)
				.empty().remove();
			},ctx);
			collection.on('reset', function(){
				var i=-1;
				$el.empty().html(collection.reduce(function(memo,model){
					i++;
					return memo+template(model,i,collection);
				},''));
			},ctx);
			collection.on('reject', function(rejectedModels){
				var addIndex=0;
				var $children=$el.children();
				
				_.each(rejectedModels,function(model,index){
					index*=1;
					$($children.slice(index,index+tempChildrenLen)).empty().remove();
					addIndex+=tempChildrenLen;
				});
			},ctx);
			collection.on('sort', function(indexes){
				var $tempDiv=$(document.createElement('div'));
				var $children=$el.children();
				
				_.each(indexes,function(newIndex,oldIndex){
					oldIndex*=1;
					$tempDiv.append($children.slice(oldIndex,oldIndex+tempChildrenLen));
				});
				$el.append($tempDiv.children());
			},ctx);
		}
				
				
		var fn=function(){
			rebindCollection(collectionObs());
		}
		fn();
		collectionObs.subscribe(fn);
				
		return false;
	};
})();


