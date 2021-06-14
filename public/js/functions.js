///// CONTENTS /////
// 1. AUTHENTICATION & SESSION MANAGEMENT //
// 2. CLASSIFICATION & FOLDER TREE //
// 3. RECORDS LIST PANEL //
// 4. RIGHT PANEL //
// 5. PROPERTIES PANEL //
// 6. CREATE FOLDER //
// 7. UPLOAD & REGISTER DOCUMENT //
// 8. DOWNLOAD DOCUMENT //
// 9. MISCELLANEOUS //

function getTimeStamp()
	{
	var timeStamp = new Date().getTime();
	return timeStamp;
	}

// 1. AUTHENTICATION & SESSION MANAGEMENT //
function preauthenticateApi()
	{
	// Session cookies need to be estabilished before making any AJAX calls to the API server.  This is because the first HTTP200 response
	// (i.e what is returned by the ajax call) is actually a page served by ADFS server that uses JavaScript to POST the SAML assertion 
	// to the API server.  As a workaround, we load a resource from the API server into an IFRAME instead.
	return $.Deferred(function(d)
	{
	var startTime = getTimeStamp();	
	if(hasPreAuthenticated)
		{
		//gtag('event', 'Preauthenticate', { 'Duration' :  getTimeStamp() - startTime });
		d.resolve();
		return;
		}
		var iFrame = $("<iframe id='authentication-frame' sandbox='allow-scripts allow-forms allow-same-origin'></iframe>");
		iFrame.hide();
		iFrame.appendTo("body");
		iFrame.attr('src', baseUrl + apiPath + "/help/index");
		iFrame.on('load', function () 
			{
			if($("#authentication-frame").contents().find("title").html()=="Content Manager - ServiceAPI Help Index")
				{
				hasPreAuthenticated = true;
				iFrame.remove();
				gtag('event', 'Login', { 'login_duration' :  getTimeStamp() - startTime });
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
				deferredObject.resolve();	
				}
			else
				{
				isAuthenticated=false;
				removeAPISessionCookies()
				deferredObject.resolve();	
				}
			}, 
		error: function(result)
			{
			deferredObject.resolve();		
			}
		});
		return deferredObject.promise();
	}

function displaySessionExpiredModal()
	{
	gtag('event', 'Session Timeout');
	$("#loading").modal("hide")		
	$("#connection-failed").modal("hide")
	$("#create-folder-status").modal("hide")
	$("#upload-form-container").modal("hide")
	$("#edit-properties-error").modal("hide")
	$("#session-expired").modal("show")
	}

function removeAppSessionCookies()
	{
	//$.cookie("FedAuth", null, { expires: -1, path: "/CMServiceAPI/"} )
	//$.cookie("FedAuth", null, { expires: -1, path: "/CMServiceAPI/"} )
	//alert("Hellow Wotlf")
	}

function removeAPISessionCookies()
	{
	$.cookie("FedAuth", null, { expires: -1, path: "/CMServiceAPI/" } )
	//$.cookie("FedAuth", null, { expires: -1, path: "/CMServiceAPI/"} )
	}

// END AUTHENTICATION & SESSION MANAGEMENT //

// 2. CLASSIFICATION & FOLDER TREE //
function doAllFilesSelected()
	{
	hideNewRecordForms()
	$("#properties-pane").hide()
	$("#properties-pane-placeholder").html('<img id="properties-pane-logo" src="img/gilbyim-logo-inline-white-2.png" alt="GilbyIM powered by Micro Focus Logo">') // I don't understand why this code is necessary.
	$("#classification-treeview li").removeClass("node-selected")
	$("#all-files").addClass("node-selected")
	$("#all-files>span>a").css("font-weight", "bold")
	$("#properties-pane-placeholder").css("display", "block")	
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
				if(parentNodeId=="all-files")
					{
					q = "all";
					}
				else
					{
					q="parent:" + parentNodeId.substr(19);
					}
				var data = {
							"q" : q,
							"Properties" : "ClassificationName, ClassificationParentClassification, ClassificationCanAttachRecords, ClassificationChildPattern, ClassificationIdNumber", 
							"TrimType" : "Classification",
							"PageSize" : "1000000"
							};
				var result = searchAPI(data)
					.then(function(result)
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
								if(parentNodeId=="all-files")
									{
									if(!result.Results[i].hasOwnProperty("ClassificationParentClassification"))
										{
										addClassificationNode("#" + parentNodeId + " > ul", result.Results[i].Uri, result.Results[i].ClassificationName.Value, result.Results[i].ClassificationCanAttachRecords.Value, result.Results[i].ClassificationChildPattern.Value, result.Results[i].ClassificationIdNumber.Value)	
										}
									}
								else
									{
									addClassificationNode("#" + parentNodeId + " > ul", result.Results[i].Uri, result.Results[i].ClassificationName.Value, result.Results[i].ClassificationCanAttachRecords.Value, result.Results[i].ClassificationChildPattern.Value, result.Results[i].ClassificationIdNumber.Value)
									}
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
						})
					.fail(function(result)
						{
						// Do something
						})
				});
			}
		else
			{
			displaySessionExpiredModal()
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
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			$("#" + parentNodeId + " > ul").addClass("classification-hidden") // if already exists, hide.
			url = baseUrl + apiPath + "/RecordType?q=all&properties=RecordTypeLevel, RecordTypeContentsRule, RecordTypeName&pageSize=1000000"
			$.ajax(
				{
				url: url,
				type: "GET",
				xhrFields: { withCredentials: true},
				contentType: 'application/json', 
				success: function(result)
					{
					var recordTypeDefinitions = result;
					if(parentNodeType=="classification")
						{
						var startTime = getTimeStamp();
						data = {
								"q" : "classification:" + parentNodeId.substr(19),
								"Properties" : "RecordTitle, RecordRecordType, RecordTypeContentsRule, RecordContainer", 
								"TrimType" : "Record",
								"PageSize" : "1000000"
								};
						}
					else{
						if(parentNodeType=="record")
							{
							data = {
								"q" : "container:" + parentNodeId.substr(11),
								"Properties" : "RecordTitle, RecordRecordType, RecordTypeContentsRule, RecordContainer", 
								"TrimType" : "Record",
								"PageSize" : "1000000"
								};
							}
						}
					var result = searchAPI(data)
						.then(function(result)
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
							
							if(parentNodeType=="classification")
								{
								gtag('event', 'Show Folders', { 'show_folders_duration' :  getTimeStamp() - startTime });
								}
							})
						.fail(function(result)
							{
							displaySessionExpiredModal()
							})
					}, 
				error: function(result)
					{
					// Do something
					}
				});
			}
		else
			{
			
			}
		});
	}

function addIntermediateFolderNode(parentNodeId, recordUri, recordTitle)
	{
	$("#" + parentNodeId + " > ul").append("<li id='record-uri-" + recordUri + "' class='folder-intermediate'><span class='collapsed'></span></span><span class='folder'></span><span class='record-title'><a>" + recordTitle + "</a></span></li>")
	}

function addTerminalFolderNode(parentNodeId, recordUri, recordTitle)
	{
	$("#" + parentNodeId + " > ul").append("<li id='record-uri-" + recordUri + "' class='folder-terminal'><span class='collapsed'></span><span class='folder'></span><span class='record-title'><a>" + recordTitle + "</a></span></li>")
	}

function sortClassificationTree(sortBy)
	{
	$("#all-files ul").each(function(_, ul)
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

function classificationTreeNodeSelected(node)
	{
	$("#records-list-pane").html("<div class='no-records display-4'>Browse or search to display records.</div>")
	highlightSelectedNode(node)
	if((node).attr("id").substr(0, 19) == "classification-uri-")
		{
		if(node.hasClass("classification-can-attach-records"))
			{
			var classification = node.data("classificationNumber")
			var classification = classification + " - " +  $("#" + node.attr("id") + " span:nth-child(3) > a").html()
			$("#new-folder-form-record-title").val("")
			$("#new-folder-form-record-classification").val(classification)
			$("#new-folder-form-record-classification").data("classificationUri", (node).attr("id").substr(19))
			}
		drawPropertiesTable("classification")
		var classificationUri = node.attr("id").substr(19)
		getClassificationProperties(classificationUri)
		}
	else
		{
		if((node).attr("id").substr(0, 11) == "record-uri-")
			{
			if($(node).hasClass("folder-intermediate"))
				{
				drawPropertiesTable("folder-intermediate")
				getRecordProperties("folder-intermediate", node.attr("id").substr(11))	
				}
			}
		}
	}

function highlightSelectedNode(node)
	{
	$(".record-row").removeClass("row-selected")
	$("#classification-treeview li").removeClass("node-selected")
	$("#all-files>span>a").css("font-weight", "normal")
	$("#" + node.attr("id")).addClass("node-selected")
	}


// END CLASSIFICATION & FOLDER TREE //

// 3. RECORDS LIST PANEL //

function getRecords(recordUri)
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			var data =  { "q" : "container:" + recordUri,
						  "Properties" : "RecordTitle, RecordNumber, DateRegistered, RecordMimeType, RecordExtension",
						  "TrimType" : "Record",
						  "PageSize" : "100000"
						}
			var result = searchAPI(data)
				.then(function(result)
					{
					var details = JSON.stringify(result);
					if(result.TotalResults=="0")
						{
						$("#records-list-pane").html("<div class='no-records display-4'>The selected folder does not contain any records.</div>")		
						}
					else
						{
						var tableHTML = '<table id="grid" class="table table-sm">'
						tableHTML = tableHTML + '<thead style="background-color:#ffffff;""><tr>'
						tableHTML = tableHTML + '<th id="th-type" data-type="string" class="unsorted">Type</th>'
						tableHTML = tableHTML +	'<th id="th-record-number" data-type="string" class="sorted-down">Record</i></th>'
						tableHTML = tableHTML +	'<th id="th-record-title" style="text-align:left;" data-type="string" class="unsorted">Title</th>'
						tableHTML = tableHTML +	'<th id="th-date-registered" data-type="string" class="unsorted">Date Registered</th>'
						tableHTML = tableHTML + '<th ">Download</th>'
						tableHTML = tableHTML + '</tr></thead><tbody style="overflow-y: auto;">'
						for(i=0; i<result.TotalResults; i++)
							{
							var uri = result.Results[i].Uri;
							var title = result.Results[i].RecordTitle.Value;
							var extension = result.Results[i].RecordExtension.Value;
							var mimeType = result.Results[i].RecordMimeType.Value;
							var recordNumber = result.Results[i].RecordNumber.Value;
							var dateRegistered = result.Results[i].RecordDateRegistered;
							tableHTML = tableHTML + '<tr id="record-uri-' + uri + '" class="record-row" data-record-title="' + title + '" data-record-extension="' + extension + '" data-record-mime-type="' + mimeType + '">'
							tableHTML = tableHTML + '<td><span class="fiv-viv fiv-icon-blank fiv-icon-' + extension.toLowerCase() + '" arial-label="' + extension.toUpperCase() + ' Icon" data-bs-toggle="tooltip" data-bs-original-title="' + extension.toUpperCase() + '" data-bs-placement="right"></span></td>'
							tableHTML = tableHTML + '<td>' + recordNumber + '</td>'
							tableHTML = tableHTML + '<td style="text-align:left;">' + title + '</td>'
							tableHTML = tableHTML + '<td>' + dateRegistered.DateTime.substr(8, 2) + '/' + dateRegistered.DateTime.substr(5, 2) + '/' + dateRegistered.DateTime.substr(0, 4) + '</td>'
							tableHTML = tableHTML + '<td><span class="download-grey"></span></td></tr>'
							}
						tableHTML = tableHTML + '</tbody></table'>

						$("#records-list-pane").html(tableHTML)
						var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
						var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) 
							{
  							return new bootstrap.Tooltip(tooltipTriggerEl)
							})
						}					
					})
				.fail(function(result)
					{
					// Do something
					})
			}
		else
			{
			displaySessionExpiredModal()
			}
		});
	}

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

function populateSearchResultPane(searchString, foldersOnly)
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			var startTime = getTimeStamp();
				
			url = baseUrl + apiPath + "/RecordType?q=all&properties=RecordTypeLevel, RecordTypeContentsRule, RecordTypeName&pageSize=1000000"
			var data = 	{
						"q" : "all",
						"Properties" : "RecordTypeLevel, RecordTypeContentsRule, RecordTypeName",
						"TrimType" : "RecordType",
						"PageSize" : "111"
						}
			searchString = "*" + searchString + "*";
			$.ajax(
				{
				url: url,
				type: "GET",
				contentType: 'application/json',
				xhrFields: { withCredentials: true},
				success: function(recordTypeDefinitions)
					{
					data = 	{
								"q" : 'content:"' + searchString + '" Or anyWord:' + searchString,
								"Properties" : "RecordNumber, RecordTitle, RecordRecordType, RecordMimeType, RecordExtension",
								"TrimType" : "Record",
								"PageSize" : "1000",
								"SortBy" : "typedTitle"
								}
					var result = searchAPI(data)
						.then(function(result)
							{
							if(result.TotalResults==0)
								{
								$("#search-results-pane").html("<div class='no-records display-4'>Your search did not return any records.</div>")
								hideLoadingSpinner()	
								}
							else
								{
								var thHTML = '<table id="search-results" class="table table-sm">'
								thHTML = thHTML + '<thead style="background-color:#ffffff;"><tr>'
								thHTML = thHTML + '<th style="text-align:left;padding-left:30px;width:12%;";>Type</th>'
								thHTML = thHTML + '<th style="text-align:left;width:15%;">Number</th>'
								thHTML = thHTML + '<th id="th-record-title" style="text-align:left;">Title</th>'
								thHTML = thHTML + '<th id="th-date-registered" style="text-align:left;">Record Type</th>'
								thHTML = thHTML + '<th>Download</th></tr></thead><tbody>'
								$("#search-results-pane").append(thHTML)
							
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
																if(foldersOnly=="false")
																	{
																	addSearchResult(result.Results[x], "folder-terminal")	
																	}
																}
															}
														break;
													case "ByLevelInclusive":
														addSearchResult(result.Results[x], "folder-intermediate")
														break;
													case "ByBehavior":
														if(foldersOnly=="false")
															{
															addSearchResult(result.Results[x], "folder-terminal")		
															}
														break;
													case "ByList":
														if(recordTypeDefinitions.Results[i].RecordTypeLevel.Value>="4")
															{
															addSearchResult(result.Results[x], "folder-intermediate")
															}
														break;
													case "Prevented":
														if(foldersOnly=="false")
															{
														addSearchResult(result.Results[x], "document")
															}
														break;
													}	
												}
											}
										}
									}
								var endHTML = '</tbody></table>'
								$("#search-results-pane > tbody").append(thHTML)
							
								// here
								gtag('event', 'Search', { 'search_duration' :  getTimeStamp() - startTime });
								hideLoadingSpinner()	
								}	
							})
						.fail(function(result)
							{
							console.log("Oooops!")
							})
					}, 
				error: function(recordTypeDefinitions)
					{
					console.log()
					}
				});
			}
		else
			{
			displaySessionExpiredModal()
			}
		});	
	}

function addSearchResult(record, type)
	{
	if(type=="document")
		{
		resultRowHTML = '<tr><td>'
		resultRowHTML = resultRowHTML + '<ul><li id="level-0-search-result-type-uri-' + record.Uri + '" style="padding-left:45px;" data-record-title="' + record.RecordTitle.Value + '" data-record-extension="' + record.RecordExtension.Value + '" data-record-mime-type="' + record.RecordMimeType.Value + '">'
		
		resultRowHTML = resultRowHTML + '<span class="fiv-viv fiv-icon-blank fiv-icon-' + record.RecordExtension.Value.toLowerCase() + '" arial-label="' + record.RecordExtension.Value.toUpperCase() + '" data-bs-toggle="tooltip" data-bs-original-title="' + record.RecordExtension.Value.toUpperCase() + '" data-bs-placement="right">'
			
		resultRowHTML = resultRowHTML +	'</span></li></ul></td>'	
		}
	else
		{
		resultRowHTML = '<tr>'
		resultRowHTML = resultRowHTML + '<td><ul><li id="level-0-search-result-type-uri-' + record.Uri + '"><span class="search-result-caret-collapsed"></span><span class="search-result-folder"></span></li></ul></td>'
		}
	resultRowHTML = resultRowHTML + '<td><ul><li id="level-0-search-result-recordNumber-uri-' + record.Uri + '" class="' + type + '">' + record.RecordNumber.Value + '</li></ul></td>'
	resultRowHTML = resultRowHTML + '<td><ul><li id="level-0-search-result-recordTitle-uri-' + record.Uri + '">' + record.RecordTitle.Value + '</li></ul></td>'
	resultRowHTML = resultRowHTML + '<td><ul><li id="level-0-search-result-recordType-uri-' + record.Uri + '">' + record.RecordRecordType.RecordTypeName.Value + '</li></ul></td>'
	if(type=="document")
		{
		resultRowHTML = resultRowHTML + '<td style="text-align:center;"><ul><li id="level-0-search-result-download-uri-' + record.Uri + '"><span class="download-grey"></span></li></ul></td>'
		}
	else
		{
		resultRowHTML = resultRowHTML + '<td style="text-align:center;"><ul><li id="level-0-search-result-download-uri-' + record.Uri + '"><!--Intentionally Blank--></li></ul></td>'	
		}
	
	resultRowHTML = resultRowHTML + '</tr>'
	$("#search-results").append(resultRowHTML)
	var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
	var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) 
		{
  		return new bootstrap.Tooltip(tooltipTriggerEl)
		})
	}

function highlightSelectedSearchResult(uri, level)
	{
	if($("#level-" + level + "-search-result-recordNumber-uri-" + uri).css("font-weight")!="700")
		{
		$("#search-results li").css("font-weight", "normal")
		$("[id*='-search-result-download-uri-'] span").removeClass("download")
		$("[id*='-search-result-download-uri-'] span").addClass("download-grey")
		$("#level-" + level + "-search-result-recordNumber-uri-" + uri).css("font-weight", "bold")
		$("#level-" + level + "-search-result-recordTitle-uri-" + uri).css("font-weight", "bold")
		$("#level-" + level + "-search-result-recordType-uri-" + uri).css("font-weight", "bold")
		if($("#level-" + level + "-search-result-recordNumber-uri-" + uri).hasClass("document"))
			{
			$("#level-" + level + "-search-result-download-uri-" + uri + ">span").removeClass("download-grey")
			$("#level-" + level + "-search-result-download-uri-" + uri + ">span").addClass("download")
			}
		}
	}

function expandCollapsedSearchResult(recordUri, level)
	{
	var newTypeNodeId;
	var newRecordNumberNodeId;
	var newRecordTitleNodeId;
	var newRecordTypeNodeId;
	var newDownloadNodeId;

	$("#" + $(event.target).parent().attr("id") + " >span:nth-child(1)").addClass("search-result-caret-expanded")
	$("#" + $(event.target).parent().attr("id") + " >span:nth-child(1)").removeClass("search-result-caret-collapsed")
	$("#" + $(event.target).parent().attr("id") + " >span:nth-child(2)").addClass("search-result-folder-open")
	$("#" + $(event.target).parent().attr("id") + " >span:nth-child(2)").addClass("search-result-folder")

	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			url = baseUrl + apiPath + "/RecordType?q=all&properties=RecordTypeLevel, RecordTypeContentsRule, RecordTypeName&pageSize=1000000"
			$.ajax(
				{
				url: url,
				type: "GET",
				contentType: 'application/json',
				xhrFields: { withCredentials: true},
				success: function(recordTypeDefinitions)
					{
					var url = baseUrl + apiPath + "/Search?q=all and container:" + recordUri + "&properties=RecordTitle,RecordNumber,RecordRecordType,RecordMimeType,RecordExtension&trimtype=Record&pageSize=1000&sortBy=typedTitle"
					$.ajax(
						{
						url: url,
						type: "POST",
						contentType: 'application/json',
						xhrFields: { withCredentials: true},
						success: function(result)
							{
							if(result.TotalResults==0)
								{
								$("#level-" + level + "-search-result-type-uri-" + recordUri).after('<ul><li class="no-results" style="padding-left:40px;"><span class="file-earmark-grey"></span></li></ul>')

								$("#level-" + level + "-search-result-recordNumber-uri-"  + recordUri).after('<ul><li class="no-results"  style="color:grey;">- None</li></ul>')

								$("#level-" + level + "-search-result-recordTitle-uri-"  + recordUri).after('<ul><li class="no-results" style="color:grey;">- No records found.</li></ul>')

								$("#level-" + level + "-search-result-recordType-uri-"  + recordUri).after('<ul><li class="no-results" style="color:grey;">- None</li></ul>')
									
								$("#level-" + level + "-search-result-download-uri-"  + recordUri).after('<ul><li class="no-results" style="color:grey;"><!--Intentionally Blank--></li></ul>')
									
								}
							else
								{
								for(i=0; i<result.TotalResults; i++)
									{
									var nodeType;
									for(x=0; x<result.TotalResults; x++)
										{
										for(y=0; y<recordTypeDefinitions.TotalResults; y++)
											{
											if(recordTypeDefinitions.Results[y].Uri==result.Results[x].RecordRecordType.Uri)
												{
												if(!config.ExcludedRecordTypes.includes(result.Results[x].RecordRecordType.RecordTypeName.Value))
													{
													switch(recordTypeDefinitions.Results[y].RecordTypeContentsRule.Value)
														{
														case "ByLevel":
															if(recordTypeDefinitions.Results[y].RecordTypeLevel.Value>="5")
																{
																nodeType = "folder-intermediate"
																}
															else
																{
																if(recordTypeDefinitions.Results[y].RecordTypeLevel.Value<"5")
																	{
																	nodeType = "folder-terminal"	
																	}
																}
															break;
														case "ByLevelInclusive":
															nodeType = "folder-intermediate"
															break;
														case "ByBehavior":
															nodeType = "folder-terminal"
															break;
														case "ByList":
															if(recordTypeDefinitions.Results[y].RecordTypeLevel.Value>="4")
																{
																nodeType = "folder-intermediate"
																}
															break;
														case "Prevented":
															nodeType = "document"
															break;
														}	
													}
												}
											}
										}
									var isDocument = false;
									if(nodeType=="document")
										{
										isDocument=true;
										}
										
									// column 1
									if(i==0) // first row
										{
										if(isDocument) // is a document
											{
											$("#level-" + level + "-search-result-type-uri-" + recordUri).after("<ul><li id='level-" + (level + 1) + "-search-result-type-uri-" + result.Results[i].Uri + "' style='padding-left:40px;' data-record-title='" + result.Results[i].RecordTitle.Value + "' data-record-extension='" + result.Results[i].RecordExtension.Value + "'  data-record-mime-type='" + result.Results[i].RecordMimeType.Value + "'><span class='fiv-viv fiv-icon-blank fiv-icon-" + result.Results[i].RecordExtension.Value.toLowerCase() + "' data-bs-toggle='tooltip' data-bs-original-title='" + result.Results[i].RecordExtension.Value.toUpperCase() + "' data-bs-placement='right'></span></li></ul>")

											newTypeNodeId="#level-" + (level + 1) + "-search-result-type-uri-" + result.Results[i].Uri	
											}
										else  // is a folder
											{
											$("#level-" + level + "-search-result-type-uri-" + recordUri).after("<ul><li id='level-" + (level + 1) + "-search-result-type-uri-" + result.Results[i].Uri + "'><span class='search-result-caret-collapsed'></span><span class='search-result-folder'></span></li></ul>")

											newTypeNodeId="#level-" + (level + 1) + "-search-result-type-uri-" + result.Results[i].Uri
											}
										}
									else // subsequent rows
										{
										if(isDocument) // is a document
											{
											$(newTypeNodeId).parent().append("<li id='level-" + (level + 1) + "-search-result-type-uri-" + result.Results[i].Uri + "' style='padding-left:40px;' data-record-title='" + result.Results[i].RecordTitle.Value + "' data-record-extension='" + result.Results[i].RecordExtension.Value + "'  data-record-mime-type='" + result.Results[i].RecordMimeType.Value + "'><span class='fiv-viv fiv-icon-blank fiv-icon-" + result.Results[i].RecordExtension.Value.toLowerCase() + "' data-bs-toggle='tooltip' data-bs-original-title='" + result.Results[i].RecordExtension.Value.toUpperCase() + "' data-bs-placement='right'></span></li>")	
											}
										else  // is a folder
											{
											$($(newTypeNodeId)).parent().append("<li id='level-" + (level + 1) + "-search-result-type-uri-" + result.Results[i].Uri + "'><span class='search-result-caret-collapsed'></span><span class='search-result-folder'></span></li>")	
											}	
										}

									// column 2
									if(i==0)  // first row	
										{
										$("#level-" + level + "-search-result-recordNumber-uri-" + recordUri).after("<ul><li id='level-" + (level + 1) + "-search-result-recordNumber-uri-" + result.Results[i].Uri + "' class='" + nodeType + "'>- " + result.Results[i].RecordNumber.Value + "</li></ul>")

										newRecordNumberNodeId="#level-" + (level + 1) + "-search-result-recordNumber-uri-" + result.Results[i].Uri
										}
									else // subsequent rows
										{
										$(newRecordNumberNodeId).parent().append("<li id='level-" + (level + 1) + "-search-result-recordNumber-uri-" + result.Results[i].Uri + "' ' class='" + nodeType + "'>- " + result.Results[i].RecordNumber.Value + "</li>")	
										}

									// column 3
									if(i==0)  // first row
										{
										$("#level-" + level + "-search-result-recordTitle-uri-" + recordUri).after("<ul><li id='level-" + (level + 1) + "-search-result-recordTitle-uri-" + result.Results[i].Uri + "'>- " + result.Results[i].RecordTitle.Value + "</li></ul>")

										newRecordTitleNodeId="#level-" + (level + 1) + "-search-result-recordTitle-uri-" + result.Results[i].Uri	
										}
									else // subsequent rows
										{
										$(newRecordTitleNodeId).parent().append("<li id='level-" + (level + 1) + "-search-result-recordTitle-uri-" + result.Results[i].Uri + "'>- " + result.Results[i].RecordTitle.Value + "</li>")	
										}

									// column 4
									if(i==0)  // first row
										{
										$("#level-" + level + "-search-result-recordType-uri-" + recordUri).after("<ul><li id='level-" + (level + 1) + "-search-result-recordType-uri-" + result.Results[i].Uri + "'>- " + result.Results[i].RecordRecordType.RecordTypeName.Value + "</li></ul>")

										newRecordTypeNodeId = "#level-" + (level + 1) + "-search-result-recordType-uri-" + result.Results[i].Uri	
										}
									else // subsequent rows
										{
										$(newRecordTypeNodeId).parent().append("<li id='level-" + (level + 1) + "-search-result-recordType-uri-" + result.Results[i].Uri + "'>- " + result.Results[i].RecordRecordType.RecordTypeName.Value + "</li>")	
										}

									// column 5
									if(i==0)  // first row
										{
										if(isDocument) // is a document
											{
											$("#level-" + level + "-search-result-download-uri-" + recordUri).after("<ul style='padding-left:0;'><li id='level-" + (level + 1) + "-search-result-download-uri-" + result.Results[i].Uri + "'><span class='download-grey'></span></li></ul>")	

											newDownloadNodeId = "#level-" + (level + 1) + "-search-result-download-uri-" + result.Results[i].Uri	
											}
										else // is a folder
											{
											$("#level-" + level + "-search-result-download-uri-" + recordUri).after("<ul style='padding-left:0;'><li id='level-" + (level + 1) + "-search-result-download-uri-" + result.Results[i].Uri + "'><!--Intentionally Blank--></li></ul>")

											newDownloadNodeId = "#level-" + (level + 1) + "-search-result-download-uri-" + result.Results[i].Uri	
											}
										}
									else // subsequent rows
										{
										if(isDocument) // is a document
											{
											$(newDownloadNodeId).parent().append("<li id='level-" + (level + 1) + "-search-result-download-uri-" + result.Results[i].Uri + "'><span class='download-grey'></span></li>")	
											}
										else // is a folder
											{
											$(newDownloadNodeId).parent().append("<li id='level-" + (level + 1) + "-search-result-download-uri-" + result.Results[i].Uri + "'><!--Intentionally Blank--></li>")	
											}	
										}

									}	
									var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'))
									var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) 
										{
										return new bootstrap.Tooltip(tooltipTriggerEl)
										})
								}
							}, 
						error: function(result)
							{
							// Do something
							}
						});
					}, 
				error: function(recordTypeDefinitions)
					{
					//Do something
					}
				});
			}
		else
			{
			displaySessionExpiredModal()
			}
		});
	}

// END RECORDS LIST PANEL //

// 4. RIGHT PANEL //
function populateContainerField(parentNodeType, parentNodeUri)
	{
	var data = 	{
				"q" : parentNodeUri,
				"Properties" : "RecordTitle, RecordNumber",
				"TrimType" : "Record"
				}
	var result = searchAPI(data)
	.then(function(result)
		{
		switch(parentNodeType)
			{
			case "folder-intermediate":
				$("#new-sub-folder-form-record-container").val(result.Results[0].RecordNumber.Value + ": " + result.Results[0].RecordTitle.Value)
				$("#new-sub-folder-form-record-container").data("record-Uri", result.Results[0].Uri)	
				break;
			case "folder-terminal":
				$("#upload-form-record-container").val("")
				$("#upload-form-record-container").val(result.Results[0].RecordNumber.Value + ": " + result.Results[0].RecordTitle.Value)
				$("#upload-form-record-container").data("record-Uri", result.Results[0].Uri)	
				break;
			}
		})
	.fail(function(result)
		{
		// Do something
		})
	}

function populateRecordTypeField(parentNodeType, parentNodeUri)
	{
	var deferredObject = $.Deferred();
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			switch(parentNodeType)
				{
				case "classification":
					$("#new-folder-form-record-type").empty()
					//$("#new-folder-form-record-type>option").remove()
					// Returm as list of record type that are configure to behave like folders.
					var onlyRecordTypeCount = 0;
					var url = baseUrl + apiPath + "/Search";
					var data = 	{
								"q" : "behaviour:folder",
								"Properties" : "RecordTypeName, RecordTypeContainerRule, RecordTypeUsualBehaviour",
								"TrimType" : "RecordType"
								}
					var result = searchAPI(data)
						.then(function(result)
							{
							var intermediateFolderRecordTypeUris = [];
							var intermediateFolderRecordTypeNames = [];
							for(i=0; i<result.Results.length; i++)
								{
								// The GilbyIM Lite application requires folders (that can attach to classifications) to be configured so they cannot be contained by other records.
								if(result.Results[i].RecordTypeContainerRule.Value=="Prevented")
								   	{
									intermediateFolderRecordTypeUris.push(result.Results[i].Uri)
									intermediateFolderRecordTypeNames.push(result.Results[i].RecordTypeName.Value)
								   	}
								}
							$("#new-folder-form-record-type").empty()
							for(i=0; i<intermediateFolderRecordTypeUris.length; i++)  // for each folder Record Type, confirm if the Classification can use it.
								{
							   	(function(index)
								 	{
									data = 	{
											"q" : "uri:" + parentNodeUri + ",recordType:" + intermediateFolderRecordTypeUris[i],
											"Properties" : "ClassificationTitle",
											"TrimType" : "Classification"
											}
									var result = searchAPI(data)
										.then(function(result)
											{
											if(result.TotalResults>0)
												{
												$("#new-folder-form-record-type").append("<option>" + intermediateFolderRecordTypeNames[index] + "</option>")
												onlyRecordTypeCount++;
												}
											if($("#new-folder-form-record-type option").length<2)
												{
												$("#new-folder-form-record-type").attr("readonly", true)
												}
											else
												{
												$("#new-folder-form-record-type").attr("readonly", false)
												}
											lastIndex = intermediateFolderRecordTypeUris.length - 1
											if(index==(lastIndex))
												{
												if(onlyRecordTypeCount==0) // i.e. the selected classification does not have an Only Record Types rule configured.
													{
													//url = baseUrl + apiPath + "/Search";
													data = 	{
															"q" : "behaviour:folder",
															"Properties" : "RecordTypeName, RecordTypeContainerRule, RecordTypeUsualBehaviour, RecordTypeClassification, RecordTypeClassificationMandatory",
															"TrimType" : "RecordType"
															}
													var result = searchAPI(data)
														.then(function(result)
															{
															for(x=0; x<result.TotalResults; x++)	
																{
																if(!result.Results[x].hasOwnProperty("RecordTypeClassification"))  // if the Record Type doesn't have a Starting Classification then it can be used with the selected classification.
																	{
																	if(result.Results[x].RecordTypeContainerRule.Value=="Prevented") // filter out (again) the Record Types that can be contained by other records.
																		{
																		$("#new-folder-form-record-type").append("<option>" + result.Results[x].RecordTypeName.Value + "</option>")
																		}
																	if($("#new-folder-form-record-type option").length<2)
																		{
																		$("#new-folder-form-record-type").attr("readonly", true)
																		}
																	else
																		{
																		$("#new-folder-form-record-type").attr("readonly", false)
																		}
																	}
																else
																	{
																	// if record type does have a Starting Classification AND it is mandatory, then we need to check whether the selected classification is the mandatory starting classification. 
																	var recordTypeName = result.Results[x].RecordTypeName.Value
																	if(result.Results[x].RecordTypeClassificationMandatory.Value)
																	   {
																		var recordTypeClassification = result.Results[x].RecordTypeClassification.ClassificationTitle.Value

																		url = baseUrl + apiPath + "/Search";
																		data =	{
																				"q" : "uri:" + parentNodeUri,
																				"Properties" : "ClassificationTitle",
																				"TrimType" : "Classification"
																				}
																		   
																		var result = searchAPI(data)
																			.then(function(result)
																				{
																				if(result.Results[0].ClassificationTitle.Value==recordTypeClassification)
																					{
																					$("#new-folder-form-record-type").append("<option>" + recordTypeName + "</option>")

																					if($("#new-folder-form-record-type option").length<2)
																						{
																						$("#new-folder-form-record-type").attr("readonly", true)
																						}
																					else
																						{
																						$("#new-folder-form-record-type").attr("readonly", false)
																						}
																					}										
																				})
																			.fail(function(result)
																				{
																				// Do something
																				})
																	   }
																	else
																		{
																		$("#new-folder-form-record-type").append("<option>" + recordTypeName + "</option>")
																		if($("#new-folder-form-record-type option").length<2)
																			{
																			$("#new-folder-form-record-type").attr("readonly", true)

																			}
																		else
																			{
																			$("#new-folder-form-record-type").attr("readonly", false)
																			}	
																		}
																	}
																}															
															})
														.fail(function(result)
															{
															// Do something
															})
													} // end of onlyRecordTypeCount==0; i.e. the selected classification does not have an Only Record Types rule configured.
												helperSelectRecordType("classification").then(function()
													{
													deferredObject.resolve();	
													})
												}											
											})
										.fail(function(result)
											{
											// Do something
											})
							   		})(i);
								} // end of outer for loop							
							})
						.fail(function(result)
							{
							// Do something
							})
					break;
				case "folder-intermediate":
					if(config.ByListContainmentRules.UseApplicationConfig=="true")
						{
						var data = 	{
									"q" : parentNodeUri,
									"Properties" : "RecordTitle, RecordRecordType",
									"TrimType" : "Record"
									}
						var result = searchAPI(data)
							.then(function(result)
								{
								$("#new-sub-folder-form-record-type").html("")
								for(i=0; i<config.ByListContainmentRules.Mappings.length; i++)
									{
									if(config.ByListContainmentRules.Mappings[i].ParentRecordType==result.Results[0].RecordRecordType.RecordTypeName.Value)
										{
										for(x=0; x<config.ByListContainmentRules.Mappings[i].ContentRecordTypes.length; x++)
											{
											$("#new-sub-folder-form-record-type").append("<option>" + config.ByListContainmentRules.Mappings[i].ContentRecordTypes[x] + "</option>")	
											}
										}
									}
								if($("#new-sub-folder-form-record-type option").length<2)
									{
									$("#new-sub-folder-form-record-type").attr("readonly", "true")
									}
								else
									{
									$("#new-sub-folder-form-record-type").attr("readonly", false)
									}
								helperSelectRecordType("folder-intermediate").then(function()
									{
									deferredObject.resolve();	
									})	
								})
							.fail(function(result)
								{
								// Do something
								})
						}
					else
						{
						var url = baseUrl + apiPath + "/Search"
						var data = 	{
									"q" : "all",
									"Properties" : "RecordTypeName, RecordTypeContainerRule, RecordTypeUsualBehaviour",
									"TrimType" : "RecordType"
									}
						var result = searchAPI(data)
							.then(function(result)
								{
								$("#new-sub-folder-form-record-type").html("")
								for(i=0; i<result.Results.length; i++)
									{
									if(result.Results[i].RecordTypeContainerRule.Value!="Prevented")
										{
										var exclude = false;
										for(x=0; x<config.ExcludedRecordTypes.length; x++)
											{
											if(result.Results[i].RecordTypeName.Value==config.ExcludedRecordTypes[x])
												{
												exclude = true;
												}
											}
										if(!exclude)
											{
											$("#new-sub-folder-form-record-type").append("<option>" + result.Results[i].RecordTypeName.Value + "</option>")		
											}
										}
									}
									helperSelectRecordType("folder-intermediate").then(function()
										{
										deferredObject.resolve();	
										})
								})
							.fail(function(result)
								{
								// Do something
								})
						}
					break;
				case "folder-terminal":
					$("#upload-form-record-title").val("")
					$("#upload-form-record-type").html("")
					if(config.ByListContainmentRules.UseApplicationConfig=="true")
					   {
						var url = baseUrl + apiPath + "/Search"
						var data = 	{
									"q" : parentNodeUri,
									"Properties" : "RecordTitle, RecordRecordType",
									"TrimType" : "Record" 
									}
						var result = searchAPI(data)
							.then(function(result)
								{
								$("#upload-form-record-type").html("")
								for(i=0; i<config.ByListContainmentRules.Mappings.length; i++)
									{
									if(config.ByListContainmentRules.Mappings[i].ParentRecordType==result.Results[0].RecordRecordType.RecordTypeName.Value)
										{
										for(x=0; x<config.ByListContainmentRules.Mappings[i].ContentRecordTypes.length; x++)
											{
											$("#upload-form-record-type").append("<option>" + config.ByListContainmentRules.Mappings[i].ContentRecordTypes[x] + "</option>")	
											}
										}
									}
								if($("#upload-form-record-type option").length<2)
									{
									$("#upload-form-record-type").attr("readonly", "true")
									}
								else
									{
									$("#upload-form-record-type").attr("readonly", false)
									}
								deferredObject.resolve();
								})
							.fail(function(result)
								{
								// Do something
								})

					   }
					else
					   {
						var data =	{
									"q" : "usable",
									"Properties" : "RecordTypeName, RecordTypeUsualBehaviour, RecordTypeContainerRule",
									"TrimType" : "RecordType"
									}
						var result = searchAPI(data)
							.then(function(result)
								{
								for(i=0; i<result.Results.length;i++)
									{
									if(result.Results[i].RecordTypeContainerRule.Value!="Prevented")
										{
										var exclude = false;
										for(x=0; x<config.ExcludedRecordTypes.length; x++)
											{
											if(result.Results[i].RecordTypeName.Value==config.ExcludedRecordTypes[x])
												{
												exclude = true;
												}
											}
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
								else
									{
									$("#upload-form-record-type").attr("readonly", false)
									}
								deferredObject.resolve();
								})
							.fail(function(result)
								{
								// Do something
								})
					   }
						break;
					}
				}
			else
				{
				displaySessionExpiredModal()
				deferredObject.resolve();
				}
		})
		return deferredObject.promise();
	}

function helperSelectRecordType(type)
	{
	var deferredObject = $.Deferred();
	switch(type)
		{
		case "classification":
			$('select[id=new-folder-form-record-type] option:nth-child(1)').selected = true;			
			break;
		case "folder-intermediate":
			$('select[id=new-sub-folder-form-record-type] option:nth-child(1)').selected = true;			
			break;
		case "folder-terminal":
			// Do something
			break;
		}
	deferredObject.resolve();
	return deferredObject.promise();
	}

function clearForm(form)
	{
	switch(form)
		{
		case "new-folder-form":
			$("[id^=new-folder-form-page-item-]").val("")
			break;
		case "new-sub-folder-form":
			$("[id^=new-folder-form-page-item-]").val("")
			break;
		case "upload-form":
			$("#dropped-file-filetype-icon").removeClass()
			$("#dropped-file-filetype-icon").addClass("fiv-viv")
			$("#dropped-file-filetype-icon").addClass("fiv-icon-blank")
			$("#dropped-file-name").html("")
			$("#file-details-container").css("display", "none")
			$("#browse-button-container").css("display", "inline-block")
			$("#drop-zone").removeData("file")
			resetFileInput("#upload-form-file")
			$("[id^=upload-form-page-item-]").val("")
			break;
		}
	}

function resetFileInput(id)
	{
	$(id).wrap("<form>").closest("form").get(0).reset();
	}


function hideNewRecordForms()
	{
	$("#new-folder-form-container").addClass("new-folder-form-hidden")
	$("#new-sub-folder-form-container").addClass("new-sub-folder-form-hidden")
	$("#upload-form-container").addClass("upload-form-hidden")
	}

// END RIGHT PANEL //

// 5. PROPERTIES PANEL //

function drawPropertiesTable(type)
	{
	$("#properties-pane").css("display", "block")
	switch(type)
		{
		case "classification":
			var tableHTML = '<table class="table table-dark table-sm"><thead><tr><th colspan="3">Classification Properties</th></tr></thead><tbody>'
			if(config.PropertiesPane.Classification.Core.ClassificationIdNumber=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Number</td><td id="properties-classification-number"></td><td></td></tr>'
				}
			if(config.PropertiesPane.Classification.Core.ClassificationTitle=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Classification Title</td><td id="properties-classification-title"></td><td></td></tr>'
				}
			if(config.PropertiesPane.Classification.Core.ClassificationAccessControl=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Access Control</td><td id="properties-classification-access-control"></td></tr>'
				}
			break;
		case "folder-intermediate":
			var tableHTML = '<table class="table table-dark table-sm"><thead><tr><th colspan="3">Folder Properties</th></tr></thead><tbody>'
			if(config.PropertiesPane.IntermediateFolder.Core.RecordNumber=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Record Number</td><td id="properties-record-number"></td><td></td></tr>'
				}
			if(config.PropertiesPane.IntermediateFolder.Core.RecordTitle=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Record Title</td><td id="properties-record-title"></td><td id="properties-edit-record-title" class="edit-properties-link"><a href="#">Edit</a></td></tr>'
				}
			if(config.PropertiesPane.IntermediateFolder.Core.RecordClassification=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Classification</td><td id="properties-classification"></td><td></td></tr>'	
				}
			if(config.PropertiesPane.IntermediateFolder.Core.RecordRecordType=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Record Type</td><td id="properties-record-type"></td><td></td></tr>'
				}
			if(config.PropertiesPane.IntermediateFolder.Core.RecordDateRegistered=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Date Registered</td><td id="properties-date-registered"></td></tr>'
				}
			if(config.PropertiesPane.IntermediateFolder.Core.RecordAccessControl=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Access Control</td><td id="properties-access-control"></td><td></td></tr>'	
				}
			if(config.PropertiesPane.IntermediateFolder.Core.RecordDestructionDate=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:20%;padding-left:30px;">Date Due for Destruction</td><td id="properties-date-due-for-destruction"></td><td></td></tr><tr>'
				}
			break;
		case "folder-terminal":
			var tableHTML = '<table class="table table-dark table-sm"><thead><tr><th colspan="3">Folder Properties</th></tr></thead><tbody>'
			if(config.PropertiesPane.TerminalFolder.Core.RecordNumber=="true")
				{
				tableHTML = tableHTML +	'<tr><td scope="row" style="width:25%;padding-left:30px;">Record Number</td><td id="properties-record-number"></td><td></td></tr>'
				}
			if(config.PropertiesPane.TerminalFolder.Core.RecordTitle=="true")
				{
				tableHTML = tableHTML +	'<tr><td scope="row" style="width:25%;padding-left:30px;">Record Title</td><td id="properties-record-title"></td><td id="properties-edit-record-title" class="edit-properties-link"><a href="#">Edit</a></td></tr>'
				}
		if(config.PropertiesPane.TerminalFolder.Core.RecordContainer=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Container</td><td id="properties-container"></td><td></td></tr>'
				}
			if(config.PropertiesPane.TerminalFolder.Core.RecordRecordType=="true")
				{
				tableHTML = tableHTML +	'<tr><td scope="row" style="width:25%;padding-left:30px;">Record Type</td><td id="properties-record-type"></td><td></td></tr>'
				}
			if(config.PropertiesPane.TerminalFolder.Core.RecordDateRegistered=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Date Registered</td><td id="properties-date-registered"></td><td></td></tr>'
				}
			if(config.PropertiesPane.TerminalFolder.Core.RecordAccessControl=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Access Control</td><td id="properties-access-control"></td><td></td></tr>'
				}
			if(config.PropertiesPane.TerminalFolder.Core.RecordDestructionDate=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:20%;padding-left:30px;">Date Due for Destruction</td><td id="properties-date-due-for-destruction"></td><td></td></tr><tr>'	
				}
			break;
		case "document":
			var tableHTML = '<table class="table table-dark table-sm"><thead><tr><th colspan="3">Document Properties</th></tr></thead><tbody>'
			if(config.PropertiesPane.Document.Core.RecordNumber=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Record Number</td><td id="properties-record-number"></td><td></td></tr>'
				}
			if(config.PropertiesPane.Document.Core.RecordTitle=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Record Title</td><td id="properties-record-title"></td><td id="properties-edit-record-title" class="edit-properties-link"><a href="#">Edit</a></td></tr>'
				}
			if(config.PropertiesPane.Document.Core.RecordContainer=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Container</td><td id="properties-container"></td><td></td></tr>'		
				}
			if(config.PropertiesPane.Document.Core.RecordRecordType=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Record Type</td><td id="properties-record-type"></td><td></td></tr>'
				}
			if(config.PropertiesPane.Document.Core.RecordDateRegistered=="true")
				{
				tableHTML = tableHTML +	'<tr><td scope="row" style="width:25%;padding-left:30px;">Date Registered</td><td id="properties-date-registered"></td></tr>'	
				}
			if(config.PropertiesPane.Document.Core.RecordAccessControl=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Access Control</td><td id="properties-access-control"></td><td></td></tr>'	
				}
			if(config.PropertiesPane.Document.Core.RecordDestructionDate=="true")
				{
				tableHTML = tableHTML +	'<tr><td scope="row" style="width:20%;padding-left:30px;">Date Due for Destruction</td><td id="properties-date-due-for-destruction"></td><td></td></tr><tr>'
				}
			break;
		}
	tableHTML = tableHTML + '</tbody></table>'
	$("#properties-pane-logo").remove()
	$("#properties-pane > table").remove()
	$("#properties-pane").append(tableHTML)
	}

function getClassificationProperties(classificationUri)
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			var data =	{
						"q" : classificationUri,
						"Properties" : "ClassificationName, ClassificationTitle, ClassificationIdNumber, AccessControl",
						"TrimType" : "Classification"
						}
			var result = searchAPI(data)
				.then(function(result)
					{
					$("#properties-classification-title").html(result.Results[0].ClassificationTitle.Value)
					$("#properties-classification-number").html(result.Results[0].ClassificationIdNumber.Value)
					$("#properties-classification-access-control").html( parseAccessControlString(result.Results[0].ClassificationAccessControl.Value, "classification").CanUse)
					})
				.fail(function(result)
					{
					// Do something
					})
			}
		else
			{
			displaySessionExpiredModal()
			}
		});
	}

function formatDate(dateTime, inputFormat, outputFormat)
	{
	if(!dateTime.length)
		{
		return "";
		}
	else
		{
		switch(inputFormat)
			{
			case "trimDate":
				day = dateTime.substr(8, 2)
				month = dateTime.substr(5, 2)
				year = dateTime.substr(0, 4)
				break;
			case "tenDigit":
				day = dateTime.substr(0, 2)
				month = dateTime.substr(3, 2)
				year = dateTime.substr(6, 4)
				break;
				case "dd-mmm-yyyy":
				day = dateTime.substr(0, 2)
				month = dateTime.substr(3, 3)
				year = dateTime.substr(7, 4)	
				break;	
			}

		switch(outputFormat) 
			{
			case "dd-mm-yyyy":
				formattedDate = day + "-" + month + "-" + year
				return formattedDate;
				break;
			case "dd-mmm-yyyy":
				switch(month)
					{
					case "01":
						month = "Jan"
						break;
					case "02":
						month = "Feb"
						break;
					case "03":
						month = "Mar"
						break;
					case "04":
						month = "Apr"
						break;
					case "05":
						month = "May"
						break;
					case "06":
						month = "Jun"
						break;
					case "07":
						month = "Jul"
						break;
					case "08":
						month = "Aug"
						break;
					case "09":
						month = "Sep"
						break;
					case "10":
						month = "Oct"
						break;
					case "11":
						month = "Nov"
						break;
					case "12":
						month = "Dec"
						break;
					}
				formattedDate = day + "-" + month + "-" + year
				return formattedDate;
				break;
			case "trimDate":
				formattedDate = year + "-" + month + "-" + day + "T00:00:00.0000000Z"
				return formattedDate;
				break;
			}
		}
	}

function parseAccessControlString(string, type)
	{
	switch(type)
	{
	case "classification":
		var JSONObj = { "CanUse" : "", "CanUpdate" : "", "CanModifyAccess" : "", "CanDelete" : "" }
		JSONObj.CanUse = string.substr(string.search(":")+2, string.search(";")-string.search(":")-2)
		string = string.substr(string.search(";")+2)
		JSONObj.CanUpdate = string.substr(string.search(":")+2, string.search(";")-string.search(":")-2)
		string = string.substr(string.search(";")+2)
		JSONObj.CanModifyAccess = string.substr(string.search(":")+2, string.search(";")-string.search(":")-2)
		string = string.substr(string.search(";")+2)
		JSONObj.Delete = string.substr(string.search(":")+2, string.search(";")-string.search(":")-2)
		break;
	case "record":
		var JSONObj = { "ViewDocument" : "", "ViewMetadata" : "", "UpdateDocument" : "", "UpdateRecordMetadata" : "", "ModifyRecordAccess" : "", "DestroyRecord" : "", "ContributeContents" : "" };
		console.log("Access Controls: ")
		console.log(JSONObj)
			
		JSONObj.ViewDocument = string.substr(string.search(":")+2, string.search(";")-string.search(":")-2)
		string = string.substr(string.search(";")+2)
		JSONObj.ViewMetadata = string.substr(string.search(":")+2, string.search(";")-string.search(":")-2)
		string = string.substr(string.search(";")+2)
		JSONObj.UpdateDocument = string.substr(string.search(":")+2, string.search(";")-string.search(":")-2)
		string = string.substr(string.search(";")+2)		
		JSONObj.UpdateRecordMetadata = string.substr(string.search(":")+2, string.search(";")-string.search(":")-2)
		string = string.substr(string.search(";")+2)
		JSONObj.ModifyRecordAccess = string.substr(string.search(":")+2, string.search(";")-string.search(":")-2)
		string = string.substr(string.search(";")+2)
		JSONObj.DestroyRecord = string.substr(string.search(":")+2, string.search(";")-string.search(":")-2)
		string = string.substr(string.search(";")+2)
		JSONObj.ContributeContents = string.substr(string.search(":")+2)
		break;
		}
		//JSONObj = JSON.parse(JSON.stringify(JSONObj).replace(/<Unrestricted>/g, "<i>[Inherited]</i>"))
		//JSONObj = JSON.parse(JSON.stringify(JSONObj).replace(/[()]/g, ""))
		return JSONObj;
	}


function showRecordCoreFieldValue(record)
	{
	// Record Number
	$("#properties-record-number").html(record.RecordNumber.Value)

	// Record Title
	$("#properties-record-title").html(record.RecordTitle.Value)
	$("#properties-record-title").data("record-uri", record.Uri)
	$("#properties-record-title").data("record-record-type", record.RecordRecordType.RecordTypeName.Value)
	
	// Classification
	if(record.hasOwnProperty("RecordClassification"))
		{
		$("#properties-classification").html(record.RecordClassification.ClassificationTitle.Value)		
		}
		
	// Container
	if(record.hasOwnProperty("RecordContainer"))
		{
		$("#properties-container").html(record.RecordContainer.RecordNumber.Value + ": " + record.RecordContainer.RecordTitle.Value)
		}
		
	// Record Type
	$("#properties-record-type").html(record.RecordRecordType.RecordTypeName.Value)

	// Date Registered
	var dateRegistered = formatDate(record.RecordDateRegistered.DateTime, "trimDate", config.DateFormat) + " at "
	dateRegistered = dateRegistered + record.RecordDateRegistered.DateTime.substr(11, 8)
	$("#properties-date-registered").html(dateRegistered)

	// Access Control
	var accessControlHTML;
	console.log("Access Control String: " + parseAccessControlString(record.RecordAccessControl.Value, "record").ViewMetadata)
	if(parseAccessControlString(record.RecordAccessControl.Value, "record").ViewMetadata!="<Unrestricted>")
		{
		console.log("This is called.")
		accessControlHTML = "<div>View Folder & Contents: " + parseAccessControlString(record.RecordAccessControl.Value, "record").ViewMetadata + "</div>"		
		}
	if(parseAccessControlString(record.RecordAccessControl.Value, "record").UpdateRecordMetadata!="<Unrestricted>")
		{
		accessControlHTML = accessControlHTML + "<div>Update Folder Properties: " + parseAccessControlString(record.RecordAccessControl.Value, "record").UpdateRecordMetadata + "</div>"
		}
	if(parseAccessControlString(record.RecordAccessControl.Value, "record").ContributeContents!="<Unrestricted>")
		{
		accessControlHTML = accessControlHTML + "<div>Add Contents: " + parseAccessControlString(record.RecordAccessControl.Value, "record").ContributeContents + "</div>"	
		}
	console.log(accessControlHTML)
	$("#properties-access-control").html(accessControlHTML)
	
	
	// Date Due for Destruction	
	if(record.RecordDestructionDate.IsClear==false)
		{
		$("#properties-date-due-for-destruction").html(formatDate(record.RecordDestructionDate.DateTime, "trimDate", config.DateFormat))
		}
	}



//  Seems to be a lot of redundant params passed here.

function showRecordAdditionalFieldValue(result, fieldFormat, additionalFieldId, searchClause)
	{
	switch(fieldFormat)
		{
		case "String":
			$("#" + additionalFieldId).html(result.Results[0].Fields[searchClause].Value)
			break;
		case "Number":
			console.log("Number inputs are not yet supported.")
			break;
		case "Boolean":
			console.log("Boolean inputs are not yet supported.")
			break;
		case "Date":
			if(!result.Results[0].Fields[searchClause].IsClear)
				{
				$("#" + additionalFieldId).html(formatDate(result.Results[0].Fields[searchClause].DateTime, "trimDate", config.DateFormat))	
				}
			break;
		case "Datetime":
			console.log("Datetime inputs are not yet supported.")
			break;
		case "Decimal":
			console.log("Decimal inputs are not yet supported.")
			break;
		case "Text":
			console.log("Text inputs are not yet supported.")
			break;
		case "Currency":
			console.log("Currency inputs are not yet supported.")
			break;
		case "Object":
			console.log("Object inputs are not yet supported.")
			break;
		case "BigNumber":
			console.log("BigNumber inputs are not yet supported.")
			break;
		case "Xml":
			console.log("Xml inputs are not yet supported.")
			break;
		case "Geography":
			console.log("Geography inputs are not yet supported.")
			break;
		}	
	}


function showRecordAdditionalFieldName(field, recordTitle, recordType, recordUri)
	{
	switch(field.Format)
		{
		case "String":

			var additionalFieldId = "properties-additional-fields-" + field.Name;

			var additionalPropertyHTML = '<tr><td scope="row" style="width:20%;text-align:left;padding-left:30px;">'

			additionalPropertyHTML = additionalPropertyHTML + field.Caption

			additionalPropertyHTML = additionalPropertyHTML + '</td><td id="' + additionalFieldId + '" style="text-align:left;"></td>'

			additionalPropertyHTML = additionalPropertyHTML + '<td  id="properties-edit-additional-field-' + field.Name + '" class="edit-properties-link"><a href="#">Edit</a></td></tr>'

			$("#properties-pane > table > tbody").append(additionalPropertyHTML)

			$("#" + additionalFieldId).data("record-title", recordTitle)
			$("#" + additionalFieldId).data("record-record-type", recordType)
			$("#" + additionalFieldId).data("record-uri", recordUri)
			$("#" + additionalFieldId).data("field-name", field.Name)
			$("#" + additionalFieldId).data("field-length", field.CharacterLimit)
			$("#" + additionalFieldId).data("field-definition-format", field.Format)
			if(field.hasOwnProperty("LookupValues"))
				{
				$("#" + additionalFieldId).data("is-dropdown", true)
				}

			break;
		case "Number":
			console.log("Number inputs are not yet supported.")
			break;
		case "Boolean":
			console.log("Boolean inputs are not yet supported.")
			break;
		case "Date":
			var additionalFieldId = "properties-additional-fields-" + field.Name;

			var additionalPropertyHTML = '<tr><td scope="row" style="width:20%;text-align:left;padding-left:30px;">'

			additionalPropertyHTML = additionalPropertyHTML + field.Caption

			additionalPropertyHTML = additionalPropertyHTML + '</td><td id="' + additionalFieldId + '" style="text-align:left;"></td>'

			additionalPropertyHTML = additionalPropertyHTML + '<td  id="properties-edit-additional-field-' + field.Name + '" class="edit-properties-link"><a href="#">Edit</a></td></tr>'

			$("#properties-pane > table > tbody").append(additionalPropertyHTML)

			$("#" + additionalFieldId).data("record-title", recordTitle)
			$("#" + additionalFieldId).data("record-record-type", recordType)
			$("#" + additionalFieldId).data("record-uri", recordUri)
			$("#" + additionalFieldId).data("field-name", field.Name)
			$("#" + additionalFieldId).data("field-length", field.CharacterLimit)
			$("#" + additionalFieldId).data("field-definition-format", field.Format)

			break;
		case "Datetime":
			console.log("Datetime inputs are not yet supported.")
			break;
		case "Decimal":
			console.log("Decimal inputs are not yet supported.")
			break;
		case "Text":
			console.log("Text inputs are not yet supported.")
			break;
		case "Currency":
			console.log("Currency inputs are not yet supported.")
			break;
		case "Object":
			console.log("Object inputs are not yet supported.")
			break;
		case "BigNumber":
			console.log("BigNumber inputs are not yet supported.")
			break;
		case "Xml":
			console.log("Xml inputs are not yet supported.")
			break;
		case "Geography":
			console.log("Geography inputs are not yet supported.")
			break;
		}	
	}


function getRecordProperties(type, recordUri)
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			var url = baseUrl + apiPath + "/Search";
			var data = 	{
						"q" : recordUri,
						"Properties" : "RecordTitle, RecordNumber, RecordClassification, RecordContainer, RecordType, DateRegistered, AccessControl, RecordDestructionDate",
						"TrimType" : "Record"
						}
			$.ajax(
				{
				url: url, 
				type: "POST",
				data: JSON.stringify(data),
				contentType: 'application/json',
				xhrFields: { withCredentials: true },
				success: function(selectedRecord)
					{
					// Core Fields
					showRecordCoreFieldValue(selectedRecord.Results[0])
					
					switch(type)
						{
						case "folder-intermediate":
							var additionalFieldsEnabled = config.PropertiesPane.IntermediateFolder.AdditionalFields
							break;
						case "folder-terminal":
							var additionalFieldsEnabled = config.PropertiesPane.TerminalFolder.AdditionalFields
							break;
						case "document":
							var additionalFieldsEnabled = config.PropertiesPane.Document.AdditionalFields
							break;
						}	
					// If Additional Fiels are enabled for in the config file
					if(additionalFieldsEnabled=="true")
						{
						var recordUri = selectedRecord.Results[0].Uri
						var recordTitle = selectedRecord.Results[0].RecordTitle.Value
						var recordType = selectedRecord.Results[0].RecordRecordType.RecordTypeName.Value
						
						url = baseUrl + apiPath + "/Search";
						data = 	{
								"q" : selectedRecord.Results[0].RecordRecordType.RecordTypeName.Value,
								"Properties" : "DataEntryFormDefinition",
								"TrimType" : "RecordType"
								}
						
						$.ajax(
							{
							url: url,
							type: "POST",
							data: JSON.stringify(data),
							contentType: 'application/json',
							xhrFields: { withCredentials: true},
							success: function(selectedRecordType)
								{
								
								for(i=0;i<selectedRecordType.Results[0].DataEntryFormDefinition.Pages.length;i++)
									{
									for(x=0;x<selectedRecordType.Results[0].DataEntryFormDefinition.Pages[i].PageItems.length;x++)	
										{
										(function(index)
										 	{
											if(selectedRecordType.Results[0].DataEntryFormDefinition.Pages[i].PageItems[x].Type=="Field")
												{
												showRecordAdditionalFieldName(selectedRecordType.Results[0].DataEntryFormDefinition.Pages[i].PageItems[x], recordTitle, recordType, recordUri)

												var additionalFieldId = "properties-additional-fields-" + selectedRecordType.Results[0].DataEntryFormDefinition.Pages[i].PageItems[x].Name;
												var searchClause = selectedRecordType.Results[0].DataEntryFormDefinition.Pages[i].PageItems[x].Name;
												var fieldFormat = selectedRecordType.Results[0].DataEntryFormDefinition.Pages[i].PageItems[x].Format;
												url = baseUrl + apiPath + "/Search"
												data = 	{
														"q" : recordUri,
														"Properties" : searchClause,
														"TrimType" : "Record"
														}
												$.ajax(
													{
													url: url,
													data: JSON.stringify(data),
													type: "POST",
													contentType: 'application/json',
													xhrFields: { withCredentials: true },
													success: function(result)
														{
														// add the value to the properties table
														showRecordAdditionalFieldValue(result, fieldFormat, additionalFieldId, searchClause)
														}, 
													error: function(result)
														{
														// Do something
														}
													})	
												}											
											})(x)
										}
									}
								}, 
							error: function(selectedRecordType)
								{
								console.log("Oooops!")
								}
							});	
						}
					}, 
				error: function(selectedRecord)
					{
					// Do something
					}
				});
			}
		else
			{
			displaySessionExpiredModal()
			}
		});
	}

function populateDataEntryFormPages(formName)
	{
	var data = 	{
				"q" : $("#" + formName + "-record-type").val(),
				"Properties" : "DataEntryFormDefinition",
				"TrimType" : "RecordType"
				}
	var result = searchAPI(data)
					.then(function(result)
						{
						$("#" + formName + "-tabs").css("display", "none")
						// These lines are intentionally repeated.
						$("#" + formName + "-tabs").html("")
						$("#" + formName + "-page-items").html("")
						// End repeated lines.
						var dataEntryFormDefinition = result.Results[0].DataEntryFormDefinition
						var html = '<ul class="nav nav-tabs data-entry-form-tabs"></ul>'
						$("#" + formName + "-tabs").append(html)		
						for(i=0;i<dataEntryFormDefinition.Pages.length;i++)
							{
							tabsHtml = '<li class="nav-item"><a class="nav-link" aria-current="page" href="#" data-page-caption="' + dataEntryFormDefinition.Pages[i].Caption + '">' + dataEntryFormDefinition.Pages[i].Caption + '</a></li>'
							pageItemsHtml = '<div id="' + formName + '-page-items-' + dataEntryFormDefinition.Pages[i].Caption + '" style="display:none;"></div>'
							$("#" + formName + "-tabs>ul").append(tabsHtml)
							$("#" + formName + "-page-items").append(pageItemsHtml)
							//$("#" + formName + "-tabs").append("<br>")
							populateDataEntryFormPageItems(dataEntryFormDefinition.Pages[i].Caption, formName)	
							}
						$("#" + formName + "-tabs>ul>li:first>a").addClass("active")
						$("#" + formName + "-page-items>div:first").css("display", "block")
						if(parseInt(dataEntryFormDefinition.Pages.length)>1)
							{
							$("#" + formName + "-tabs").css("display", "block")
							}
						})		
	}



function populateDataEntryFormPageItems(pageCaption, formName)
	{
	var data = 	{
			"q" : $("#" + formName + "-record-type").val(),
			"Properties" : "DataEntryFormDefinition",
			"TrimType" : "RecordType"
			}
		var result = searchAPI(data)
			.then(function(result)
				{
				var dataEntryFormDefinition = result.Results[0].DataEntryFormDefinition
				for(i=0;i<dataEntryFormDefinition.Pages.length;i++)
					{
					if(dataEntryFormDefinition.Pages[i].Caption==pageCaption)
						{
						for(x=0;x<dataEntryFormDefinition.Pages[i].PageItems.length;x++)
							{
							var pageItemsHtml = "";
							if(dataEntryFormDefinition.Pages[i].PageItems[x].Type=="Line")
								{
								pageItemsHtml = '<div style="border-bottom-width:1px;border-bottom-style:solid;border-bottom-color:#000033;margin-top:10px;margin-bottom:10px;"></div>'	
								}
							else
								{
								// 
								optionalHtml=""
								if(!dataEntryFormDefinition.Pages[i].PageItems[x].Mandatory)	
									{
									optionalHtml = '<span style="font-size:1rem">(optional)</span>'
									}
									
								readonlyHtml = ""
								if(dataEntryFormDefinition.Pages[i].PageItems[x].Readonly)	
									{
									readonlyHtml = 'readonly'
									}								
									
								additionalFieldHtml = ""
								if(dataEntryFormDefinition.Pages[i].PageItems[x].Type=="Field")
									{
									additionalFieldHtml = " additional-field"
									}
									
								switch(dataEntryFormDefinition.Pages[i].PageItems[x].Format)
									{
									case "String":
										if(dataEntryFormDefinition.Pages[i].PageItems[x].LookupSetUri)
											{
											//pageItemsHtml = "<p>It's a lookup</p>"
											var pageItemsHtml = '<div class="form-group">'
											pageItemsHtml = pageItemsHtml + '<label for="' + formName + '-page-item-' +  dataEntryFormDefinition.Pages[i].PageItems[x].Name + '" class="display-4" style="color:#000033;font-size:1.25rem;"><span>' + dataEntryFormDefinition.Pages[i].PageItems[x].Caption + ' </span>' + optionalHtml + '</label>'											
											
											//<select id="upload-form-record-type" class="form-control"></select>
											pageItemsHtml = pageItemsHtml + '<select id="' + formName + '-page-item-' +  dataEntryFormDefinition.Pages[i].PageItems[x].Name + '" class="form-control' + additionalFieldHtml + '" maxlength="' + dataEntryFormDefinition.Pages[i].PageItems[x].CharacterLimit + '" ' + readonlyHtml + ' data-pageItem-name="' + dataEntryFormDefinition.Pages[i].PageItems[x].Name + '">'
												
											if(!dataEntryFormDefinition.Pages[i].PageItems[x].Mandatory)
												{
												pageItemsHtml = pageItemsHtml + "<option></option>"
												}
												
											for(y=0;y<dataEntryFormDefinition.Pages[i].PageItems[x].LookupValues.length;y++)
												{
												pageItemsHtml = pageItemsHtml + "<option>" + dataEntryFormDefinition.Pages[i].PageItems[x].LookupValues[y] + "</option>"
												}
											pageItemsHtml = pageItemsHtml + '</select></div>'
											}
										else
											{
											//pageItemsHtml = '<p>' + dataEntryFormDefinition.Pages[i].PageItems[x].Caption + '</p>'
											var pageItemsHtml = '<div class="form-group">'

											pageItemsHtml = pageItemsHtml + '<label for="' + formName + '-page-item-' +  dataEntryFormDefinition.Pages[i].PageItems[x].Name + '" class="display-4" style="color:#000033;font-size:1.25rem;"><span>' + dataEntryFormDefinition.Pages[i].PageItems[x].Caption + ' </span>' + optionalHtml + '</label>'

											pageItemsHtml = pageItemsHtml + '<input id="' + formName + '-page-item-' +  dataEntryFormDefinition.Pages[i].PageItems[x].Name + '" class="form-control' + additionalFieldHtml + '" maxlength="' + dataEntryFormDefinition.Pages[i].PageItems[x].CharacterLimit + '" ' + readonlyHtml + ' data-pageItem-name="' + dataEntryFormDefinition.Pages[i].PageItems[x].Name + '"></div>'
											//$("#" + formName).append(inputHTML)											}
											}
										break;
									case "Number":
										console.log("Number inputs are not yet supported.")
										break;
									case "Boolean":
										console.log("Boolean inputs are not yet supported.")
										break;
									case "Date":
										//pageItemsHtml = '<p>This is a date.</p>'
										var pageItemsHtml = '<div class="form-group">'
										pageItemsHtml = pageItemsHtml + '<label for="' + formName + '-page-item-' +  dataEntryFormDefinition.Pages[i].PageItems[x].Name + '" class="display-4" style="color:#000033;font-size:1.25rem;"><span>' + dataEntryFormDefinition.Pages[i].PageItems[x].Caption + ' </span>' + optionalHtml + '</label>'
											
										pageItemsHtml = pageItemsHtml + '<input type="text" id="' + formName + '-page-item-' +  dataEntryFormDefinition.Pages[i].PageItems[x].Name + '" class="form-control date-input' + additionalFieldHtml + '" data-provide="datepicker" data-date-format="' + config.DatePicker.DateFormat + '" data-date-autoclose="' + config.DatePicker.AutoClose + '" placeholder="' + config.DatePicker.Placeholder + '" data-date-start-date="' + config.DatePicker.StartDate + '" data-date-assume-nearby-year="' + config.DatePicker.AssumeNearbyYear + '" maxlength="' + dataEntryFormDefinition.Pages[i].PageItems[x].CharacterLimit + '" data-pageItem-name="' + dataEntryFormDefinition.Pages[i].PageItems[x].Name + '"></div>'
										break;
									case "Datetime":
										console.log("Datetime inputs are not yet supported.")
										break;
									case "Decimal":
										console.log("Decimal inputs are not yet supported.")
										break;
									case "Text":
										console.log("Text inputs are not yet supported.")
										break;
									case "Currency":
										console.log("Currency inputs are not yet supported.")
										break;
									case "Object":
										//pageItemsHtml = '<p>' + dataEntryFormDefinition.Pages[i].PageItems[x].Caption + '</p>'
										console.log("Object inputs are not yet supported.")
										break;
									case "BigNumber":
										console.log("BigNumber inputs are not yet supported.")
										break;
									case "Xml":
										console.log("Xml inputs are not yet supported.")
										break;
									case "Geography":
										console.log("Geography inputs are not yet supported.")
										break;
									}
								//pageItemsHtml = '<p>' +  + '</p>'		
								}
							
							$("#" + formName + "-page-items-" + dataEntryFormDefinition.Pages[i].Caption).append(pageItemsHtml)
							}
						}
					}
				$("#" + formName + "-container").removeClass(formName + "-hidden")
				})
	}



function showEditPropertiesError(trimError)
	{
	$("#edit-properties-caption").html(trimError)
	$("#edit-properties-ok-button").css("display", "block")
	$("#edit-properties-error").modal("show")
	}

function dismissEditPropertiesError()
	{
	$("#edit-properties-error").modal("hide")
	$(".editing").parent().find("td:nth-child(2)").html($(".editing").parent().find("td:nth-child(2)").data("original-value"))
	$(".editing").parent().find("td:nth-child(3)").html('<a href="#">Edit</a>')
	if($(".editing").parent().find("td:nth-child(2)").data("record-type")=="folder-intermediate")
		{
		$("#new-sub-folder-form-record-title").val("")
		$("#new-sub-folder-form-container").show()
		}
	if($(".editing").parent().find("td:nth-child(2)").data("record-type")=="folder-terminal")
		{
		$("#upload-form-file").remove()
		$("#upload-form-file-label").remove()
		$("#upload-form-file-container").append('<input id="upload-form-file" name="upload" type="file" class="custom-file-input" id="validatedCustomFile"><label id="upload-form-file-label" class="custom-file-label" for="upload-form-file">Choose file...</label>')
		$("#upload-form-record-title").val("")
		$("#upload-form-container").show()
		}
	$(".edit-properties-link > a").css("display", "block")
	}


// END PROPERTIES PANEL //

// 6. CREATE FOLDER //
function createFolder(recordTitle, recordClassificationUri, recordContainerUri, recordType, additionalFieldKeys, additionalFieldValues)
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			var url = baseUrl + apiPath + "/Record"
			var data = {
						"RecordTitle" : recordTitle,
						"RecordRecordType" : recordType,
						"RecordClassification" : recordClassificationUri,
						"RecordContainer" : recordContainerUri,
						"AdditionalFields" : {}
						}
			for(i=0; i<additionalFieldKeys.length; i++)
				{
				data.AdditionalFields[additionalFieldKeys[i]] = additionalFieldValues[i]		
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
					if(recordClassificationUri != null)
						{
						if($("#classification-uri-" + recordClassificationUri + " > span:nth-child(1)").hasClass("expanded"))
							{
							refreshFolderNodes("classification", "classification-uri-" + recordClassificationUri)			
							}
						clearForm("new-folder-form")
						}
					if(recordContainerUri != null)
						{
						if($("#record-uri-" + recordContainerUri + " > span:nth-child(1)").hasClass("expanded"))
							{
							refreshFolderNodes("record", "record-uri-" + recordContainerUri)								
							}
							
						if($("#level-0-search-result-type-uri-" + recordContainerUri).length)
							{
							$("#level-0-search-result-type-uri-" + recordContainerUri).parent().find("ul").remove()
							$("#level-0-search-result-recordNumber-uri-" + recordContainerUri).parent().find("ul").remove()
							$("#level-0-search-result-recordTitle-uri-" + recordContainerUri).parent().find("ul").remove()
							$("#level-0-search-result-recordType-uri-" + recordContainerUri).parent().find("ul").remove()
							$("#level-0-search-result-download-uri-" + recordContainerUri).parent().find("ul").remove()
							expandCollapsedSearchResult(recordContainerUri, parseInt("0"))	
							}
						clearForm("new-sub-folder-form")
						}
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
					if(recordClassificationUri != null)
						{
						clearForm("new-folder-form")
						}
					if(recordContainerUri != null)
						{
						clearForm("new-sub-folder-form")							
						}
					showCreateFolderError(result.responseJSON.ResponseStatus.Message)
					}
				});	
			}
		else
			{
			displaySessionExpiredModal()
			}
		});
	}

// END CREATE FOLDER //

// 7. UPLOAD & REGISTER DOCUMENT //
function uuidv4()
	{
	return ([1e7]+-1e3+-4e3+-8e3+-1e11).replace(/[018]/g, c =>
    (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16));
	}

function getFileExtension(fileName)
	{
	return fileName.slice((fileName.lastIndexOf(".") - 1 >>> 0) + 2);
	}

function uploadFile(fileName, extension, file)
	{
	var deferredObject = $.Deferred();
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			jQuery.ajax(
				{
				url: baseUrl + "/WebDAV/Uploads/" + fileName + "." + extension,
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
					showUploadError()
					}
				});
			}
		else
			{
			displaySessionExpiredModal()
			}
		});
	return deferredObject.promise();
	}

function createRecord(recordTitle, recordType, recordContainerUri, fileName, additionalFieldKeys, additionalFieldValues)
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			var url = baseUrl + apiPath + "/Record"
			var data = {
						"RecordTitle" : recordTitle,
						"RecordRecordType" : recordType,
						"RecordContainer" : recordContainerUri,
						"AdditionalFields" : {}
						}
			for(i=0; i<additionalFieldKeys.length; i++)
				{
				data.AdditionalFields[additionalFieldKeys[i]] = additionalFieldValues[i]		
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
					clearForm("upload-form")
					$("#upload-progress-bar").css("width", "67%")
					attachFileToRecord(result.Results[0].Uri, fileName, recordContainerUri)
					}, 
				error: function(result)
					{
					clearForm("upload-form")
					$("#upload-status-caption").html(result.responseJSON.ResponseStatus.Message)
					showUploadError(result.responseJSON.ResponseStatus.Message)
					}
				});
			}
		else
			{
			displaySessionExpiredModal()
			}
		});
	}

function attachFileToRecord(recordUri, fileName, recordContainerUri)
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			var data = {
						"Uri": recordUri,
						"RecordFilePath": fileName,
						"RecordFinalizeOnSave" : "true"
						}
			var url = baseUrl + apiPath + "/Record"
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
						
					// Clear search results under folder.
					//recordContainerUri
					if($("#level-0-search-result-type-uri-" + recordContainerUri).length)
						{
						$("#level-0-search-result-type-uri-" + recordContainerUri).parent().find("ul").remove()
						$("#level-0-search-result-recordNumber-uri-" + recordContainerUri).parent().find("ul").remove()
						$("#level-0-search-result-recordTitle-uri-" + recordContainerUri).parent().find("ul").remove()
						$("#level-0-search-result-recordType-uri-" + recordContainerUri).parent().find("ul").remove()
						$("#level-0-search-result-download-uri-" + recordContainerUri).parent().find("ul").remove()
						expandCollapsedSearchResult(recordContainerUri, parseInt("0"))	
						}
					
					if($("#level-1-search-result-type-uri-" + recordContainerUri).length)
						{
						$("#level-1-search-result-type-uri-" + recordContainerUri).parent().find("ul").remove()
						$("#level-1-search-result-recordNumber-uri-" + recordContainerUri).parent().find("ul").remove()
						$("#level-1-search-result-recordTitle-uri-" + recordContainerUri).parent().find("ul").remove()
						$("#level-1-search-result-recordType-uri-" + recordContainerUri).parent().find("ul").remove()
						$("#level-1-search-result-download-uri-" + recordContainerUri).parent().find("ul").remove()
						expandCollapsedSearchResult(recordContainerUri, parseInt("1"))
						}
					setTimeout(function()
						{
						$("#upload-status").modal("hide")
						$("#upload-progress-bar").css("width", "0%")
						},
						500);
					}, 
				error: function(result)
					{
					showUploadError()
					}
				});
			}
		else
			{
			displaySessionExpiredModal()
			}
		});
	}

function showUploadError(trimError)
	{
	if(trimError)
		{
		$("#upload-progress-bar").css("width", "100%")
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

function showCreateFolderError(trimError)
	{
	if(trimError)
		{
		$("#create-folder-progress-bar").addClass("bg-danger")
		$("#create-folder-progress-bar").css("width", "100%")
		$("#create-folder-caption").html(trimError)
		$("#create-folder-ok-button").css("display", "block")
		}
	else
		{
		$("#create-folder-progress-bar").addClass("bg-danger")
		$("#create-folder-progress-bar").css("width", "100%")
		$("#create-folder-caption").html("An error has occured during the creationg of the folder.  If the problem persists, please contact GilbyIM support.")
		$("#create-folder-ok-button").css("display", "block")
		}
	}


// END UPLOAD & REGISTER DOCUMENT //


// 8. DOWNLOAD DOCUMENT //
function downloadDocument(recordUri, recordTitle, recordExtension, recordMimeType)
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			gtag('event', 'Download Document');
			var url = baseUrl + apiPath + "/Record/" + recordUri + "/File/Document?SuppressLastAction=false"
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
					// Do something
					}
				});
			}
		else
			{
			displaySessionExpiredModal()
			}
		});
	}

// END DOWNLOAD DOCUMENT //

// 9. MSICELLANEOUS //



function searchAPI(data) {
    var deferredObject = $.Deferred();
	var url = baseUrl + apiPath + "/Search"
	$.ajax(
		{
		url: url,
		data: JSON.stringify(data),
		type: "POST",
		contentType: 'application/json',
		xhrFields: { withCredentials: true },
		success: function(result)
			{
			deferredObject.resolve(result);
			}, 
		error: function(result)
			{
			console.log(result)
			deferredObject.reject(result);
			}
		});	
    return deferredObject;
}

function showLoadingSpinner() 
	{
	$("#loading").modal('show');
	}

function hideLoadingSpinner() 
	{
	setTimeout(function()
		{
  		$("#loading").modal('hide');
		},
		300); // this delay ensure the modal has properly been show before attempting to hide it.
	}

function isValidDate(dateString)
	{
		// First check for the pattern
		if(!/^(\d{2}|\d{1})[\-\s\/](\d{2}|\d{1})[\-\s\/](\d{4}|\d{2})$/.test(dateString))
			{
			return false;				
			}
		// Parse the date parts to integers
		if(dateString.includes("/"))
			{
			var parts = dateString.split("/");				
			}
		if(dateString.includes("-"))
			{
			var parts = dateString.split("-");				
			}
		if(dateString.includes(" "))
			{
			var parts = dateString.split(" ");				
			}
		if(parts.length!=3)
			{
			return false;
			}
		
		var day = parseInt(parts[0], 10);
		var month = parseInt(parts[1], 10);
		//var year = parseInt(parts[2], 10);
		var year = parts[2];

		if(year<100)
			{
			var today = new Date();
			var nearbyDateThisCentury = parseInt(today.getFullYear().toString().substr(0, 2) + year)
			var nearbyDateLastCentury = parseInt((today.getFullYear()-100).toString().substr(0, 2) + year)
			var nearbyDateNextCentury = parseInt((today.getFullYear()+100).toString().substr(0, 2) + year)
			deltaLastCentury = today.getFullYear() - nearbyDateLastCentury
			deltaNextCentury = nearbyDateNextCentury - today.getFullYear()
			if(nearbyDateThisCentury>today.getFullYear()) // it's in the future
				{
				deltaThisCentury = nearbyDateThisCentury - today.getFullYear()
				}
			else
				{
				deltaThisCentury = today.getFullYear() - nearbyDateThisCentury
				}
			if(deltaLastCentury<deltaNextCentury && deltaLastCentury<deltaThisCentury)
				{
				year = nearbyDateLastCentury
				}
			else if(deltaNextCentury<deltaLastCentury && deltaNextCentury<deltaThisCentury)
				{
				year = nearbyDateNextCentury
				}
			else if(deltaThisCentury<deltaLastCentury && deltaThisCentury<deltaLastCentury)
				{
				year = nearbyDateThisCentury
				}
			else if(deltaThisCentury==deltaLastCentury)
				{
				year = nearbyDateLastCentury
				}
			else if(deltaThisCentury==deltaNextCentury)
				{
				year = nearbyDateThisCentury
				}			
			}
		else
			{
			var year = parseInt(parts[2], 10)	
			}
		
		// Check the ranges of month and year
		if(year < 1000 || year > 3000 || month == 0 || month > 12)
			{
			return false;
			}

		var monthLength = [ 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31 ];
		
		// Adjust for leap years
		if(year % 400 == 0 || (year % 100 != 0 && year % 4 == 0))
			monthLength[1] = 29;

		// Check the range of the day
		if(day > 0 && day <= monthLength[month - 1])
			{
			if(day<10)
				{
				day = "0" + day
				}
			if(month<10)
				{
				month = "0" + month
				}
			return day + "-" + month + "-" + year;					
			}
	};

// END MSICELLANEOUS //