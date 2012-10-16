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
		}
	};
	this.VM=VM;
}).call(this);