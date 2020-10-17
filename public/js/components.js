$(document).ready(function(){

	// populate the #classification-data div
	if($('#classification-treeview').length){
		$.ajax({url: "get-classifications", success: function(result){
			var classifications = result;
			//alert(classifications.Results.length);
			//alert(classifications.length)
			for(var i=0; i<classifications.Results.length; i++){
				$("#classification-treeview ul").append("<li>" + classifications.Results[i].ClassificationName.Value + "</li>");
					}
				}
			});
		}
	})