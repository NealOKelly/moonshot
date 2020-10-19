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

$(document).on("click", ".folder-open", function(){
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

// Click on folder-fill Icon //
$(document).on("click", ".folder-fill", function(){
	var eventTargetParent = $(event.target).parent();
	highlightSelectedFolder(eventTargetParent)
	var recordUri = eventTargetParent.attr("id").substr(11)
	//getRecordProperties(recordUri)

})

// Click on folder-fill Icon //
$(document).on("click", ".record-title>a", function(){
	var eventTargetParent = $(event.target).parent();
	highlightSelectedFolder(eventTargetParent.parent())
	var recordUri = eventTargetParent.attr("id").substr(11)
	//getRecordProperties(recordUri)

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
	//alert(parentNodeId)
	
	
	if($("#" + parentNodeId).hasClass("classification-can-attach-records")){
		classificationUri = parentNodeId.substr(19)
		//alert(classificationUri)
		$.ajax({url: "/get-classification-records?uri=" + classificationUri, success: function(result){
			if(result.TotalResults>0){
				$("#" + parentNodeId + " ul").remove()  // clear existing list of folders.
				$("#" + parentNodeId).append("<ul style='list-style-type:none;list-style-position: outside;'></ul>")
				for(var i=0; i<result.TotalResults; i++){
					//alert("Uri: " + result.Results[i].Uri)
					$("#" + parentNodeId + " > ul").append("<li id='record-uri-" + result.Results[i].Uri + "'><span style='padding: 12px 20px;'></span><span class='folder-fill'></span><span class='record-title'><a href='#'>" + result.Results[i].RecordTitle.Value + "</a></span></li>")
				}
				
						$('ul').each(function(_, ul) {
		// get all the nodes to be sorted
		var $toSort = $(ul).children('li');
		$toSort.sort((li1, li2) => $(li1).children(".record-title").text().localeCompare($(li2).children(".record-title").text()));
		$toSort.each(function() {
		  $(this).appendTo(ul);
		});
	 });
				
				
				
			}
			
			}, error: function(result){
				console.log("Oooops!")
				}});
			}
	})


// Click on expanded caret
$(document).on("click", ".expanded", function(){
	var parentNodeId = $(event.target).parent().attr("id");
	$("#" + parentNodeId +" > ul > li").addClass("classification-hidden")
	$("#" + parentNodeId + " > span.expanded").addClass("collapsed")
	$("#" + parentNodeId +" > span.expanded").removeClass("expanded")
	$("#" + parentNodeId + " > span.folder-open").addClass("folder")
	$("#" + parentNodeId +" > span.folder-open").removeClass("folder-open")
	classificationUri = parentNodeId.substr(19)
	if($("#" + parentNodeId).hasClass("classification-can-attach-records")){
		$("#" + parentNodeId + " ul").remove() //clear folder when parent is collapsed.
	}
})

// Functions // 
function highlightSelectedClassification(eventTargetParent){
	$("#classification-treeview li").removeClass("classification-node-selected")
	$("#" + eventTargetParent.attr("id")).addClass("classification-node-selected")
}

function highlightSelectedFolder(eventTargetParent){
	$("#classification-treeview li").removeClass("folder-node-selected")
	$("#" + eventTargetParent.attr("id")).addClass("folder-node-selected")
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

function getClassificationRecords(classificationUri){
	
			$.ajax({url: "/get-classification-records", success: function(result){
    	
		var details = JSON.stringify(result);
			console.log("Success")

  	}, error: function(result){
		console.log("Oooops!")
	}});
	
}




