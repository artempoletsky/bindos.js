(function(){
	var eventSplitter = /\s+/;
	var namespaceSplitter = '.';
	
	function parse(event) {
		var arr = ('' + event).split(namespaceSplitter);
		return {
			n: arr[0],
			ns: arr.slice(1),
			o: event
		}
	}

	function compareNames(arr1, arr2) {
		for(var i = arr1.length - 1; i >= 0; i--) {
			if(!~arr2.indexOf(arr1[i])) {
				return false;
			}
		}
		return true;
	}

	function compareBinds(bind1, bind2, nsInvert) {
		if(bind1.n && bind1.n != bind2.n) {
			return false;
		}
		if(bind1.fn && bind1.fn !== bind2.fn) {
			return false;
		}

		if(bind1.c && bind1.c !== bind2.c) {
			return false;
		}
		if(bind1.ns.length && !compareNames(bind1.ns, bind2.ns)) {
			return false;
		}
		return true;
	}

	function makeBind(event, fn, context,isSignal) {
		var bind = parse(event);
		bind.fn = fn;
		bind.c = context;
		bind.s=isSignal;
		return bind;
	}

	function add(self, bind) {
		var binds, curBind;

		binds = self._listeners || {}

		curBind = binds[bind.n] || [];

		curBind.push(bind);

		binds[bind.n] = curBind;

		self._listeners = binds;
	}

	var findBinds = function (binds, event, fn, context, mode) {
		var result = [], a, b, bind = makeBind(event, fn, context);
		if(!mode) {
			mode = 'filter';
		}

		for(a in binds) {

			for(b = binds[a].length - 1; b >= 0; b--) {
				if(compareBinds(bind, binds[a][b])) {
					if(mode == 'filter') {
						result.push(binds[a][b]);
					} else {
						if(mode == 'any') {
							return true;
						}
					}
				} else {
					if(mode == 'invert') {
						result.push(binds[a][b]);
					}
				}

			}
		}
		if(mode != 'any') {
			return result;
		} else {
			return false;
		}
	}

	var remove=function (event, fn, context) {
		var bind, binds, i;
		if(!this._listeners) {
			return;
		}
		if(!event && !fn && !context) {
			delete this._listeners;
			return;
		}

		bind = makeBind(event, fn, context);

		if(!bind.ns.length && !fn && !context) {
			delete this._listeners[bind.n];
			return;
		}

		binds = findBinds(this._listeners, event, fn, context, 'invert');

		delete this._listeners;
		for(i = binds.length - 1; i >= 0; i--) {
			add(this, binds[i])
		}
	}
	
	var Events=Class.extend({
		on: function(events, fn, context){
			var aEvents = events.split(eventSplitter), i, bind;
			if(typeof fn != 'function') {
				throw TypeError('function expected');
			}

			if(!context) {
				context = this;
			}
			for(i = aEvents.length - 1; i >= 0; i--) {
				bind = makeBind(aEvents[i], fn, context);
				add(this, bind);
			}
			return this;
		},
		off: function(events, fn, context) {
			if(!events) {
				remove.call(this, '', fn, context);
				return this;
			}
			var aEvents = events.split(eventSplitter), i, l;
			for(i = 0, l = aEvents.length; i < l; i++) {
				remove.call(this, aEvents[i], fn, context)
			}
			return this;
		},
		fire: function(events) {
			if(!this._listeners) 
				return this;
			var args = Array.prototype.slice.call(arguments,1);
			
			var aEvents,i,j,l,binds,bind,type;
			aEvents=typeof events == 'string'? events.split(eventSplitter): [events];
		
			for(i=0,l=aEvents.length;i<l;i++)
			{
				type=typeof aEvents[i] == 'string'? aEvents[i]: aEvents[i].type;
			
				binds=findBinds(this._listeners,type,false,false);
				
				for(j=binds.length-1;j>=0;j--)
				{
					bind=binds[j];
					if(bind.s)
						this.off(undefined, bind.fn)
					//args.unshift(aEvents[i]);
					bind.fn.apply(bind.c, args);
				//args.shift();
				}
			}

			return this;
		},
		one: function(events, fn, context) {
			var aEvents = events.split(eventSplitter), i, bind;
			if(typeof fn != 'function') {
				throw TypeError('function expected');
			}

			if(!context) {
				context = this;
			}
			for(i = aEvents.length - 1; i >= 0; i--) {
				bind = makeBind(aEvents[i], fn, context,true);
				add(this, bind);
			}
			return this;
		},
		hasListener : function(event) {
			if(!this._listeners) {
				return false;
			}
			return findBinds(this._listeners, event, false, false, 'any');
		}
	});
	Events.prototype.trigger = Events.prototype.fire;
	this.Events=Events;
})();