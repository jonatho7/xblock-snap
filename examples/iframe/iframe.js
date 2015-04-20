jQuery(document).ready(function(){ 		
		setInterval(function() {
	// Send the message "Hello" to the parent window
	// ...if the domain is still "davidwalsh.name"
	var x = {"test" : [1, 2, 3]}
	parent.postMessage(x,"*");
},1000);
});