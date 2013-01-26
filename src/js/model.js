(function(){
	var modelsMap={};
	
	var Model=Events.extend({
		constructor: function(data,options){
			data||(data={});
			options||(options={});
			this.attributes=_.extend({},this.defaults,this.parse(data));
			this._changed={};
			this.id=this.attributes[this.idAttribute];
			this.cid=_.unique('c');
			//заносим в глобальную коллекцию
			if(this.mapping&&this.id)
			{
				modelsMap[this.mapping]||(modelsMap[this.mapping]={});
				modelsMap[this.mapping][this.id]=this;
			}
			this.initialize();
		},
		initialize: function(){
			return this;
		},
		idAttribute: 'id',
		mapping: false,
		defaults: {},
		toJSON: function(){
			return _.clone(this.attributes);
		},
		parse: function(json) {
			return json;
		},
		baseURL: '/',
		url: function(){
			var mapping=this.mapping||'';
			return this.baseURL+mapping+'/'+this.id;
		},
		update: function(json){
			this.set(this.parse(json));
			this._changed = {};
			return this;
		},
		prop: function(key){
			if(arguments.length==1&&typeof key=='string')
			{
				return this.attributes[key];
			}
			var values={};
			if(typeof key=='string')
				values[key]=arguments[1];
			else
				values=key;
			var self=this;
			_.each(values,function(val,key){
				self._changed[key]=self.attributes[key]=val;
				self.fire('change:'+key);
			});
			this.fire('change');
			return this;
		},
		/**
		 * DEPRECATED since 26.01.2013
		 */
		get: function(key){
			return this.prop.apply(this, arguments);
		},
		/**
		 * DEPRECATED since 26.01.2013
		 */
		set: function(){
			return this.prop.apply(this, arguments);
		},
		validate : function() {
			return true;
		},
		fetch: function(options){
			var me = this;
			options || (options = {});
			var opt = {
				success: function(data) {
					me.update(data);
					if(typeof options.success == 'function') {
						options.success.apply(me, arguments);
					}
				},
				error: function() {
					if(typeof options.error == 'function') {
						options.error.apply(me, arguments);
					}
				}
			};
			var resOpt = _.extend({}, options, opt);
			Model.sync('read', this.url(), resOpt);
			return this;
		},
		save: function(){
			var me = this;
			if(this.id) {
				Model.sync('update', this.url(), {
					data: this._changed,
					success: function(data) {
						me.update(data);
					}
				});
			} else {
				Model.sync('create', this.url(), {
					data: this.attributes,
					success: function(data) {
						me.update(data);
					}
				});
			}
			return this;
		},
		remove: function() {
			this.fire('remove');
			if(this.id) {
				VM.sync('delete', this.url());
			}
		}
	});
	
	Model.fromStorage = function(name, id) {
		modelsMap[name] || (modelsMap[name] = {});
		return modelsMap[name][id];
	};
	Model.createOrUpdate = function(constuctor, json) {
		var proto = constuctor.prototype, fromStorage, idAttr, parsed, id;
		if(proto.mapping) {
			idAttr = proto.idAttribute;
			parsed = proto.parse(json);
			fromStorage = Model.fromStorage(proto.mapping, parsed[idAttr]);
			if(fromStorage) {
				fromStorage.update(json);
				return fromStorage;
			}
		}
		return new constuctor(json);
	}
	
	Model.sync=function(method,url,options){
		options||(options={});
		var data={
			method: method
		}
		if(method=='PUT')
			method='POST';
		$.extend(data, options.data);
		$.ajax({
			url: url,
			dataType: 'json',
			type: method,
			data: data,
			success: options.success,
			error: options.error
		})
	}
	
	this.Model = Model;
})();
