var hasPreAuthenticated = false;
var isAuthenticated = false;

$(document).ready(function()
	{
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
				}, 
			error: function(result)
				{
				console.log("Oooops!")
				}
			});
		})
	});


//////// Handle User-Initiated Events  /////////


// Read File //
$(document).on("click", "#upload-button", function()
	{
    formData = new FormData();
    if($("#upload-form-file").prop('files').length > 0)
		{
		$("#upload-status").modal("show")
		file = $("#upload-form-file").prop('files')[0];
		var fileName = uuidv4();
		console.log(fileName);
		var extension = getFileExtension($("#upload-form-file").val().substr(12))
		uploadFile(fileName, extension, file).then(function()
			{
			var recordTitle = $("#upload-form-record-title").val()
			var recordType = $("#upload-form-record-type").val()
			var recordContainerUri = $("#upload-form-record-container").data("recordUri")
			createRecord(recordTitle, recordType, recordContainerUri, fileName + "." + extension)
			})
		}
	})




$(document).on("click", "#upload-status-ok-button", function()
	{
    $("#upload-status").modal("hide")

	})



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
		$("#upload-form-container").addClass("upload-form-hidden")
		clearUploadForm()
	})


// Click on folder-fill Icon //
$(document).on("click", ".folder-fill", function()
	{
	var eventTargetParent = $(event.target).parent();
	highlightSelectedNode(eventTargetParent)
	if($(eventTargetParent).hasClass("folder-terminal"))
		{
		drawPropertiesTable("folder-terminal")
		getRecordProperties("folder-terminal", eventTargetParent.attr("id").substr(11))
		getRecords(eventTargetParent.attr("id").substr(11))
		}
	clearUploadForm()
	$("#upload-form-container").removeClass("upload-form-hidden")
	})


$(document).on("click", ".record-title>a", function()
	{
	var eventTargetParent = $(event.target).parent().parent();
	highlightSelectedNode(eventTargetParent)
	if((eventTargetParent).attr("id").substr(0, 19) == "classification-uri-")
		{
		drawPropertiesTable("classification")
		var classificationUri = eventTargetParent.attr("id").substr(19)
		getClassificationProperties(classificationUri)
		$("#upload-form-container").addClass("upload-form-hidden")
		clearUploadForm()
		}
	else
		{
		if((eventTargetParent).attr("id").substr(0, 11) == "record-uri-")
			{
			if($(eventTargetParent).hasClass("folder-intermediate"))
				{
				drawPropertiesTable("folder-intermediate")
				getRecordProperties("folder-intermediate", eventTargetParent.attr("id").substr(11))	
				$("#upload-form-container").addClass("upload-form-hidden")
				clearUploadForm()
				}
			else
				{
				if($(eventTargetParent).hasClass("folder-terminal"))
					{
					drawPropertiesTable("folder-terminal")
					getRecordProperties("folder-terminal", eventTargetParent.attr("id").substr(11))
					getRecords(eventTargetParent.attr("id").substr(11))
					$("#upload-form-container").removeClass("upload-form-hidden")
					}
				}
			}
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

// Temporary link for testing session expiry modal.
$(document).on("click", ".download", function()
	{
	var recordUri = $(event.target).parent().parent().attr("id").substr(11)
	var recordTitle = $(event.target).parent().parent().data("recordTitle")
	var recordMimeType = $(event.target).parent().parent().data("recordMimeType")
	var recordExtension = $(event.target).parent().parent().data("recordExtension")
	downloadDocument(recordUri, recordTitle, recordExtension, recordMimeType)
	})

function downloadDocument(recordUri, recordTitle, recordExtension, recordMimeType)
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			var url = baseUrl + "/" + apiPath + "/Record/" + recordUri + "/File/Document"
			$.ajax(
				{
				url: url,
				xhrFields: { responseType: 'arraybuffer'},
				success: function(result)
					{
					var url = window.URL.createObjectURL(new File([result], "download." + recordExtension, {type: recordMimeType}));
					var anchorElem = document.createElement("a");
					anchorElem.style = "display: none";
					anchorElem.href = url;
					anchorElem.download = recordTitle + "." + recordExtension.toLowerCase();
					document.body.appendChild(anchorElem);
					anchorElem.click();
					document.body.removeChild(anchorElem);
					window.URL.revokeObjectURL(url)
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
	}

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


// Functions // 
function preauthenticateApi()
	{
	// Session cookies need to be estabilished before making any AJAX calls to the API server.  This is because the first HTTP200 response
	// (i.e what is returned by the ajax call) is actually a page served by ADFS server that uses JavaScript to POST the SAML assertion 
	// to the API server.  As a workaround, we load a resource from the API server into an IFRAME instead.

	return $.Deferred(function(d)
	{
	if(hasPreAuthenticated)
		{
		d.resolve();
		return;
		}
		var iFrame = $("<iframe id='authentication-frame' sandbox='allow-scripts allow-forms allow-same-origin'></iframe>");
		iFrame.hide();
		iFrame.appendTo("body");
		iFrame.attr('src', baseUrl + "/" + apiPath + "/help/index");
		iFrame.on('load', function () 
			{
			if($("#authentication-frame").contents().find("title").html()=="Content Manager - ServiceAPI Help Index")
				{
				hasPreAuthenticated = true;
				iFrame.remove();
				d.resolve();					
				}
			});
		});
	};

function getAuthenticationStatus()
	{
	var deferredObject = $.Deferred();
	$.ajax(
		{
		url: "/authentication-status",
		success: function(result)
			{
			if(result==true)
				{
				isAuthenticated=true;
				}
			else
				{
				isAuthenticated=false;
				}
			deferredObject.resolve();		
			}, 
		error: function(result)
			{
			deferredObject.resolve();		
			console.log("Oooops!")
			}
		});
		return deferredObject.promise();
	}

function refreshClassificationNodes(parentNodeId) 
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			$("#" + parentNodeId + " > ul").addClass("classification-hidden") // if already exists, hide.

			// check for new classifications.
			preauthenticateApi().then(function()
				{
				var q="parent:" + parentNodeId.substr(19);
				$.ajax(
					{
					url: baseUrl + "/" + apiPath + "/Search?q=" + q + "&properties=ClassificationName, ClassificationParentClassification, ClassificationCanAttachRecords, ClassificationChildPattern&trimtype=Classification&pageSize=1000000",
					type: "POST",
					contentType: 'application/json',
					xhrFields: { withCredentials: true},
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
				});
			}
		else
			{
			$("#session-expired").modal("show")
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
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			$("#" + parentNodeId + " > ul").addClass("classification-hidden") // if already exists, hide.
	
			var includedProperties = "RecordTitle, RecordRecordType, RecordTypeContentsRule, RecordContainer";
			$.ajax(
				{
				url: baseUrl + "/" + apiPath + "/RecordType?q=all&properties=RecordTypeLevel, RecordTypeContentsRule, RecordTypeName&pageSize=1000000",
				type: "GET",
				contentType: 'application/json',
				xhrFields: { withCredentials: true},
				success: function(result)
					{
					var recordTypeDefinitions = result;
					if(parentNodeType=="classification")
						{
						parentNodeUri=parentNodeId.substr(19)
						var url = baseUrl + "/" + apiPath + "/Search?q=classification:" + parentNodeUri + "&properties=" + includedProperties + "&trimtype=Record"
						}
					else{
						if(parentNodeType=="record")
							{
							parentNodeUri=parentNodeId.substr(11)
							var url = baseUrl + "/" + apiPath + "/Search?q=container:" + parentNodeUri + "&properties=" + includedProperties + "&trimtype=Record"
							}
						}
					$.ajax(
						{
						url: url,
						type: "POST",
						contentType: 'application/json',
						xhrFields: { withCredentials: true},
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
																addTerminalFolderNode(parentNodeId, recordUri, recordTitle);		
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
							}
						});	
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
	$(".record-row").removeClass("row-selected")
	$("#classification-treeview li").removeClass("node-selected")
	$("#" + eventTargetParent.attr("id")).addClass("node-selected")
	}

function getRecords(recordUri)
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			var url = baseUrl + "/" + apiPath + "/Search?q=container:" + recordUri + "&properties=RecordTitle, RecordNumber, DateRegistered, RecordMimeType, RecordExtension&trimtype=Record&pageSize=1000000"
			$.ajax(
				{
				url: url,
				type: "POST",
				contentType: 'application/json',
				xhrFields: { withCredentials: true},
				success: function(result)
					{
					console.log(result)
					var details = JSON.stringify(result);
					if(result.TotalResults=="0")
						{
						$("#records-list-pane").html("The selected folder does not contain any records.")		
						}
					else
						{
						var tableHTML = '<table class="table table-sm"><th>Type</th><th>Record Number</th><th style="text-align:left;">Title</th><th>Date Registered</th><th>Download</th>'
						for(i=0; i<result.TotalResults; i++)
							{
							tableHTML = tableHTML + '<tr id="record-uri-' + result.Results[i].Uri + '" class="record-row" data-record-title="' + result.Results[i].RecordTitle.Value + '" data-record-extension="' + result.Results[i].RecordExtension.Value + '" data-record-mime-type="' + result.Results[i].RecordMimeType.Value + '">'
							//tableHTML = tableHTML + '<td><span class="file-earmark"></span></td>'
							tableHTML = tableHTML + '<td>' + result.Results[i].RecordExtension.Value + '</td>'
							tableHTML = tableHTML + '<td>' + result.Results[i].RecordNumber.Value + '</td>'
							tableHTML = tableHTML + '<td style="text-align:left;">' + result.Results[i].RecordTitle.Value + '</td>'
							tableHTML = tableHTML + '<td>' + result.Results[i].RecordDateRegistered.DateTime.substr(8, 2) + '/' + result.Results[i].RecordDateRegistered.DateTime.substr(5, 2) + '/' + result.Results[i].RecordDateRegistered.DateTime.substr(0, 4) + '</td>'
							tableHTML = tableHTML + '<td><span class="download"></span></td></tr>'
							}
						tableHTML = tableHTML + '</table'>

						$("#records-list-pane").html(tableHTML)
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
	}

function getClassificationProperties(classificationUri)
	{
	var url = baseUrl + "/" + apiPath + "/Search?q=" + classificationUri + "&properties=ClassificationName, ClassificationTitle, ClassificationIdNumber, AccessControl&trimtype=Classification"
	$.ajax(
		{
		url: url,
		type: "POST",
		xhrFields: { withCredentials: true},
		contentType: 'application/json',
		success: function(result)
			{
			var details = JSON.stringify(result);
			$("#properties-classification-title").html(result.Results[0].ClassificationTitle.Value)
			$("#properties-classification-number").html(result.Results[0].ClassificationIdNumber.Value)
			$("#properties-classification-access-control").html(result.Results[0].ClassificationAccessControl.Value)

			}, 
		error: function(result)
			{
			console.log("Oooops!")
			}
		});
	}

function getRecordProperties(type, recordUri)
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			var url = baseUrl + "/" + apiPath + "/Search?q=" + recordUri + "&properties=RecordTitle, RecordNumber, Classification, RecordContainer, RecordType, DateRegistered, AccessControl, RetentionSchedule&trimtype=Record"
			$.ajax(
				{
				url: url, 
				type: "POST",
				contentType: 'application/json',
				xhrFields: { withCredentials: true},
				success: function(result)
					{
					var details = JSON.stringify(result);
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
							//$("#properties-access-control").html(result.Results[0].RecordAccessControl.Value)
							
							// Upload form.
							clearUploadForm()
							$("#upload-form-record-container").val(result.Results[0].RecordContainer.RecordNumber.Value + ": " + result.Results[0].RecordContainer.RecordTitle.Value)
							$("#upload-form-record-container").data("recordUri", result.Results[0].Uri)
							break;
						case "document":
							$("#properties-record-number").html(result.Results[0].RecordNumber.Value)
							$("#properties-container").html(result.Results[0].RecordContainer.RecordNumber.Value + ": " + result.Results[0].RecordContainer.RecordTitle.Value)
							$("#properties-record-type").html(result.Results[0].RecordRecordType.RecordTypeName.Value)
							$("#properties-date-registered").html(result.Results[0].RecordDateRegistered.DateTime)
							$("#properties-access-control").html(result.Results[0].RecordAccessControl.Value)
							break;
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

function removeAppSessionCookies()
	{
	//$.cookie("FedAuth", null, { expires: -1, path: "/CMServiceAPI/"} )
	//$.cookie("FedAuth", null, { expires: -1, path: "/CMServiceAPI/"} )
	//alert("Hellow Wotlf")
	}

function removeAPISessionCookies()
	{
	$.cookie("FedAuth", null, { expires: -1, path: "/CMServiceAPI/"} )
	$.cookie("FedAuth", null, { expires: -1, path: "/CMServiceAPI/"} )
	}

function uploadFile(fileName, extension, file)
	{
	var deferredObject = $.Deferred();
	jQuery.ajax(
		{
		url: "https://api.gilbyim.com/WebDAV/Uploads/" + fileName + "." + extension,
		type: "PUT",
		data: file,
		processData: false,
		//contentType: false,
		contentType: "multipart/form-data",
		headers: { Authorization : "Basic bmVhbC5va2VsbHlAZ2lsYnlpbS5jb206Q3JhNTYwNTYh" },
		success: function (result) 
			{
			console.log("This should happen first.")
			deferredObject.resolve();
			console.log("Success")
			},
		error: function(result) 
			{
			console.log("Error")
			deferredObject.resolve();
			}
		});
	return deferredObject.promise();
	}

function createRecord(recordTitle, recordType, recordContainerUri, fileName)
	{
	var deferredObject = $.Deferred();
	var url = baseUrl + "/" + apiPath + "/Record"
	var data = {
				"RecordTitle" : recordTitle,
				"RecordRecordType" : recordType,
				"RecordContainer" : recordContainerUri
				}

	$.ajax(
		{
		url: url,
		data: JSON.stringify(data),
		type: "POST",
		contentType: 'application/json',
		xhrFields: { withCredentials: true},
		success: function(result)
			{
			console.log("Record succesfully created.")
				//console.log(i)
			attachFileToRecord(result.Results[0].Uri, fileName, recordContainerUri)
			//deferredObject.resolve(result.Results[0].Uri)
			//deferredObject.resolveWith(context, ["Can rocks!"])

			}, 
		error: function(result)
			{
			console.log("Oooops!")
			}
		});
		deferredObject.promise()
	}

function attachFileToRecord(recordUri, fileName, recordContainerUri)
	{
	console.log("recordUri: " + recordUri)
	console.log("fileName: " + fileName)
	var data = {
				"Uri": recordUri,
				"RecordFilePath": fileName
				}
	var url = baseUrl + "/" + apiPath + "/Record"
	$.ajax(
		{
		url: url,
		data: JSON.stringify(data),
		type: "POST",
		contentType: 'application/json',
		xhrFields: { withCredentials: true},
		success: function(result)
			{
			console.log("file attached to record.")
			console.log(result)
			// this is similar to clear upload form except that it excludes the container.  Maybe write this better at some point.
			$("#upload-form-record-title").val("")
			$("#upload-form-file").val("")
			$("#upload-form-file-label").html("Choose file...")
			getRecords(recordContainerUri)
			}, 
		error: function(result)
			{
			console.log("Oooops!")
			console.log(result)
			}
		});
	}

function clearUploadForm()
	{
	$("#upload-form-record-container").val("")
	}

function uuidv4()
	{
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
	}

function getFileExtension(fileName)
	{
	return fileName.slice((fileName.lastIndexOf(".") - 1 >>> 0) + 2);
	}
