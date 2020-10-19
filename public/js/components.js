$(document).ready(function(){

	// populate the #classification-data div
	$.ajax({url: "/get-classifications", success: function(result){
    	
		var classifications = result;
		var intClassificationsDisplayed = 0;
		while (intClassificationsDisplayed < classifications.Results.length)
		{
			
			for(var i=0; i<classifications.Results.length; i++){
				
				if(!classifications.Results[i].hasOwnProperty("ClassificationParentClassification"))
					{
						//console.log("Top Level: " + classifications.Results[i].ClassificationName.Value)

					if(!$("#classification-uri-" + classifications.Results[i].Uri).length){

					$("#classification-treeview > ul").append("<li id='classification-uri-" + classifications.Results[i].Uri + "'><span class='collapsed'></span><span class='folder'></span><span class='classification-name'><a href='#'>" + classifications.Results[i].ClassificationName.Value + "</a></span></li>");	
					intClassificationsDisplayed++;
					}
					}
					else{
					//var strNewListItemId = "#classification-uri-" + classifications.Results[i].Uri;
						
						//console.log("Name: " + classifications.Results[i].ClassificationName.Value + "; ParentName: " + classifications.Results[i].ClassificationParentClassification.ClassificationTitle.Value + "; ParentURI: " + classifications.Results[i].ClassificationParentClassification.Uri + "; Exists: " + $(strParentListItemId).length)
					
						var strParentListItemId = "#classification-uri-" + classifications.Results[i].ClassificationParentClassification.Uri;  //get the ID of he parenet Classification.
						//console.log(strParentListItemId)
						
						if($(strParentListItemId).length)  // if lis item for the parent Classification exists
							{
							if(!$(strParentListItemId + " ul").length){  // add a new unordered list if none exists.
								$(strParentListItemId).append("<ul class='classification-hidden' style='list-style-type:none;list-style-position: outside;'></ul>");
							}
							if(!$("#classification-uri-" + classifications.Results[i].Uri).length)
								{
								$(strParentListItemId + "> ul").append("<li id='classification-uri-" + classifications.Results[i].Uri + "'><span class='collapsed'></span><span class='folder'></span><span class='classification-name'><a href='#'>" + classifications.Results[i].ClassificationName.Value + "</a></span></li>")
								intClassificationsDisplayed++;
								}
						}
					}
				}		
		}
		// sort	

		$('ul').each(function(_, ul) {
		// get all the nodes to be sorted
		var $toSort = $(ul).children('li');
		$toSort.sort((li1, li2) => $(li1).children(".classification-name").text().localeCompare($(li2).children(".classification-name").text()));
		$toSort.each(function() {
		  $(this).appendTo(ul);
		});
	 });

  	}, error: function(result){
		console.log("Oooops!")
	}});
	
		

	
	
	
	})

//////// Handle Events  /////////

///// Classiciation Control Events /////

// Click on folder Icon //
$(document).on("click", ".folder", function(){
	var eventTargetParent = $(event.target).parent();
	highlightSelectedClassification(eventTargetParent)
	var classificationUri = eventTargetParent.attr("id").substr(19)
	getClassificationProperties(classificationUri)

})

// Click on Classification Name Hyperlink //
$(document).on("click", ".classification-name>a", function(){
	var eventTargetParent = $(event.target).parent();
	highlightSelectedClassification(eventTargetParent.parent())
	var classificationUri = eventTargetParent.parent().attr("id").substr(19)
	getClassificationProperties(classificationUri)
})


// Functions // 
function highlightSelectedClassification(eventTargetParent){
	$("#classification-treeview li").removeClass("classification-node-selected")
	$("#" + eventTargetParent.attr("id")).addClass("classification-node-selected")
}

function getClassificationProperties(classificationUri){
	
			$.ajax({url: "/get-classification-details?uri=" + classificationUri, success: function(result){
    	
		var details = JSON.stringify(result);
		////		var details = result;

			//$("#details-panel").html(details);
			console.log("result=" + result.Results[0].ClassificationCanAttachRecords.Value)		
			$("#classificationNameValue").html(result.Results[0].ClassificationName.Value)
			$("#classificationAccessControlValue").html(result.Results[0].ClassificationAccessControl.Value)
			$("#classificationCanAttachRecordsValue").html(result.Results[0].ClassificationCanAttachRecords.Value)

  	}, error: function(result){
		console.log("Oooops!")
	}});
	
}



