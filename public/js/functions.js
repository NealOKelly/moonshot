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
					url: baseUrl + "/" + apiPath + "/Search?q=" + q + "&properties=ClassificationName, ClassificationParentClassification, ClassificationCanAttachRecords, ClassificationChildPattern,ClassificationIdNumber&trimtype=Classification&pageSize=1000000",
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
								addClassificationNode("#" + parentNodeId + " > ul", result.Results[i].Uri, result.Results[i].ClassificationName.Value, result.Results[i].ClassificationCanAttachRecords.Value, result.Results[i].ClassificationChildPattern.Value, result.Results[i].ClassificationIdNumber.Value)
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


function addClassificationNode(rootNode, classificationUri, classificationName, canAttachRecords, classificationChildPattern, classificationNumber)
	{
	$(rootNode).append("<li id='classification-uri-" + classificationUri + "' data-classification-number='" + classificationNumber + "'><span class='collapsed'></span><span class='folder'></span><span class='classification-name'><a>" + classificationName + "</a></span></li>")
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
	console.log("refreshFolderNodes has been called")
	console.log("parentNodeType: " + parentNodeType)
	console.log("parentNodeId: " + parentNodeId)
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			console.log("isAuthenticated")
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
					console.log("xhr success")
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
									//$("#" + parentNodeId).append("<ul style='list-style-type:none;' class='classification-hidden'></ul>") // create hidden
									$("#" + parentNodeId).append("<ul style='list-style-type:none;' class='classification-hidden'></ul>") // create hidden
									}
								}
							for(i=0; i<result.TotalResults; i++)  
								{
								if(!$("#record-uri-" + result.Results[i].Uri).length)  // for each search result, check whether the <li> exists and, if not, create it.
									{
									console.log("Node does not exist")
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

function highlightSelectedNode(node)
	{
	$(".record-row").removeClass("row-selected")
	$("#classification-treeview li").removeClass("node-selected")
	$("#" + node.attr("id")).addClass("node-selected")
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
						$("#records-list-pane").html("<div class='no-records'>The selected folder does not contain any records.</div>")		
						}
					else
						{
						var tableHTML = '<table id="grid" class="table table-sm">'
						tableHTML = tableHTML + '<thead style="background-color:#ffffff;""><tr>'
						tableHTML = tableHTML + '<th id="th-type" data-type="string" class="unsorted">Type</th>'
						tableHTML = tableHTML +	'<th id="th-record-number" data-type="string" class="sorted-down">Record Number</i></th>'
						tableHTML = tableHTML +	'<th id="th-record-title" style="text-align:left;" data-type="string" class="unsorted">Title</th>'
						tableHTML = tableHTML +	'<th id="th-date-registered" data-type="string" class="unsorted">Date Registered</th>'
						tableHTML = tableHTML + '<th ">Download</th>'
						tableHTML = tableHTML + '</tr></thead><tbody">'
						for(i=0; i<result.TotalResults; i++)
							{
							var uri = result.Results[i].Uri;
							var title = result.Results[i].RecordTitle.Value;
							var extension = result.Results[i].RecordExtension.Value;
							var mimeType = result.Results[i].RecordMimeType.Value;
							var recordNumber = result.Results[i].RecordNumber.Value;
							var dateRegistered = result.Results[i].RecordDateRegistered;
							tableHTML = tableHTML + '<tr id="record-uri-' + uri + '" class="record-row" data-record-title="' + title + '" data-record-extension="' + extension + '" data-record-mime-type="' + mimeType + '">'
							tableHTML = tableHTML + '<td><span class="fiv-viv fiv-icon-blank fiv-icon-' + extension.toLowerCase() + '" arial-label="' + extension.toUpperCase() + ' Icon"></span></td>'
							tableHTML = tableHTML + '<td>' + recordNumber + '</td>'
							tableHTML = tableHTML + '<td style="text-align:left;">' + title + '</td>'
							tableHTML = tableHTML + '<td>' + dateRegistered.DateTime.substr(8, 2) + '/' + dateRegistered.DateTime.substr(5, 2) + '/' + dateRegistered.DateTime.substr(0, 4) + '</td>'
							tableHTML = tableHTML + '<td><span class="download-grey"></span></td></tr>'
							}
						tableHTML = tableHTML + '</tbody></table'>

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
					var dateRegistered = result.Results[0].RecordDateRegistered.DateTime.substr(8, 2) + '/'
					dateRegistered = dateRegistered + result.Results[0].RecordDateRegistered.DateTime.substr(5, 2) + '/'
					dateRegistered = dateRegistered + result.Results[0].RecordDateRegistered.DateTime.substr(0, 4) + " at "
					dateRegistered= dateRegistered + result.Results[0].RecordDateRegistered.DateTime.substr(11, 8)
					switch(type)
						{
						case "folder-intermediate":
							$("#properties-record-number").html(result.Results[0].RecordNumber.Value)
							$("#properties-classification").html(result.Results[0].RecordClassification.ClassificationTitle.Value)
							$("#properties-record-type").html(result.Results[0].RecordRecordType.RecordTypeName.Value)
							$("#properties-date-registered").html(dateRegistered)
							$("#properties-access-control").html(result.Results[0].RecordAccessControl.Value)
							$("#properties-retention-schedule").html(result.Results[0].RecordRetentionSchedule.Uri)
							break;
						case "folder-terminal":
							$("#properties-record-number").html(result.Results[0].RecordNumber.Value)
							$("#properties-container").html(result.Results[0].RecordContainer.RecordNumber.Value + ": " + result.Results[0].RecordContainer.RecordTitle.Value)
							$("#properties-record-type").html(result.Results[0].RecordRecordType.RecordTypeName.Value)
							$("#properties-date-registered").html(dateRegistered)
								
							//$("#properties-access-control").html(result.Results[0].RecordAccessControl.Value)
							
							// Upload form.
							clearUploadForm()
							$("#upload-form-record-container").val(result.Results[0].RecordNumber.Value + ": " + result.Results[0].RecordTitle.Value)
							$("#upload-form-record-container").data("recordUri", result.Results[0].Uri)
							break;
						case "document":
							$("#properties-record-number").html(result.Results[0].RecordNumber.Value)
							$("#properties-container").html(result.Results[0].RecordContainer.RecordNumber.Value + ": " + result.Results[0].RecordContainer.RecordTitle.Value)
							$("#properties-record-type").html(result.Results[0].RecordRecordType.RecordTypeName.Value)
							$("#properties-date-registered").html(dateRegistered)
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


function uploadFile(fileName, extension, file)
	{
	var deferredObject = $.Deferred();
	jQuery.ajax(
		{
		url: "https://api.gilbyim.com/WebDAV/Uploads/" + fileName + "." + extension,
		type: "PUT",
		data: file,
		processData: false,
		contentType: "multipart/form-data",
		headers: { Authorization : "Basic bmVhbC5va2VsbHlAZ2lsYnlpbS5jb206Q3JhNTYwNTYh" },
		success: function (result) 
			{
			deferredObject.resolve();
			$("#upload-progress-bar").css("width", "33%")
			},
		error: function(result) 
			{
			$("#upload-progress-bar").css("width", "33%")
			showUploadError()
			console.log("Error")
			}
		});
	return deferredObject.promise();
	}


function createFolder(recordTitle, recordClassificationUri, recordType)
	{
	console.log("recordTitle: " + recordTitle)
	console.log("recordClassificationUri: " + recordClassificationUri)
	console.log("recordType: " + recordType)
		
	var url = baseUrl + "/" + apiPath + "/Record"
	var data = {
				"RecordTitle" : recordTitle,
				"RecordRecordType" : recordType,
				"RecordClassification" : recordClassificationUri
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
			$("#create-folder-progress-bar").css("width", "100%")
			$("#create-folder-caption").html("Folder created successfully.")
			$("#new-folder-form-record-title").val("")
			refreshFolderNodes("classification", "classification-uri-" + recordClassificationUri)
			setTimeout(function()
				{
				$("#create-folder-status").modal("hide")
				$("#create-folder-progress-bar").css("width", "0%")
				$("#create-folder-caption").html("Creating folder...")
				},
				500);
			}, 
		error: function(result)
			{
			console.log("Oooops!")
			$("#upload-progress-bar").css("width", "67%")	
			showUploadError()
			}
		});	
	}

function createRecord(recordTitle, recordType, recordContainerUri, fileName)
	{
	console.log(recordType)
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
			$("#upload-progress-bar").css("width", "67%")	
			attachFileToRecord(result.Results[0].Uri, fileName, recordContainerUri)
			}, 
		error: function(result)
			{
			console.log("Oooops!")
			$("#upload-status-caption").html(result.responseJSON.ResponseStatus.Message)
			$("#upload-progress-bar").css("width", "67%")	
			showUploadError(result.responseJSON.ResponseStatus.Message)
			}
		});
	}

function attachFileToRecord(recordUri, fileName, recordContainerUri)
	{
	var data = {
				"Uri": recordUri,
				"RecordFilePath": fileName,
				"RecordFinalizeOnSave" : "true"
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
			// this is similar to clear upload form except that it excludes the container.  Maybe write this better at some point.
			$("#upload-form-record-title").val("")
			$("#upload-form-file").val("")
			$("#upload-form-file-label").html("Choose file...")
			getRecords(recordContainerUri)
			$("#upload-progress-bar").css("width", "100%")
			$("#upload-status-caption").html("Upload completed successfully.")
			setTimeout(function()
				{
				$("#upload-status").modal("hide")
				$("#upload-progress-bar").css("width", "0%")
				},
				500);
			}, 
		error: function(result)
			{
			console.log("Oooops!")
			$("#upload-progress-bar").css("width", "100%")
			showUploadError()
			}
		});
	}

function showUploadError(trimError)
	{
	console.log(trimError)
	if(trimError)
		{
		$("#upload-progress-bar").addClass("bg-danger")
		$("#upload-status-caption").html(trimError)
		$("#upload-status-ok-button").css("display", "block")
		}
	else
		{
		$("#upload-progress-bar").addClass("bg-danger")
		$("#upload-status-caption").html("An error has occured during your upload.  If the problem persists, please contact GilbyIM support.")
		$("#upload-status-ok-button").css("display", "block")
		}

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


function clearUploadForm()
	{
	$("#upload-form-record-container").val("")
	//$("#upload-form-record-type").html("")
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

function hideDummyModal() 
	{
	console.log("hideDummyModal() has been called.")
	setTimeout(function()
		{
  		$("#dummy-modal").modal('hide');
		},
		300); // this delay ensure the modal has properly been show before attempting to hide it.
	}

function populateRecordTypeField(parentNodeType)
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			switch(parentNodeType)
				{
				case "classification":
					$("#new-folder-form-record-type").html("")
					var url = baseUrl + "/" + apiPath + "/Search?q=all&properties=RecordTypeName,RecordTypeContainerRule&trimtype=RecordType"
					$.ajax(
						{
						url: url,
						type: "POST",
						xhrFields: { withCredentials: true},
						contentType: 'application/json',
						success: function(result)
							{
							console.log(result)
							for(i=0; i<result.Results.length;i++)
								{
								if(result.Results[i].RecordTypeContainerRule.Value=="Prevented")
									{
									$("#new-folder-form-record-type").append("<option>" + result.Results[i].RecordTypeName.Value + "</option>")
									}
								}
							if($("#new-folder-form-record-type option").length<2)
								{
								$("#new-folder-form-record-type").attr("readonly", "true")
								}
							}, 
						error: function(result)
							{
							console.log("Oooops!")
							}
						});	
						break;
					break;
				case "folder-intermediate":
					// do something
					alert("folder-intermediate")
					break;
				case "folder-terminal":
					$("#upload-form-record-type").html("")
					var url = baseUrl + "/" + apiPath + "/Search?q=all&properties=RecordTypeName,RecordTypeUsualBehaviour&trimtype=RecordType"
					$.ajax(
						{
						url: url,
						type: "POST",
						xhrFields: { withCredentials: true},
						contentType: 'application/json',
						success: function(result)
							{
							for(i=0; i<result.Results.length;i++)
								{
								if(result.Results[i].RecordTypeUsualBehaviour.Value=="Document")
									{
									var exclude = false;
									for(x=0; x<config.ExcludedRecordTypes.length; x++)
										{
											console.log("Search: " + result.Results[i].RecordTypeName.Value)
											console.log("Config: " + config.ExcludedRecordTypes[x])
										if(result.Results[i].RecordTypeName.Value==config.ExcludedRecordTypes[x])
											{
											exclude = true;
											console.log("Hello Dolly")		

											}
										}
									console.log("exclude: " + exclude)
									if(!exclude)
										{
										$("#upload-form-record-type").append("<option>" + result.Results[i].RecordTypeName.Value + "</option>")	
										}
									}
								}
							if($("#upload-form-record-type option").length<2)
								{
								$("#upload-form-record-type").attr("readonly", "true")
								}
							}, 
						error: function(result)
							{
							console.log("Oooops!")
							}
						});	
						break;
					}
			}
		})
	}