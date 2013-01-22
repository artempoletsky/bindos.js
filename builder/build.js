(function(){
	var fs = require('fs');
	var jsp = require("uglify-js").parser;
	var pro = require("uglify-js").uglify;
	var result='';
	function parse(data)
	{
		var includes=[];
		var requires=data.match(/require\(['"][^\)]+['"]\)/g);
		if(requires)
			for(var i=0,l=requires.length;i<l;i++)
			{
				var r=requires[i].match(/require\(['"]([\s\S]+)['"]\)/);
				if(r&&r[1])
				{
					includes.push(r[1]);
				}
			}
		result+=data.replace(/require\(['"][^\)]+['"]\)/g, '', 'g');
		//console.log(result);
		return includes;
	}
	
	function requireInner(path,callback)
	{
		fs.readFile(path, 'utf8', function (err,data) {
			if (err) {
				return console.log(err);
			}
			var includes=parse(data);
			var i=0;
			
			function requireNext(){
				if(includes[i])
				{
					requireInner('../'+includes[i],requireNext);
					i++;
				}
				else
					callback();
			}
			requireNext();
		});
	}
	requireInner('../src/js/requires.js',function(){
		

		var orig_code = result;
		var ast = jsp.parse(orig_code); // parse code and get the initial AST
		ast = pro.ast_mangle(ast); // get a new AST with mangled names
		ast = pro.ast_squeeze(ast); // get an AST with compression optimizations
		var final_code = pro.gen_code(ast); // compressed code here
		fs.writeFile("result.js", final_code, function(err) {
			if(err) {
				console.log(err);
			} else {
				console.log("The file was saved!");
			}
		}); 
	});
})();

