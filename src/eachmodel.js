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
                    return mod.attributes[prop];
                }, context)
            })(prop, context);
        });

        return observables;
    }
    //ViewModel.compAsync=false;

    ViewModel.binds.eachModel=function(elem, value, context, addArgs) {

        var options;
        var collection, templateName, listenModels, innerBinds;
        try {
            options=this.parseOptionsObject(value)
        } catch (exception) {

        }
        if(!options)
        {
            var vals=value.split(/\s*,\s*/);
            collection=vals[0];
            templateName=vals[1];
            listenModels=false;
            innerBinds=false;
        }
        else
        {
            collection=options.collection;
            templateName=options.template;
            listenModels=options.listenModels;
            innerBinds=options.innerBinds;
        }

        var collectionObs=this.findObservable(context, collection, addArgs);
        var $el=$(elem);
        var ctx={};
        var oldCollection;
        var rawTemplate=templateName?ViewModel.tmpl.getRawTemplate(templateName):$el.html();

        var elName=elem.tagName.toLowerCase();
        //console.log(rawTemplate);
        //когда меняется целая коллекция
        collectionObs.callAndSubscribe(function(collection){

            if(oldCollection)
            {
                oldCollection.off(0,0,ctx);
                if(listenModels)
                    oldCollection.each(function(model){
                        model.off(0,0,ctx);
                    });
            }

            oldCollection=collection;
            $el.empty();
            var observers=[];
            if(!collection)
                return;


            var tempChildrenLen=1;
            //вместо многих tempDiv и modelObservable только по одной
            //template принимает модель и возвращает ее текстовое html представление
            var template=(function(collection){
                var modelClass=collection.model;
                var tempDiv = document.createElement(elName);
                tempDiv.innerHTML=rawTemplate;

                var newModel=new modelClass();
                var modelObservable=Observable(newModel);
                var context=modelToObservables(newModel.toJSON(), modelObservable, collection);
                //var oIndex=Observable(0);
                var addArgs={
                    $self: modelObservable,
                    $index: Observable(),
                    $parent: Observable()
                }

                ViewModel.findBinds(tempDiv, context, addArgs);

                tempChildrenLen=$(tempDiv).children().length;

                return function(model, $index, $parent){
                    if(innerBinds)
                    {
                        tempDiv = document.createElement(elName);
                        tempDiv.innerHTML=rawTemplate;
                        modelObservable=Observable(model);
                        context=modelToObservables(newModel.toJSON(), modelObservable, collection);

                        addArgs={
                            $self: modelObservable,
                            $index: Observable($index),
                            $parent: Observable($parent)
                        }

                        ViewModel.findBinds(tempDiv, context, addArgs);

                        observers.splice($index, 0, {
                            addArgs: addArgs,
                            context: context,
                            children: $(tempDiv).children()
                        });
                        return observers[$index].children;

                    }
                    else
                    {
                        addArgs.$index($index);
                        addArgs.$parent($parent);
                        modelObservable(model);
                        //return '<li>'+context.name()+'</li>'
                        //console.log(context.name());
                        return tempDiv.innerHTML;
                    }

                };
            })(collection);

            var listenModel=function(model)
            {
                //console.log('listen '+model.prop('name'));

                model.on('change', function(changed){
                    var index=collection.indexOf(model);
                    if(innerBinds)
                    {
                        var observer=observers[index].context;
                        _.each(changed,function(val,prop){
                            observer[prop].fire();
                        });
                    }
                    else
                    {
                        var $children=$el.children();
                        $children.slice(index,index+tempChildrenLen).empty().remove();
                        $el.children().eq(index-1*tempChildrenLen).after(template(model,index,collection));
                    }

                } ,ctx);
            }
            //склеивает все представления всех моделей в коллекции
            var onReset=function(){
                var i=0;
                var html='';
                $el.empty();
                observers=[];
                if(innerBinds)
                {
                    collection.each(function(model){
                        $el.append(template(model,i++,collection));
                    });
                }
                else
                {
                    collection.each(function(model){
                        html+=template(model,i++,collection);
                        if(listenModels)
                            listenModel(model);
                    });

                    $el.html(html);
                }

            }
            onReset();

            collection.on('add', function(newModels, index) {
                var i=0;
                var html='';
                if(innerBinds)
                {
                    html=$(document.createElement(elName));
                    _.each(newModels,function(model){
                        html.append(template(model,i++,collection));
                        listenModel(model);
                    });
                    html=html.children();
                }
                else
                {
                    //склеивает все новые представления всех новых моделей в коллекции

                    _.each(newModels,function(model){
                        html+=template(model,i++,collection);
                        if(listenModels)
                            listenModel(model);
                    });
                }



                if(index == 0) {
                    $el.prepend(html);
                } else if(tempChildrenLen && $el.children().eq(index*tempChildrenLen).length) {
                    $el.children().eq(index*tempChildrenLen).after(html);
                } else {
                    $el.append(html);
                }
            },ctx);
            if(listenModels)
                collection.on('beforeReset', function(models){
                    _.each(models,function(model){
                        model.off(0,0,ctx);
                    });
                } ,ctx);
            collection.on('reset', onReset ,ctx);
            collection.on('cut', function(rejectedModels){

                var $children=$el.children();

                _.each(rejectedModels,function(model,index){
                    index*=1;
                    if(listenModels)
                        model.off(0,0,ctx);

                    if(innerBinds)
                        observers.splice(index, 1);

                    $children.slice(index,index+tempChildrenLen).empty().remove();
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
        });

        return false;
    };
    //deprecated since 07.03.13
    ViewModel.binds.eachModelLight=ViewModel.binds.eachModel;
})();


