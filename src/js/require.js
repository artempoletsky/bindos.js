(function(){
	var XMLHttpFactories = [
	function () {
		return new XMLHttpRequest()
	},
	function () {
		return new ActiveXObject("Msxml2.XMLHTTP")
	},
	function () {
		return new ActiveXObject("Msxml3.XMLHTTP")
	},
	function () {
		return new ActiveXObject("Microsoft.XMLHTTP")
	}
	];

	function createXMLHTTPObject() {
		var xmlhttp = false;
		for (var i=0;i<XMLHttpFactories.length;i++) {
			try {
				xmlhttp = XMLHttpFactories[i]();
			}
			catch (e) {
				continue;
			}
			break;
		}
		return xmlhttp;
	};
	var EvalError=function(message,file,line){
		this.file=file;
		this.line=line;
		this.message=message;
	}
	EvalError.prototype=new Error();
	EvalError.prototype.constructor=EvalError;
	
	var require=function(path){
		for(var i=0,l=require.log.length;i<l;i++)
		{
			if(require.log[i]==path)
				return;
		}
		require.log.push(path);
		
		var xhr=createXMLHTTPObject();
		xhr.open('GET',path,false);
		xhr.send();
		if(xhr.status==200)
		{
			(new Function(xhr.responseText))();
		}
		else{
			require.log.pop();
			throw new Error('File "'+path+'" not exists!')
		}
			
	}
	require.log=[];
	require.unpack=function(){
		var result='';
		for(var i=0,l=require.log.length;i<l;i++)
		{
			result+='<script type="text/javascript" src="'+require.log[i]+'"></script>\n';
		}
		return result;
	}
	window.require=require;
})();