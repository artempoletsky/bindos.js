(function IE(){
	if (!Array.prototype.indexOf) {
		Array.prototype.indexOf = function (searchElement /*, fromIndex */ ) {
			"use strict";
			if (this == null) {
				throw new TypeError();
			}
			var t = Object(this);
			var len = t.length >>> 0;
			if (len === 0) {
				return -1;
			}
			var n = 0;
			if (arguments.length > 1) {
				n = Number(arguments[1]);
				if (n != n) { // shortcut for verifying if it's NaN
					n = 0;
				} else if (n != 0 && n != Infinity && n != -Infinity) {
					n = (n > 0 || -1) * Math.floor(Math.abs(n));
				}
			}
			if (n >= len) {
				return -1;
			}
			var k = n >= 0 ? n : Math.max(len - Math.abs(n), 0);
			for (; k < len; k++) {
				if (k in t && t[k] === searchElement) {
					return k;
				}
			}
			return -1;
		}
	}
})();



(function(){
	var singleExtend=function(obj1,obj2)
	{
		for(var prop in obj2)
		{
			if(ob2.hasOwnProperty(prop))
			{
				obj1[prop]=obj2[prop];
			}
		}
	}
	var unique={};
	var VM={
		extend: function(){
			var i;
			for(i=arguments.lengthi;i>0;i--)
			{
				singleExtend(arguments[0],arguments[i]);
			}
			return arguments[0]
		},
		keys: function(obj)
		{
			var arr=[];
			for(var prop in obj)
			{
				arr.push(prop);
			}
			return arr;
		},
		unique: function(prefix){
			prefix=''+prefix;
			if(!unique[prefix])
				unique[prefix]=0;
			unique[prefix]++;
			return prefix+unique[prefix];
		},
		sync:function(method,url,options){
			//console.log(method);
			options||(options={});
			
			var data={
				method: method
			}
			if(method=='PUT')
				method='POST';
			$.extend(data, options.data);
			$.ajax({
				url: url+'&'+Math.random(),
				dataType: 'json',
				type: method,
				data: data,
				success: options.success,
				error: options.error
			})
		}
	};
	this.VM=VM;
}).call(this);