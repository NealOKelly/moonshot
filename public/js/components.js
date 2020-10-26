$(document).ready(function()
	{
	// populate the #classification-data div
	var url = url = "/Search?q=all&properties=ClassificationName, ClassificationParentClassification, ClassificationCanAttachRecords, ClassificationChildPattern&trimtype=Classification"
	$.ajax(
		{
		url: url,
		success: function(result)
		{
		var classifications = result;
		for(var i=0; i<classifications.TotalResults; i++)  // populate top level classifications.
			{
			if(!classifications.Results[i].hasOwnProperty("ClassificationParentClassification"))
				{
				if(!$("#classification-uri-" + classifications.Results[i].Uri).length)
					{
					addClassificationNode("#all-files > ul", classifications.Results[i].Uri, classifications.Results[i].ClassificationName.Value, classifications.Results[i].ClassificationCanAttachRecords.Value, classifications.Results[i].ClassificationChildPattern.Value)
					}
					$("#all-files > ul").addClass("classification-hidden")
				}
			}	
			// sort	 this list.
			sortClassificationTree(".classification-name")
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

$(document).on("click", ".star", function()
	{
	//alert("Clicked.")
	var eventTargetParent = $(event.target).parent();
	$("#classification-treeview li").removeClass("classification-node-selected")
	$("#classification-treeview li").removeClass("folder-node-selected")
	$("#" + eventTargetParent.attr("id")).addClass("classification-node-selected")
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
	
	if(parentNodeId=="all-files")
		{
		alert("Clicked on classification-hidden")
		$("#all-files ul").removeClass("classification-hidden")
		}
	else
		{
		$("#" + parentNodeId + " > span.collapsed").addClass("expanded")
		$("#" + parentNodeId + " > span.collapsed").removeClass("collapsed")
		$("#" + parentNodeId + " > span.folder").addClass("folder-open")
		$("#" + parentNodeId + " > span.folder").removeClass("folder")

		$("#" + parentNodeId).find(".expanded").each(function()
			{
			if($(this).parent().hasClass("classification-can-have-children"))
				{
				refreshClassificationNodes($(this).parent().attr("id"))
				}
			if($(this).parent().hasClass("classification-can-attach-records"))
				{
				refreshFolderNodes("classification", $(this).parent().attr("id"))
				}
			if($(this).parent().hasClass("folder-intermediate"))
				{
				refreshFolderNodes("record", $(this).parent().attr("id"))
				}
			});
		}
	})

// Click on expanded caret
$(document).on("click", ".expanded", function()
	{
	var parentNodeId = $(event.target).parent().attr("id");
	$("#" + parentNodeId + " > ul").addClass("classification-hidden")
	$("#" + parentNodeId + " > span.expanded").addClass("collapsed")
	$("#" + parentNodeId + " > span.expanded").removeClass("expanded")
	$("#" + parentNodeId + " > span.folder-open").addClass("folder")
	$("#" + parentNodeId + " > span.folder-open").removeClass("folder-open")
	})

// Functions // 

function refreshClassificationNodes(parentNodeId) 
	{
	$("#" + parentNodeId + " > ul").addClass("classification-hidden") // if already exists, hide.
		
	// check for new classifications.
	var q="parent:" + parentNodeId.substr(19);
	$.ajax(
	{
	url: "/Search?q=" + q + "&properties=ClassificationName, ClassificationParentClassification, ClassificationCanAttachRecords, ClassificationChildPattern&trimtype=Classification",
	success: function(result)
		{
		if(!$("#" + parentNodeId + " > ul").length)
			{
			if(result.TotalResults>0)
				{
				$("#" + parentNodeId).append("<ul style='list-style-type:none;'></ul>")
				}
			}
		for(i=0; i<result.TotalResults; i++)  // for each classification returned in the search result
			{
			if(!$("#classification-uri-" + result.Results[i].Uri).length)
				{
				addClassificationNode("#" + parentNodeId + " > ul", result.Results[i].Uri, result.Results[i].ClassificationName.Value, result.Results[i].ClassificationCanAttachRecords.Value, result.Results[i].ClassificationChildPattern.Value)
				}
			}
		for(i=0; i<$("#" + parentNodeId + " > ul > li").length; i++)  // for each <li>
			{
			var nodeExistsInSearchResults = false;
			for (x=0; x<result.TotalResults; x++)
				{
				if($("#" + parentNodeId + " > ul > li:nth-child(" + (i + 1) + ")").attr("id").substr(19)==result.Results[x].Uri)
					{
					nodeExistsInSearchResults = true;
					}
				}
				if(!nodeExistsInSearchResults)
					{
					$("#" + parentNodeId + " > ul > li:nth-child(" + (i + 1) + ")").addClass("for-deletion")
					}
				$(".for-deletion").remove() // remove the <li> once the for loop has completed.
			}
		$("#" + parentNodeId + " > ul").removeClass("classification-hidden")
		$("#" + parentNodeId).parents("ul").removeClass("classification-hidden")
		sortClassificationTree(".classification-name")
		}, 
	error: function(result)
		{
		console.log("Oooops!")
		}
	});
	}

function addClassificationNode(rootNode, classificationUri, classificationName, canAttachRecords, classificationChildPattern)
	{
	$(rootNode).append("<li id='classification-uri-" + classificationUri + "'><span class='collapsed'></span><span class='folder'></span><span class='classification-name'><a>" + classificationName + "</a></span></li>")
	if(canAttachRecords)								
		{
		$("#classification-uri-" + classificationUri).addClass("classification-can-attach-records")		
		}
	if(classificationChildPattern!="")
		{
		$("#classification-uri-" + classificationUri).addClass("classification-can-have-children")		
		}
	}

function refreshFolderNodes(parentNodeType, parentNodeId)
	{
	$("#" + parentNodeId + " > ul").addClass("classification-hidden") // if already exists, hide.
	
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
					if(!$("#" + parentNodeId + " > ul").length)
						{
						if(result.TotalResults>0)
							{
							$("#" + parentNodeId).append("<ul style='list-style-type:none;' class='classification-hidden'></ul>") // create hidden
							}
						}
					for(i=0; i<result.TotalResults; i++)  
						{
						if(!$("#record-uri-" + result.Results[i].Uri).length)  // for each search result, check whether the <li> exists and, if not, create it.
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
						}
					for(i=0; i<$("#" + parentNodeId + " > ul > li").length; i++)  // for each <li>
						{
						var nodeExistsInSearchResults = false;
						for(x=0; x<result.TotalResults; x++)
							{
							if($("#" + parentNodeId + " > ul > li:nth-child(" + (i + 1) + ")").attr("id").substr(11)==result.Results[x].Uri)
								{
								nodeExistsInSearchResults = true;
								}
							}
							if(!nodeExistsInSearchResults)
								{
								$("#" + parentNodeId + " > ul > li:nth-child(" + (i + 1) + ")").addClass("for-deletion")
								}
							$(".for-deletion").remove() // remove the <li> once the for loop has completed.
						}
						sortClassificationTree(".record-title")
						$("#" + parentNodeId + " > ul").removeClass("classification-hidden")
						$("#" + parentNodeId).parents("ul").removeClass("classification-hidden")
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

function addIntermediateFolderNode(parentNodeId, recordUri, recordTitle)
	{
	$("#" + parentNodeId + " > ul").append("<li id='record-uri-" + recordUri + "' class='folder-intermediate'><span class='collapsed'></span></span><span class='folder'></span><span class='record-title'><a>" + recordTitle + "</a></span></li>")
	}

function addTerminalFolderNode(parentNodeId, recordUri, recordTitle)
	{
	$("#" + parentNodeId + " > ul").append("<li id='record-uri-" + recordUri + "' class='folder-terminal'><span style='padding: 12px 20px;'></span><span class='folder-fill'></span><span class='record-title'><a>" + recordTitle + "</a></span></li>")
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