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
	highlightSelectedNode(eventTargetParent)
	if((eventTargetParent).attr("id").substr(0, 19) == "classification-uri-")
		{
		drawPropertiesTable("classification")
		var classificationUri = eventTargetParent.attr("id").substr(19)
		getClassificationProperties(classificationUri)
		}
	else
		{
		if((eventTargetParent).attr("id").substr(0, 11) == "record-uri-")
			{
			if($(eventTargetParent).hasClass("folder-intermediate"))
				{
				drawPropertiesTable("folder-intermediate")
				getRecordProperties("folder-intermediate", eventTargetParent.attr("id").substr(11))	
				}
			}
		}
	})

$(document).on("click", ".folder-open", function()
	{
	var eventTargetParent = $(event.target).parent();
	highlightSelectedNode(eventTargetParent)
	if((eventTargetParent).attr("id").substr(0, 19) == "classification-uri-")
		{
		drawPropertiesTable("classification")
		var classificationUri = eventTargetParent.attr("id").substr(19)
		getClassificationProperties(classificationUri)
		}
	else
		{
		if((eventTargetParent).attr("id").substr(0, 11) == "record-uri-")
			{
			if($(eventTargetParent).hasClass("folder-intermediate"))
				{
				drawPropertiesTable("folder-intermediate")
				getRecordProperties("folder-intermediate", eventTargetParent.attr("id").substr(11))	
				}
			}
		}
	})

// Click on Classification Name Hyperlink //
$(document).on("click", ".classification-name>a", function()
	{
	var eventTargetParent = $(event.target).parent().parent();
	highlightSelectedNode(eventTargetParent)
	if((eventTargetParent).attr("id").substr(0, 19) == "classification-uri-")
		{
		drawPropertiesTable("classification")
		var classificationUri = eventTargetParent.attr("id").substr(19)
		getClassificationProperties(classificationUri)
		}
	else
		{
		if((eventTargetParent).attr("id").substr(0, 11) == "record-uri-")
			{
			if($(eventTargetParent).hasClass("folder-intermediate"))
				{
				drawPropertiesTable("folder-intermediate")
				getRecordProperties("folder-intermediate", eventTargetParent.attr("id").substr(11))	
				}
			}
		}
	})

// Click on folder-fill Icon //
$(document).on("click", ".folder-fill", function()
	{
	alert("Clicked")
	var eventTargetParent = $(event.target).parent();
	highlightSelectedNode(eventTargetParent)
	if($(eventTargetParent).hasClass("folder-terminal"))
		{
		drawPropertiesTable("folder-terminal")
		getRecordProperties("folder-terminal", eventTargetParent.attr("id").substr(11))		
		}
	})
$(document).on("click", ".record-title>a", function()
	{
	var eventTargetParent = $(event.target).parent().parent();
	highlightSelectedNode(eventTargetParent)
	if($(eventTargetParent).hasClass("folder-terminal"))
		{
		drawPropertiesTable("folder-terminal")
		//alert(eventTargetParent.attr("id").substr(11))
		getRecordProperties("folder-terminal", eventTargetParent.attr("id").substr(11))		
		}
	})




$(document).on("click", ".star", function()
	{
	alert("Why have you clicked on this?  THis functionality has not been written yet.  Moron.")
	})

$(document).on("click", ".favourites>a", function()
	{
	alert("Are you taking the piss?")
	})

$(document).on("click", ".clock-history", function()
	{
	alert("Have you been sent to vex me?")
	})

$(document).on("click", ".recents>a", function()
	{
	alert("Give me strength!")
	})





// Click on collpased caret
$(document).on("click", ".collapsed", function()
	{
	var parentNodeId = $(event.target).parent().attr("id");
	
	if(parentNodeId=="all-files")
		{
		$("#all-files ul").removeClass("classification-hidden")
		$("#" + parentNodeId + " > span.collapsed").addClass("expanded")
		$("#" + parentNodeId + " > span.collapsed").removeClass("collapsed")
		$("#" + parentNodeId + " > span.folder").addClass("folder-open")
		$("#" + parentNodeId + " > span.folder").removeClass("folder")
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



function highlightSelectedNode(eventTargetParent)
	{
	$("#classification-treeview li").removeClass("node-selected")
	$("#classification-treeview li").removeClass("node-selected")
	$("#" + eventTargetParent.attr("id")).addClass("node-selected")
	}

function getRecords(recordUri)
	{
		
	}



function getClassificationProperties(classificationUri)
	{
	//alert(classificationUri)
	var url = "/Search?q=" + classificationUri + "&properties=ClassificationName, ClassificationTitle, ClassificationIdNumber, AccessControl&trimtype=Classification"
	$.ajax(
		{
		url: url,
		success: function(result)
			{
			var details = JSON.stringify(result);
			console.log(details)
			$("#properties-classification-title").html(result.Results[0].ClassificationTitle.Value)
			$("#properties-classification-number").html(result.Results[0].ClassificationIdNumber.Value)
			$("#properties-classification-access-control").html(result.Results[0].ClassificationAccessControl.Value)

			}, 
		error: function(result)
			{
			console.log("Oooops!")
			console.log(result)
			}
		});
	}

function getRecordProperties(type, recordUri)
	{
	var url = "/Search?q=" + uri + "&properties=RecordTitle, RecordNumber, Classification, RecordContainer, RecordType, DateRegistered, AccessControl, RetentionSchedule&trimtype=Record"
	$.ajax(
		{
		url: url, 
		success: function(result)
			{
			var details = JSON.stringify(result);
				console.log(details)
				switch(type)
					{
					case "folder-intermediate":
						$("#properties-record-number").html(result.Results[0].RecordNumber.Value)
						$("#properties-classification").html(result.Results[0].RecordClassification.ClassificationTitle.Value)
						$("#properties-record-type").html(result.Results[0].RecordRecordType.RecordTypeName.Value)
						$("#properties-date-registered").html(result.Results[0].RecordDateRegistered.DateTime)
						$("#properties-access-control").html(result.Results[0].RecordAccessControl.Value)
						$("#properties-retention-schedule").html(result.Results[0].RecordRetentionSchedule.Uri)
							
						

						break;
					case "folder-terminal":
						$("#properties-record-number").html(result.Results[0].RecordNumber.Value)
						$("#properties-container").html(result.Results[0].RecordContainer.RecordNumber.Value + ": " + result.Results[0].RecordContainer.RecordTitle.Value)
						$("#properties-record-type").html(result.Results[0].RecordRecordType.RecordTypeName.Value)
						$("#properties-date-registered").html(result.Results[0].RecordDateRegistered.DateTime)
						$("#properties-access-control").html(result.Results[0].RecordAccessControl.Value)
						break;
					case "document":

						break;
					}
			}, 
		error: function(result)
			{
			console.log("Oooops!")
			console.log(result)
			}
		});
	}

function drawPropertiesTable(type)
	{
	switch(type)
		{
		case "classification":
			var tableHTML = '<table class="table table-dark table-sm" style="position:absolute;bottom:0;margin-bottom:0;"><tbody><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Number</td><td id="properties-classification-number" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Classification Title</td><td id="properties-classification-title" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Access Control</td><td id="properties-classification-access-control" style="text-align:left;"></td></tr></tbody></table>'
			break;
		case "folder-intermediate":
			var tableHTML = '<table class="table table-dark table-sm" style="position:absolute;bottom:0;margin-bottom:0;"><tbody><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Record Number</td><td id="properties-record-number" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Classification</td><td id="properties-classification" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Record Type</td><td id="properties-record-type" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Date Registered</td><td id="properties-date-registered" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Access Control</td><td id="properties-access-control" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Retention Schedule</td><td id="properties-retention-schedule" style="text-align:left;"></td></tr><tr><td scope="row" style="width:20%;text-align:left;padding-left:30px;">Date Due for Destruction</td><td id="properties-date-due-for-destruction" style="text-align:left;"></td></tr><tr></tbody></table>'
			break;
		case "folder-terminal":
			var tableHTML = '<table class="table table-dark table-sm" style="position:absolute;bottom:0;margin-bottom:0;"><tbody><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Record Number</td><td id="properties-record-number" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Container</td><td id="properties-container" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Record Type</td><td id="properties-record-type" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Date Registered</td><td id="properties-date-registered" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Access Control</td><td id="properties-access-control" style="text-align:left;"></td></tr></tbody></table>'
			break;
		case "document":
			var tableHTML = '<table class="table table-dark table-sm" style="position:absolute;bottom:0;margin-bottom:0;"><tbody><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Record Number</td><td id="properties-record-number" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Container</td><td id="properties-container" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Record Type</td><td id="properties-record-type" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Date Registered</td><td id="properties-date-registered" style="text-align:left;"></td></tr><tr><td scope="row" style="width:25%;text-align:left;padding-left:30px;">Access Control</td><td id="properties-access-control" style="text-align:left;"></td></tr></tbody></table>'
			break;
		}
	$("#properties-pane > table").remove()
	$("#properties-pane").append(tableHTML)
	}



