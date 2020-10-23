$(document).ready(function()
	{
	// populate the #classification-data div
	var url = url = "/Search?q=all&properties=ClassificationName, ClassificationParentClassification, ClassificationCanAttachRecords&trimtype=Classification"
	$.ajax(
		{
		url: url,
		success: function(result)
			{
			var classifications = result;
			var intClassificationsDisplayed = 0;
				console.log(classifications)
			//while (intClassificationsDisplayed < classifications.Results.length)
			//	{
				for(var i=0; i<classifications.TotalResults; i++)
					{
					if(!classifications.Results[i].hasOwnProperty("ClassificationParentClassification"))
						{
						if(!$("#classification-uri-" + classifications.Results[i].Uri).length)
							{
							addClassificationNode("#classification-treeview > ul", classifications.Results[i].Uri, classifications.Results[i].ClassificationName.Value)
							// If records can be attached to the classification then add a class.
							if(classifications.Results[i].ClassificationCanAttachRecords.Value==true){
								$("#classification-uri-" + classifications.Results[i].Uri).addClass("classification-can-attach-records")
							}
					//	intClassificationsDisplayed++;
						}
					}
					}		
			//	}
			// sort	 this list.
			sortClassificationTree(".classification-name")
			// hide everything but top-level classification on load.
			$("#classification-treeview li").each(function(_, li)
				{
				if($(this).parent().parent().is("li"))
					{
					$(this).addClass("classification-hidden")
					}
				});
			}, 
		error: function(result)
			{
			console.log("Oooops!")
			console.log(result)
			}
		});
	})

//////// Handle Events  /////////

///// Classiciation Control Events /////

// Click on folder Icon //
$(document).on("click", ".folder", function()
	{
	var eventTargetParent = $(event.target).parent();
	highlightSelectedClassification(eventTargetParent)
	var classificationUri = eventTargetParent.attr("id").substr(19)
	getClassificationProperties(classificationUri)
	})

$(document).on("click", ".folder-open", function()
	{
	var eventTargetParent = $(event.target).parent();
	highlightSelectedClassification(eventTargetParent)
	var classificationUri = eventTargetParent.attr("id").substr(19)
	getClassificationProperties(classificationUri)
	})


// Click on Classification Name Hyperlink //
$(document).on("click", ".classification-name>a", function()
	{
	var eventTargetParent = $(event.target).parent();
	highlightSelectedClassification(eventTargetParent.parent())
	var classificationUri = eventTargetParent.parent().attr("id").substr(19)
	getClassificationProperties(classificationUri)
	})

// Click on folder-fill Icon //
$(document).on("click", ".folder-fill", function()
	{
	var eventTargetParent = $(event.target).parent();
	highlightSelectedFolder(eventTargetParent)
	})

// Click on folder-fill Icon //
$(document).on("click", ".record-title>a", function()
	{
	var eventTargetParent = $(event.target).parent();
	highlightSelectedFolder(eventTargetParent.parent())
	})

// Click on collpased caret
$(document).on("click", ".collapsed", function()
	{
	var parentNodeId = $(event.target).parent().attr("id");
	//alert(parentNodeId)
	$("#" + parentNodeId + " > ul > li").removeClass("classification-hidden")
	$("#" + parentNodeId + " > span.collapsed").addClass("expanded")
	$("#" + parentNodeId + " > span.collapsed").removeClass("collapsed")
	$("#" + parentNodeId + " > span.folder").addClass("folder-open")
	$("#" + parentNodeId + " > span.folder").removeClass("folder")

	// check for new classifications.
	var q="parent:" + parentNodeId.substr(19);
	$.ajax(
	{
	url: "/Search?q=" + q + "&properties=ClassificationName, ClassificationParentClassification, ClassificationCanAttachRecords&trimtype=Classification",
	success: function(result)
		{
		if(result.TotalResults>0){
			$("#" + parentNodeId).append("<ul style='list-style-type:none;'></ul>")
		}
		for (i=0; i<result.TotalResults; i++)  // for each classification returned in the search result
			{
			if(!$("#classification-uri-" + result.Results[i].Uri).length)
				{
				addClassificationNode("#" + parentNodeId + " > ul", result.Results[i].Uri, result.Results[i].ClassificationName.Value)
				}
			}
		}, 
	error: function(result)
		{
		console.log("Oooops!")
		}
	});
	

	if($("#" + parentNodeId).hasClass("classification-can-attach-records"))
		{
		addFolderNodes("classification", parentNodeId)
		}
	if($("#" + parentNodeId).hasClass("folder-intermediate"))
		{
		console.log("You have clicked onto the caret next to an intermediate folder.")
		addFolderNodes("record", parentNodeId)
		}
	})

// Click on expanded caret
$(document).on("click", ".expanded", function()
	{
	var parentNodeId = $(event.target).parent().attr("id");
	$("#" + parentNodeId + " > ul > li").addClass("classification-hidden")
	$("#" + parentNodeId + " > span.expanded").addClass("collapsed")
	$("#" + parentNodeId + " > span.expanded").removeClass("expanded")
	$("#" + parentNodeId + " > span.folder-open").addClass("folder")
	$("#" + parentNodeId + " > span.folder-open").removeClass("folder-open")
	if($("#" + parentNodeId).hasClass("classification-can-attach-records"))
		{
		$("#" + parentNodeId + " ul").remove() //clear folder when parent is collapsed.
		}
	if($("#" + parentNodeId).hasClass("folder-intermediate"))
		{
		$("#" + parentNodeId + " ul").remove() //clear folder when parent is collapsed.
		}
	})


// Functions // 
function addFolderNodes(parentNodeType, parentNodeId)
	{
	var includedProperties = "RecordTitle, RecordRecordType, RecordTypeContentsRule";
	$.ajax(
		{
		url: "/get-record-type-attributes",
		success: function(result)
			{
			var recordTypeDefinitions = result;
			if(parentNodeType=="classification")
				{
				parentNodeUri=parentNodeId.substr(19)
				var url = "/Search?q=classification:" + parentNodeUri + "&properties=" + includedProperties + "&trimtype=Record"
				}
			else{
				if(parentNodeType=="record")
					{
					parentNodeUri=parentNodeId.substr(11)
					var url = "/Search?q=container:" + parentNodeUri + "&properties=" + includedProperties + "&trimtype=Record"
					}
			}
			$.ajax(
				{
				url: url,
				success: function(result)
					{
					for(i=0; i<result.TotalResults; i++)
						{
						for(x=0; x<recordTypeDefinitions.TotalResults; x++)
							{
							if(result.Results[i].RecordRecordType.Uri==recordTypeDefinitions.Results[x].Uri)
								{
								var recordUri = result.Results[i].Uri;
								var recordTitle = result.Results[i].RecordTitle.Value;
								// Do not display any records where the RecordTypeLevel is <4.
								if(recordTypeDefinitions.Results[x].RecordTypeLevel.Value>="4")
									{
									console.log(recordTypeDefinitions.Results[x].RecordTypeContentsRule.Value)
									switch(recordTypeDefinitions.Results[x].RecordTypeContentsRule.Value)
										{
										case "ByLevel":
											if(recordTypeDefinitions.Results[x].RecordTypeLevel.Value>="5")
												{
												addIntermediateFolderNode(parentNodeId, recordUri, recordTitle)
												}
											else
												{
												if(recordTypeDefinitions.Results[x].RecordTypeLevel.Value<"5")
													{
													addTerminalFolderNode(parentNodeId, recordUri, recordTitle)											
													}
												}
											break;
										case "ByLevelInclusive":
											addIntermediateFolderNode(parentNodeId, recordUri, recordTitle)
											break;
										case "ByBehavior":
											addTerminalFolderNode(parentNodeId, recordUri, recordTitle)
											break;
										case "ByList":
											if(recordTypeDefinitions.Results[x].RecordTypeLevel.Value>="4")
												{
												addIntermediateFolderNode(parentNodeId, recordUri, recordTitle)
												}
											break;
										case "Prevented":
											// Do not add node to classification tree.
											break;
										}
									}
								}
							}
						}
					}, 
				error: function(result)
					{
					console.log("Oooops!")
					console.log(result)
					}
				});	

			}, 
		error: function(result)
			{
			console.log("Oooops!")
			console.log(result)
			}
		});	
	}


function addClassificationNode(rootNode, classificationUri, classificationName)
	{
	//	console.log("rootNode: " + rootNode)
	$(rootNode).append("<li id='classification-uri-" + classificationUri + "'><span class='collapsed'></span><span class='folder'></span><span class='classification-name'><a href='#'>" + classificationName + "</a></span></li>")
	}

function addIntermediateFolderNode(parentNodeId, recordUri, recordTitle)
	{
	$("#" + parentNodeId + " > ul").append("<li id='record-uri-" + recordUri + "' class='folder-intermediate'><span class='collapsed'></span></span><span class='folder-green'></span><span class='record-title'><a href='#'>" + recordTitle + "</a></span></li>")
	//$("#" + parentNodeId +" > ul > li").removeClass("classification-hidden")
	sortClassificationTree(".record-title")
	}

function addTerminalFolderNode(parentNodeId, recordUri, recordTitle)
	{
	$("#" + parentNodeId + " > ul").append("<li id='record-uri-" + recordUri + "' class='folder-terminal'><span style='padding: 12px 20px;'></span><span class='folder-fill'></span><span class='record-title'><a href='#'>" + recordTitle + "</a></span></li>")
	sortClassificationTree(".record-title")
	}

		
function sortClassificationTree(sortBy)
	{
	$("ul").each(function(_, ul)
		{
		// get all the nodes to be sorted
		var $toSort = $(ul).children("li");
		$toSort.sort((li1, li2) => $(li1).children(sortBy).text().localeCompare($(li2).children(sortBy).text()));
		$toSort.each(function() 
			{
			$(this).appendTo(ul);
			});
		});
	}

function highlightSelectedClassification(eventTargetParent)
	{
	$("#classification-treeview li").removeClass("classification-node-selected")
	$("#classification-treeview li").removeClass("folder-node-selected")
	$("#" + eventTargetParent.attr("id")).addClass("classification-node-selected")
	}

function highlightSelectedFolder(eventTargetParent)
	{
	$("#classification-treeview li").removeClass("classification-node-selected")
	$("#classification-treeview li").removeClass("folder-node-selected")
	$("#" + eventTargetParent.attr("id")).addClass("folder-node-selected")
	}

function getClassificationProperties(classificationUri)
	{
	$.ajax(
		{
		url: "/get-classification-details?uri=" + classificationUri, 
		success: function(result)
			{
			var details = JSON.stringify(result);
			$("#classificationNameValue").html(details.Results[0].ClassificationName.Value)
			$("#classificationAccessControlValue").html(details.Results[0].ClassificationAccessControl.Value)
			$("#classificationCanAttachRecordsValue").html(details.Results[0].ClassificationCanAttachRecords.Value)
			}, 
		error: function(result)
			{
			console.log("Oooops!")
			console.log(result)
			}
		});
	}