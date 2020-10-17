$(document).ready(function(){

	// populate the #classification-data div
	if($('#classification-data').length){
		$.ajax({url: "get-classifications", success: function(result){
	    $("#classification-data").html(JSON.stringify(result));
  }});
	}
	
})