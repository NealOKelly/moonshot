$(document).ready(function(){

	// populate the #classification-data div
	if($('#classification-treeview').length){
		$.ajax({url: "get-classifications", success: function(result){
	    $("#classification-treeview").html(JSON.stringify(result));
  }});
	}
	
})