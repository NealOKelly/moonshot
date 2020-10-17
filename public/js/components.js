$(document).ready(function(){

	// populate the #classification-data div
	if($('#classification-treeview').length){
		$.ajax({url: "get-classifications", success: function(result){
			var classifications = result;
		var intClassificationsDisplayed = 0;
		while (intClassificationsDisplayed < classifications.Results.length){
			
			for(var i=0; i<classifications.Results.length; i++){
				if(!classifications.Results[i].hasOwnProperty("ClassificationParentClassification"))
					{
					if(!$("#classification-uri-" + classifications.Results[i].Uri).length){

					$("#classification-treeview ul").append("<li id='classification-uri-" + classifications.Results[i].Uri + "'><span class='expand-icon'>+</span><span class='folder-icon'></span>" + classifications.Results[i].ClassificationName.Value + "</li>");	
					intClassificationsDisplayed = intClassificationsDisplayed + 1;
					}
					}
					else{
						var strNewListItemId = "#classification-uri-" + classifications.Results[i].Uri;
						console.log(strNewListItemId)
						
						var strParentListItemId = "#classification-uri-" + classifications.Results[i].ClassificationParentClassification.Uri;
						//$(strParentListItemId).addClass("has-children");
						//$(strParentListItemId).children(".expand-icon").css("background-color","lime")		
						//$(strParentListItemId).children(".expand-icon").html("+")	

						if(!$(strNewListItemId).length){
							if($(strParentListItemId).length)
								{
								if(!$(strParentListItemId + " ul").length){
									$(strParentListItemId).append("<ul class='classification-hidden'></ul>");
								}
								if(!$("#classification-uri-" + classifications.Results[i].Uri).length)
									{
									$(strParentListItemId + " ul").append("<li style='list-style-type:none;' id='classification-uri-" + classifications.Results[i].Uri + "'><span class='expand-icon'>-</span><span class='folder-icon'></span>" + classifications.Results[i].ClassificationName.Value + "</li>")
									intClassificationsDisplayed++;
									}
							}
						}
						//console.log($(strParentListItemId + ">ul>li span .expand-icon").html(""));
						//$(".expand-icon").parent().addClass("has-children");

					}
			}		
		}
				}
			});
		}
	})