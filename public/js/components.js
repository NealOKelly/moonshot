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
					// If records can be attached to the classification then add a class.
					if(classifications.Results[i].ClassificationCanAttachRecords.Value==true){
						$("#classification-uri-" + classifications.Results[i].Uri).addClass("classification-can-attach-records")
					}

						
					intClassificationsDisplayed++;
					}
					}
					else{
						var strParentListItemId = "#classification-uri-" + classifications.Results[i].ClassificationParentClassification.Uri;  //get the ID of he parenet Classification.
						
						if($(strParentListItemId).length)  // if list item for the parent Classification exists
							{
							if(!$(strParentListItemId + " ul").length){  // add a new unordered list if none exists.
								$(strParentListItemId).append("<ul style='list-style-type:none;list-style-position: outside;'></ul>");
							}
							if(!$("#classification-uri-" + classifications.Results[i].Uri).length)
								{
								$(strParentListItemId + "> ul").append("<li id='classification-uri-" + classifications.Results[i].Uri + "'><span class='collapsed'></span><span class='folder'></span><span class='classification-name'><a href='#'>" + classifications.Results[i].ClassificationName.Value + "</a></span></li>")
									
								// If records can be attached to the classification then add a class.
								if(classifications.Results[i].ClassificationCanAttachRecords.Value==true){
									$("#classification-uri-" + classifications.Results[i].Uri).addClass("classification-can-attach-records")
								}
									
									
								intClassificationsDisplayed++;
								}
						}
					}
				}		
		}
		// sort	 this list.

		$('ul').each(function(_, ul) {
		// get all the nodes to be sorted
		var $toSort = $(ul).children('li');
		$toSort.sort((li1, li2) => $(li1).children(".classification-name").text().localeCompare($(li2).children(".classification-name").text()));
		$toSort.each(function() {
		  $(this).appendTo(ul);
		});
	 });
		// hide everything but top-level classification on load.
		$("#classification-treeview li").each(function(_, li) {
			if($(this).parent().parent().is("li")){
				$(this).addClass("classification-hidden")
			}
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

// Click on collpased caret
$(document).on("click", ".collapsed", function(){
	var parentNodeId = $(event.target).parent().attr("id");
	//alert(parentNodeId)
	$("#" + parentNodeId +" > ul > li").removeClass("classification-hidden")
	$("#" + parentNodeId + " > span.collapsed").addClass("expanded")
	$("#" + parentNodeId +" > span.collapsed").removeClass("collapsed")
	$("#" + parentNodeId + " > span.folder").addClass("folder-open")
	$("#" + parentNodeId +" > span.folder").removeClass("folder")
})
// Click on expanded caret
$(document).on("click", ".expanded", function(){
	var parentNodeId = $(event.target).parent().attr("id");
	$("#" + parentNodeId + " > span.expanded").addClass("collapsed")
	$("#" + parentNodeId +" > span.expanded").removeClass("expanded")
	$("#" + parentNodeId + " > span.folder-open").addClass("folder")
	$("#" + parentNodeId +" > span.folder-open").removeClass("folder-open")
})




// Click on expanded caret
$(document).on("click", ".expanded", function(){
	var parentNodeId = $(event.target).parent().attr("id");
	//alert(parentNodeId)
	$("#" + parentNodeId +" > ul > li").addClass("classification-hidden")
	//alert($("#" + event.target).attr("id"))
	//$("#" + event.target + "> ul > li").removeClass("classification-hidden")
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



