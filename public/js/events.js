$(document).ready(function()
	{
	$('#loading').modal('show')
	preauthenticateApi().then(function()
		{
		
  	   	// populate the #classification-data div
		var url = baseUrl + "/" + apiPath + "/Search?q=all&properties=ClassificationName, ClassificationParentClassification, ClassificationCanAttachRecords, ClassificationChildPattern&trimtype=Classification&pageSize=1000000"
		$.ajax(
			{
			url: url,
			type: "POST",
			xhrFields: { withCredentials: true},
			contentType: 'application/json', 
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
				hideLoadingSpinner()
				}, 
			error: function(result)
				{
				console.log("Oooops!")
				hideLoadingSpinner()
				$('#connection-failed').modal('show')
				}
			});
		})
	});


//////// Handle User-Initiated Events  /////////


//Upload
$(document).on("click", "#upload-button", function()
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			if($("#upload-form-file").prop('files').length > 0)
				{
				$("#upload-status").modal("show")
				file = $("#upload-form-file").prop('files')[0];
				var fileName = uuidv4();
				var extension = getFileExtension($("#upload-form-file").val().substr(12))
				uploadFile(fileName, extension, file).then(function()
					{
					var recordTitle = $("#upload-form-record-title").val()
					var recordType = $("#upload-form-record-type").val()
					var recordContainerUri = $("#upload-form-record-container").data("recordUri")
					var additionalFieldKeys = [];
					var additionalFieldValues = [];
					for(i=0; i<$("#upload-form > .additional-field").length; i++)
						{
						additionalFieldKeys.push($("#upload-form > .additional-field").eq(i).attr("data-search-clause-name"))
						additionalFieldValues.push($("#upload-form > .additional-field").eq(i).children().eq(1).val())
						}
					createRecord(recordTitle, recordType, recordContainerUri, fileName + "." + extension, additionalFieldKeys, additionalFieldValues)
					})
				}
			}
		else
			{
			$("#session-expired").modal("show")
			}
		});
	})

$(document).on("click", "#search-button", function()
	{
	$("#records-list-pane").css("display", "none")
	$("#search-results-pane").css("display", "inline-block")
	populateSearchResultPane()
	})

$(document).on("click", ".search-result-caret-collapsed", function()
	{
		if($(event.target).parent().parent().parent().parent().attr("id")==null)
		{
		alert("this is a sub folder")
		var recordUri = $(event.target).parent().parent().parent().parent().parent().attr("id").substr(18)
		//alert(recordUri)
		}
	var recordUri = $(event.target).parent().parent().parent().parent().attr("id").substr(18)
	//alert("Hello World")

	//alert()
	getAuthenticationStatus().then(function () 
		{
		
		if(isAuthenticated)
			{
			//alert("Hello World")
			//alert(recordUri)
			$("#search-result-uri-" + recordUri + " >td:nth-child(1)>ul>li>span:nth-child(1)").addClass("search-result-caret-expanded")
			$("#search-result-uri-" + recordUri + " >td:nth-child(1)>ul>li>span:nth-child(1)").removeClass("search-result-caret-collapsed")
			
			//var recordUri = $(event.target).parent().parent().parent().parent().attr("id").substr(5)
			var url = baseUrl + "/" + apiPath + "/Search?q=container:" + recordUri + "&properties=RecordNumber,RecordTitle,RecordRecordType,RecordMimeType,RecordExtension&trimtype=Record&pageSize=1000"
			$.ajax(
				{
				url: url,
				type: "POST",
				contentType: 'application/json',
				xhrFields: { withCredentials: true},
				success: function(result)
					{
					console.log(result)
					if(result.TotalResults==0)
						{
						//$("#search-result-uri-" + recordUri + " >td>ul>ul>li").css("color", "grey")
						
							
						$("#search-result-uri-" + recordUri + " >td:nth-child(1)>ul").append('<ul><li style="padding-left:48px;"><span class="file-earmark-grey"></span></li></ul>')
						$("#search-result-uri-" + recordUri + " >td:nth-child(2)>ul").append('<ul><li style="color:grey;">- None</li></ul>')
						$("#search-result-uri-" + recordUri + " >td:nth-child(3)>ul").append('<ul><li style="color:grey;">- No records found.</li></ul>')
						$("#search-result-uri-" + recordUri + " >td:nth-child(4)>ul").append('<ul><li style="color:grey;">- None</li></ul>')
						}
					else
						{
						for(i=0; i<result.TotalResults; i++)
							{
							$("#search-result-uri-" + recordUri + " >td:nth-child(1)>ul>li").last().after("<ul><li><span class='search-result-caret-collapsed'></span><span class='search-result-folder'></span></li></ul>")
							$("#search-result-uri-" + recordUri + " >td:nth-child(2)>ul>li").last().after("<ul><li>- " + result.Results[i].RecordNumber.Value + "</li></ul>")
							$("#search-result-uri-" + recordUri + " >td:nth-child(3)>ul>li").last().after("<ul><li>- " + result.Results[i].RecordTitle.Value + "</li></ul>")
							$("#search-result-uri-" + recordUri + " >td:nth-child(4)>ul>li").last().after("<ul><li>- " + result.Results[i].RecordRecordType.RecordTypeName.Value + "</li></ul>")
							$("#search-result-uri-" + recordUri + " >td:nth-child(5)>ul>li").last().after("<ul style='padding-left:0;'><li><!--Intentionally Blank--></li></ul>")
							}						
						}
					}, 
				error: function(result)
					{
					console.log("Oooops!")
					}
				});
			}
		else
			{
			$("#session-expired").modal("show")
			}
		});
	})

$(document).on("click", ".search-result-caret-expanded", function()
	{
	$(event.target).addClass("search-result-caret-collapsed")
	//$(event.target).addClass("search-result-caret-collapsed").parent()
	$(event.target).removeClass("search-result-caret-expanded")
	alert($(event.target).parent().parent().parent().parent().attr("id"))
	//var myVar = $(event.target).parent().parent().parent().parent().attr("id")
	$("#" + $(event.target).parent().parent().parent().parent().attr("id") + " >td>ul>ul").remove()
	})

function populateSearchResultPane()
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			url = baseUrl + "/" + apiPath + "/RecordType?q=all&properties=RecordTypeLevel, RecordTypeContentsRule, RecordTypeName&pageSize=1000000"
			$.ajax(
				{
				url: url,
				type: "GET",
				contentType: 'application/json',
				xhrFields: { withCredentials: true},
				success: function(recordTypeDefinitions)
					{
					console.log(recordTypeDefinitions)
					var q = "all"
					var url = baseUrl + "/" + apiPath + "/Search?q=" + q + "&properties=RecordNumber,RecordTitle,RecordRecordType,RecordMimeType,RecordExtension&trimtype=Record&pageSize=1000"
					$.ajax(
						{
						url: url,
						type: "POST",
						contentType: 'application/json',
						xhrFields: { withCredentials: true},
						success: function(result)
							{
							console.log(result)
							for(x=0; x<result.TotalResults; x++)
								{
								for(i=0; i<recordTypeDefinitions.TotalResults; i++)
									{
										if(recordTypeDefinitions.Results[i].Uri==result.Results[x].RecordRecordType.Uri)
											{
											if(!config.ExcludedRecordTypes.includes(result.Results[x].RecordRecordType.RecordTypeName.Value))
												{
												switch(recordTypeDefinitions.Results[i].RecordTypeContentsRule.Value)
													{
													case "ByLevel":
														if(recordTypeDefinitions.Results[i].RecordTypeLevel.Value>="5")
															{
															addSearchResult(result.Results[x], "folder-intermediate")
															}
														else
															{
														if(recordTypeDefinitions.Results[i].RecordTypeLevel.Value<"5")
																{
																addSearchResult(result.Results[x], "folder-terminal")		
																}
															}
														break;
													case "ByLevelInclusive":
														addSearchResult(result.Results[x], "folder-intermediate")
														break;
													case "ByBehavior":
														addSearchResult(result.Results[x], "folder-terminal")
														break;
													case "ByList":
														if(recordTypeDefinitions.Results[i].RecordTypeLevel.Value>="4")
															{
																addSearchResult(result.Results[x], "folder-intermediate")
															}
														break;
													case "Prevented":
														addSearchResult(result.Results[x], "document")
														break;
													}	
												}
												
												
											}
											
									}

							}

							//console.log(result)





							}, 
						error: function(result)
							{
							console.log("Oooops!")
							}
						});
					}, 
				error: function(recordTypeDefinitions)
					{
					console.log("Oooops!")
					}
				});
			}
		else
			{
			$("#session-expired").modal("show")
			}
		});	
	}

function addSearchResult(record, type)
	{
	if(type=="document")
		{
		resultRowHTML = '<tr id="search-result-uri-' + record.Uri + '" class="' + type + '" data-record-title="' + record.RecordTitle.Value + '" data-record-extension="' + record.RecordExtension.Value + '" data-record-mime-type="' + record.RecordMimeType.Value + '">'	
		resultRowHTML = resultRowHTML + '<td style="padding-left:50px"><span class="fiv-viv fiv-icon-blank fiv-icon-' + record.RecordExtension.Value.toLowerCase() + '" arial-label="' + record.RecordExtension.Value.toUpperCase() + '"></span></td>'	
		
		}
	else
		{
		resultRowHTML = '<tr id="search-result-uri-' + record.Uri + '" class="' + type + '">'
		resultRowHTML = resultRowHTML + '<td><ul><li><span class="search-result-caret-collapsed"></span><span class="search-result-folder"></span></li></ul></td>'
		}
	resultRowHTML = resultRowHTML + '<td><ul><li>' + record.RecordNumber.Value + '</li></ul></td>'
	resultRowHTML = resultRowHTML + '<td><ul><li>' + record.RecordTitle.Value + '</li></ul></td>'
	resultRowHTML = resultRowHTML + '<td><ul><li>' + record.RecordRecordType.RecordTypeName.Value + '</li></ul></td>'
	if(type=="document")
		{
		resultRowHTML = resultRowHTML + '<td style="text-align:center;"><span class="download-grey"></span></td></tr>'
		}
	else
		{
		resultRowHTML = resultRowHTML + '<td style="text-align:center;"><ul><li><!--Intentionally Blank--></li></ul></td>'	
		}
	
	resultRowHTML = resultRowHTML + '</tr>'
	$("#search-results>tbody").append(resultRowHTML)
	}

$(document).on("click", "#grid", function()
	{
	if (event.target.tagName == 'TH')
		{
      	var th = event.target;			
		if(th.cellIndex!=5)
			{
			var currentState;
			if($(th).hasClass("sorted-down"))
				{
				currentState = "sorted-down"
				}
			sortGrid($(th).attr("id"), th.cellIndex, th.dataset.type, currentState);				
			}
		}
	})



function sortGrid(id, colNum, type, currentState)
	{
	let tbody = grid.querySelector('tbody');
	let rowsArray = Array.from(tbody.rows);

	// compare(a, b) compares two rows, need for sorting
	let compare;
		
	switch (type)
		{
		case 'number':
			compare = function(rowA, rowB)
			{
            return rowA.cells[colNum].innerHTML - rowB.cells[colNum].innerHTML;
			};
			break;
        case 'string':
			compare = function(rowA, rowB)
				{
				return rowA.cells[colNum].innerHTML > rowB.cells[colNum].innerHTML ? 1 : -1;
				};
          	break;
		}

		//Set all columns to unsorted
		for(i=1; i<($("#grid tr > th" ).length); i++)
			{
			$("#grid tr > th:nth-child(" + i + ")").addClass("unsorted")
			$("#grid tr > th:nth-child(" + i + ")").removeClass("sorted-up")
			$("#grid tr > th:nth-child(" + i + ")").removeClass("sorted-down")
			}

		// sort
		rowsArray.sort(compare);
		if(currentState=="sorted-down")
			{
			rowsArray.reverse();
			$("#" + id).addClass("sorted-up")
			$("#" + id).removeClass("unsorted")
			}
		else
			{
			$("#" + id).addClass("sorted-down")
			$("#" + id).removeClass("unsorted")
			}
		
		tbody.append(...rowsArray);
    }

$(document).on("click", "#upload-status-ok-button", function()
	{
	$("#upload-status").modal("hide")
	setTimeout(function()
		{
		$("#upload-progress-bar").removeClass("bg-danger")
		$("#upload-progress-bar").addClass("bg-success")
		$("#upload-progress-bar").css("width", "0%")
		$("#upload-status-ok-button").css("display", "none")
		},
		1000);
	})

$(document).on("click", "#create-folder-ok-button", function()
	{
    $("#create-folder-status").modal("hide")
	setTimeout(function()
		{
		$("#create-folder-caption").html("Creating folder...")
		$("#create-folder-progress-bar").removeClass("bg-danger")
		$("#create-folder-progress-bar").addClass("bg-success")
		$("#create-folder-progress-bar").css("width", "0%")
		$("#create-folder-ok-button").css("display", "none")
		},
		1000);
	})


$(document).on("click", ".record-row", function()
	{
	if($(event.target).prop("nodeName")=="TD")
		{
		//alert("clicked")
		//alert("It's a TD, so we know the parent is the row.")
		var row = $(event.target).parent()
		//alert(row.attr("id"))
		//$("#classification-treeview li").removeClass("node-selected")
		$(".record-row").removeClass("row-selected")
		$(".record-row > td:nth-child(5) > span").addClass("download-grey")
		row.addClass("row-selected")
		$(".record-row > td:nth-child(5) > span").removeClass("download")
		$("#" + row.attr("id") + " > td:nth-child(5) > span").removeClass("download-grey")
		$("#" + row.attr("id") + " > td:nth-child(5) > span").addClass("download")
		drawPropertiesTable("document")
		getRecordProperties("document", row.attr("id").substr(11))
		}
	else
		{
		if($(event.target).prop("nodeName")=="SPAN")
			{
			if($(event.target).hasClass("download"))
				{
				var row = $(event.target).parent().parent()	
				row.addClass("row-selected-green")
				$("#" + row.attr("id") + " > td:nth-child(5) > span").addClass("download-green")
				setTimeout(function()
					{
					row.removeClass("row-selected-green")
					$("#" + row.attr("id") + " > td:nth-child(5) > span").addClass("download")
					$("#" + row.attr("id") + " > td:nth-child(5) > span").removeClass("download-green")
					},
					1000);
				var recordUri = $(event.target).parent().parent().attr("id").substr(11)
				var recordTitle = $(event.target).parent().parent().data("recordTitle")
				var recordMimeType = $(event.target).parent().parent().data("recordMimeType")
				var recordExtension = $(event.target).parent().parent().data("recordExtension")
				downloadDocument(recordUri, recordTitle, recordExtension, recordMimeType)
				}
			else
				{
				var row = $(event.target).parent().parent()
				$("#classification-treeview li").removeClass("node-selected")
				$(".record-row").removeClass("row-selected")
				$(".record-row > td:nth-child(5) > span").addClass("download-grey")
				row.addClass("row-selected")
				$(".record-row > td:nth-child(5) > span").removeClass("download")
				$("#" + row.attr("id") + " > td:nth-child(5) > span").removeClass("download-grey")
				$("#" + row.attr("id") + " > td:nth-child(5) > span").addClass("download")
				drawPropertiesTable("document")
				getRecordProperties("document", row.attr("id").substr(11))
				}
			}
		}
	})

///// Classiciation Control Events /////

// Click on folder Icon //
$(document).on("click", ".folder", function()
	{
	var node = $(event.target).parent();
	hideNewRecordForms()
	classificationTreeNodeSelected(node)
	if(node.hasClass("classification-can-attach-records"))
		{
		populateRecordTypeField("classification", node.attr("id").substr(19))
		$("#new-folder-form-record-type").html("")
		$("#new-folder-form-container").removeClass("new-folder-form-hidden")
		populateAdditionalFields("classification")
		}
	if(node.hasClass("folder-intermediate"))
		{
		//alert(node.attr("id").substr(19))
		populateContainerField("folder-intermediate", node.attr("id").substr(11))
		populateRecordTypeField("folder-intermediate", node.attr("id").substr(11))
		$("#new-sub-folder-form-record-type").html("")
		$("#new-sub-folder-form-container").removeClass("new-sub-folder-form-hidden")
		populateAdditionalFields("folder-intermediate")
		}
	})

// Click on open folder icon //
$(document).on("click", ".folder-open", function()
	{
	var node = $(event.target).parent();
	hideNewRecordForms()
	classificationTreeNodeSelected(node)
	if(node.hasClass("classification-can-attach-records"))
		{
		populateRecordTypeField("classification", node.attr("id").substr(19))
		$("#new-folder-form-record-type").html("")
		$("#new-folder-form-container").removeClass("new-folder-form-hidden")
		populateAdditionalFields("classification")
		}
	if(node.hasClass("folder-intermediate"))
		{
		populateContainerField("folder-intermediate", node.attr("id").substr(11))
		populateRecordTypeField("folder-intermediate", node.attr("id").substr(11))
		$("#new-sub-folder-form-record-type").html("")
		$("#new-sub-folder-form-container").removeClass("new-sub-folder-form-hidden")
		populateAdditionalFields("folder-intermediate")
		}
	})

// Click on Classification Name Hyperlink //
$(document).on("click", ".classification-name>a", function()
	{
	var node = $(event.target).parent().parent();
	hideNewRecordForms()
	classificationTreeNodeSelected(node)
	if(node.hasClass("classification-can-attach-records"))
		{
		populateRecordTypeField("classification", node.attr("id").substr(19))
		$("#new-folder-form-record-type").html("")
		$("#new-folder-form-container").removeClass("new-folder-form-hidden")
		populateAdditionalFields("classification")
		}
	})

// Click on folder-fill Icon //
$(document).on("click", ".folder-fill", function()
	{
	var node = $(event.target).parent();
	hideNewRecordForms()
	highlightSelectedNode(node)
	$("#records-list-pane").css("display", "block")
	if($(node).hasClass("folder-terminal"))
		{
		getRecords(node.attr("id").substr(11))
		populateContainerField("folder-terminal", node.attr("id").substr(11))
		populateRecordTypeField("folder-terminal", node.attr("id").substr(11))
		populateAdditionalFields("folder-terminal")
		$("#new-folder-form-container").removeClass("upload-form-hidden")
		drawPropertiesTable("folder-terminal")
		getRecordProperties("folder-terminal", node.attr("id").substr(11))
		}
	})

$(document).on("click", ".record-title>a", function()
	{
	var node = $(event.target).parent().parent();
	hideNewRecordForms()
	highlightSelectedNode(node)
	$(".record-row").removeClass("row-selected")
	$(".record-row > td:nth-child(5) > span").addClass("download-grey")
	$(".record-row > td:nth-child(5) > span").removeClass("download")
	
	if($(node).hasClass("folder-intermediate"))
		{
		$("#records-list-pane").html("<div class='no-records'>Select a bottom-level folder to display records.</div>")
		populateContainerField("folder-intermediate", node.attr("id").substr(11))
		populateRecordTypeField("folder-intermediate", node.attr("id").substr(11))
		drawPropertiesTable("folder-intermediate")
		getRecordProperties("folder-intermediate", node.attr("id").substr(11))
		$("#new-sub-folder-form-record-type").html("")
		$("#new-sub-folder-form-container").removeClass("new-sub-folder-form-hidden")
		populateAdditionalFields("folder-intermediate")
		}
	else
		{
		if($(node).hasClass("folder-terminal"))
			{
			//$("#records-list-pane").css("display", "block")
			getRecords(node.attr("id").substr(11))
			populateContainerField("folder-terminal", node.attr("id").substr(11))
			populateRecordTypeField("folder-terminal", node.attr("id").substr(11))
			populateAdditionalFields("folder-terminal")
			$("#upload-form-container").removeClass("upload-form-hidden")
			drawPropertiesTable("folder-terminal")
			getRecordProperties("folder-terminal", node.attr("id").substr(11))
			}
		}
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

// File input
$(document).on("change", "#upload-form-file", function()
	{
	var fileName = $("#upload-form-file").val().substr(12)
	$("#upload-form-file-label").html(fileName)
	var extension = getFileExtension($("#upload-form-file").val().substr(12))
	var recordTitle = fileName.substr(0, fileName.length - (extension.length + 1))
	$("#upload-form-record-title").val(recordTitle)
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

// Create Folder
$(document).on("click", "#create-folder-button", function()
	{
	if($("#new-folder-form-record-title").val().length)
		{
		$("#create-folder-status").modal("show")
		recordTitle = $("#new-folder-form-record-title").val()
		recordClassificationUri = $("#new-folder-form-record-classification").data("classificationUri")
		var recordContainerUri;
		recordType = $("#new-folder-form-record-type").val()
		var additionalFieldKeys = [];
		var additionalFieldValues = [];
		for(i=0; i<$("#new-folder-form > .additional-field").length; i++)
			{
			additionalFieldKeys.push($("#new-folder-form > .additional-field").eq(i).attr("data-search-clause-name"))
			additionalFieldValues.push($("#new-folder-form > .additional-field").eq(i).children().eq(1).val())
			}
		createFolder(recordTitle, recordClassificationUri, recordContainerUri, recordType, additionalFieldKeys, additionalFieldValues)
		}
	else
		{
		$("#create-folder-status").modal("show")
		recordTitle = $("#new-sub-folder-form-record-title").val()
		var recordClassificationUri;
		recordContainerUri = $("#new-sub-folder-form-record-container").data("recordUri")
		recordType = $("#new-sub-folder-form-record-type").val()
		var additionalFieldKeys = [];
		var additionalFieldValues = [];
		for(i=0; i<$("#new-sub-folder-form > .additional-field").length; i++)
			{
			additionalFieldKeys.push($("#new-sub-folder-form > .additional-field").eq(i).attr("data-search-clause-name"))
			additionalFieldValues.push($("#new-sub-folder-form > .additional-field").eq(i).children().eq(1).val())
			}
		createFolder(recordTitle, recordClassificationUri, recordContainerUri, recordType, additionalFieldKeys, additionalFieldValues)
		}
	})





$(document).on("change", "#new-folder-form-record-type", function()
	{
	populateAdditionalFields("classification")
	})

$(document).on("change", "#new-sub-folder-form-record-type", function()
	{
	populateAdditionalFields("folder-intermediate")
	})

// Click re-athentication button
$(document).on("click", "#test-button", function()
	{
	populateAdditionalFields("folder-terminal")
	})



// Click re-athentication button
$(document).on("click", "#reauthenticate-button", function()
	{
	removeAPISessionCookies();
	$(location).attr("href","/logout");
	})

// Click logout link
$(document).on("click", "#logout", function()
	{
	removeAPISessionCookies();
	$(location).attr("href", "/logout");
	})

$(window).on("beforeunload", function()
	{
    removeAPISessionCookies();  // belt and braces
	})

/// To do
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
