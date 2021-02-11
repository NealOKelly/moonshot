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


// 1. AUTHENTICATION & SESSION MANAGEMENT //
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
		iFrame.attr('src', baseUrl + apiPath + "/help/index");
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
			}
		});
		return deferredObject.promise();
	}

function displaySessionExpiredModal()
	{
	$("#loading").modal("hide")		
	$("#connection-failed").modal("hide")
	$("#create-folder-status").modal("hide")
	$("#upload-form-container").modal("hide")
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
	$.cookie("FedAuth", null, { expires: -1, path: "/CMServiceAPI/"} )
	$.cookie("FedAuth", null, { expires: -1, path: "/CMServiceAPI/"} )
	}

// END AUTHENTICATION & SESSION MANAGEMENT //

// 2. CLASSIFICATION & FOLDER TREE //

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
						console.log("Oooops!")
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

							})
						.fail(function(result)
							{
							displaySessionExpiredModal()
							})
					}, 
				error: function(result)
					{
					console.log("Oooops!")
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
	$("#" + parentNodeId + " > ul").append("<li id='record-uri-" + recordUri + "' class='folder-terminal'><span class='collapsed'></span><span class='folder-fill'></span><span class='record-title'><a>" + recordTitle + "</a></span></li>")

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
				$("#new-sub-folder-form-record-container").data("recordUri", result.Results[0].Uri)	
				break;
			case "folder-terminal":
				$("#upload-form-record-container").val("")
				$("#upload-form-record-container").val(result.Results[0].RecordNumber.Value + ": " + result.Results[0].RecordTitle.Value)
				$("#upload-form-record-container").data("recordUri", result.Results[0].Uri)	
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
								// The GilbyIM Lite application requires folders (that can attach to classifications) to configured so they cannot be contained by other records.
								if(result.Results[i].RecordTypeContainerRule.Value=="Prevented")
								   	{
									intermediateFolderRecordTypeUris.push(result.Results[i].Uri)
									intermediateFolderRecordTypeNames.push(result.Results[i].RecordTypeName.Value)
								   	}
								}
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

function getRecordTypeProperties()
	{
	var deferredObject = $.Deferred();	
	deferredObject.resolve("Hello World.")
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
			console.log("Document")
			break;
		}
	deferredObject.resolve();
	return deferredObject.promise();
	}

function populateAdditionalFields(parentNodeType)
	{
	var deferredObject = $.Deferred();
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			var data = 	{
						"q" : "all",
						"Properties" : "FieldDefinitionName, FieldDefinitionIsUsedByRecordTypes, FieldDefinitionFormat, FieldDefinitionSearchClause, FieldDefinitionLength",
						"TrimType" : "FieldDefinition",
						"PageSize" : "1000"
						}
			var result = searchAPI(data)
				.then(function(result)
					{
					switch(parentNodeType)
						{
						case "classification":
							var formName = "new-folder-form";
							$("#" + formName + " .additional-field").remove()
							break;
						case "folder-intermediate":
							var formName = "new-sub-folder-form";
							$("#" + formName + " .additional-field").remove()
							break;
						case "folder-terminal":
							var formName = "upload-form";
							$("#" + formName + " .additional-field").remove()
							break;
						}

						for(i=0; i<result.TotalResults; i++)
							{
							if(result.Results[i].FieldDefinitionIsUsedByRecordTypes.Value.includes($("#"+ formName + "-record-type").val()))
								{
								switch(result.Results[i].FieldDefinitionFormat.Value)
									{
									case "String":
										var inputHTML = '<div class="form-group additional-field" data-search-clause-name="' + result.Results[i].FieldDefinitionSearchClause.Value + '">'
										
										inputHTML = inputHTML + '<label for="' + formName + '-additional-field-' + result.Results[i].FieldDefinitionSearchClause.Value + '" class="display-4" style="color:#000033;font-size:1.25rem;"><span>' + result.Results[i].FieldDefinitionName.Value + ' </span><span style="font-size:1rem">(optional)</span></label>'
											
										inputHTML = inputHTML + '<input id="'+ formName + '-additional-field-' + result.Results[i].FieldDefinitionSearchClause.Value + '" class="form-control" maxlength="' + result.Results[i].FieldDefinitionLength.Value + '"></div>'
										$("#" + formName).append(inputHTML)
										break;
									case "Number":
										console.log("Number inputs are not yet supported.")
										break;
									case "Boolean":
										console.log("Boolean inputs are not yet supported.")
										break;
									case "Date":
										console.log("Date inputs are not yet supported.")
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
						if(i==(result.TotalResults-1))
							{
							deferredObject.resolve();	
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
			displaySessionExpiredModal()
			deferredObject.resolve();
			}
		});
		return deferredObject.promise();
	}

function clearForm(form)
	{
	switch(form)
		{
		case "new-folder-form":
			$("#new-folder-form-record-title").val("")
			$("#new-folder-form > .additional-field > input").val("")
			break;
		case "new-sub-folder-form":
			$("#new-sub-folder-form-record-title").val("")
			$("#new-sub-folder-form > .additional-field > input").val("")
			break;
		case "upload-form":
			$("#upload-form-record-title").val("")
			$("#upload-form-record-type").val("")
			$("#upload-form > .additional-field > input").val("")
			break;
		}
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
			var tableHTML = '<table class="table table-dark table-sm"><thead><tr><th>Classification Properties</th><th></th></tr></thead><tbody>'
			if(config.PropertiesPane.Classification.Core.ClassificationIdNumber=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Number</td><td id="properties-classification-number"></td></tr>'
				}
			if(config.PropertiesPane.Classification.Core.ClassificationTitle=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Classification Title</td><td id="properties-classification-title"></td></tr>'
				}
			if(config.PropertiesPane.Classification.Core.ClassificationAccessControl=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Access Control</td><td id="properties-classification-access-control"></td></tr>'
				}
			break;
		case "folder-intermediate":
			var tableHTML = '<table class="table table-dark table-sm"><thead><tr><th>Folder Properties</th><th></th></tr></thead><tbody>'
			if(config.PropertiesPane.IntermediateFolder.Core.RecordNumber=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Record Number</td><td id="properties-record-number"></td></tr>'
				}
			if(config.PropertiesPane.IntermediateFolder.Core.RecordClassification=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Classification</td><td id="properties-classification"></td></tr>'	
				}
			if(config.PropertiesPane.IntermediateFolder.Core.RecordRecordType=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Record Type</td><td id="properties-record-type"></td></tr>'
				}
			if(config.PropertiesPane.IntermediateFolder.Core.RecordDateRegistered=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Date Registered</td><td id="properties-date-registered"></td></tr>'
				}
			if(config.PropertiesPane.IntermediateFolder.Core.RecordAccessControl=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Access Control</td><td id="properties-access-control"></td></tr>'	
				}
			if(config.PropertiesPane.IntermediateFolder.Core.RecordDestructionDate=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:20%;padding-left:30px;">Date Due for Destruction</td><td id="properties-date-due-for-destruction"></td></tr><tr>'
				}
			break;
		case "folder-terminal":
			var tableHTML = '<table class="table table-dark table-sm"><thead><tr><th>Folder Properties</th><th></th></tr></thead><tbody>'
			if(config.PropertiesPane.TerminalFolder.Core.RecordNumber=="true")
				{
				tableHTML = tableHTML +	'<tr><td scope="row" style="width:25%;padding-left:30px;">Record Number</td><td id="properties-record-number"></td></tr>'
				}
			if(config.PropertiesPane.TerminalFolder.Core.RecordContainer=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Container</td><td id="properties-container"></td></tr>'
				}
			if(config.PropertiesPane.TerminalFolder.Core.RecordRecordType=="true")
				{
				tableHTML = tableHTML +	'<tr><td scope="row" style="width:25%;padding-left:30px;">Record Type</td><td id="properties-record-type"></td></tr>'
				}
			if(config.PropertiesPane.TerminalFolder.Core.RecordDateRegistered=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Date Registered</td><td id="properties-date-registered"></td></tr>'
				}
			if(config.PropertiesPane.TerminalFolder.Core.RecordAccessControl=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Access Control</td><td id="properties-access-control"></td></tr>'
				}
			if(config.PropertiesPane.TerminalFolder.Core.RecordDestructionDate=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:20%;padding-left:30px;">Date Due for Destruction</td><td id="properties-date-due-for-destruction"></td></tr><tr>'	
				}
			break;
		case "document":
			var tableHTML = '<table class="table table-dark table-sm"><thead><tr><th>Document Properties</th><th></th></tr></thead><tbody>'
			if(config.PropertiesPane.Document.Core.RecordNumber=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Record Number</td><td id="properties-record-number"></td></tr>'
				}
			if(config.PropertiesPane.Document.Core.RecordContainer=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Container</td><td id="properties-container"></td></tr>'		
				}
			if(config.PropertiesPane.Document.Core.RecordRecordType=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Record Type</td><td id="properties-record-type"></td></tr>'
				}
			if(config.PropertiesPane.Document.Core.RecordDateRegistered=="true")
				{
				tableHTML = tableHTML +	'<tr><td scope="row" style="width:25%;padding-left:30px;">Date Registered</td><td id="properties-date-registered"></td></tr>'	
				}
			if(config.PropertiesPane.Document.Core.RecordAccessControl=="true")
				{
				tableHTML = tableHTML + '<tr><td scope="row" style="width:25%;padding-left:30px;">Access Control</td><td id="properties-access-control"></td></tr>'	
				}
			if(config.PropertiesPane.Document.Core.RecordDestructionDate=="true")
				{
				tableHTML = tableHTML +	'<tr><td scope="row" style="width:20%;padding-left:30px;">Date Due for Destruction</td><td id="properties-date-due-for-destruction"></td></tr><tr>'
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

function formatDate(dateTime, format)
	{
	day = dateTime.substr(8, 2)
	month = dateTime.substr(5, 2)
	year = dateTime.substr(0, 4)
	switch(format) 
		{
		case "dd-mm-yyyy":
			// do something
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
					month = "Nov"
					break;
				}
			break;
		}
		formattedDate = day + "-" + month + "-" + year
		return formattedDate;	
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
		JSONObj = JSON.parse(JSON.stringify(JSONObj).replace(/<Unrestricted>/g, "<i>[Inherited]</i>"))
		JSONObj = JSON.parse(JSON.stringify(JSONObj).replace(/[()]/g, ""))
		return JSONObj;
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
						"Properties" : "RecordTitle, RecordNumber, Classification, RecordContainer, RecordType, DateRegistered, AccessControl, RecordDestructionDate",
						"TrimType" : "Record"
						}
			var result = searchAPI(data)
				.then(function(result)
					{
					
					
					})
				.fail(function(result)
					{
					// Do something
					})
			$.ajax(
				{
				url: url, 
				type: "POST",
				data: JSON.stringify(data),
				contentType: 'application/json',
				xhrFields: { withCredentials: true},
				success: function(result)
					{
					var details = JSON.stringify(result);
					var dateRegistered = formatDate(result.Results[0].RecordDateRegistered.DateTime, config.DateFormat) + " at "
					dateRegistered= dateRegistered + result.Results[0].RecordDateRegistered.DateTime.substr(11, 8)
					switch(type)
						{
						case "folder-intermediate":
							$("#properties-record-number").html(result.Results[0].RecordNumber.Value)
							$("#properties-classification").html(result.Results[0].RecordClassification.ClassificationTitle.Value)
							$("#properties-record-type").html(result.Results[0].RecordRecordType.RecordTypeName.Value)
							$("#properties-date-registered").html(dateRegistered)
							
							// access controls
							var accessControlHTML = "<div>View Folder & Contents: " + parseAccessControlString(result.Results[0].RecordAccessControl.Value, "record").ViewMetadata + "</div>"
							var accessControlHTML = accessControlHTML + "<div>Update Folder Properties: " + parseAccessControlString(result.Results[0].RecordAccessControl.Value, "record").UpdateRecordMetadata + "</div>"
							var accessControlHTML = accessControlHTML + "<div>Add Contents: " + parseAccessControlString(result.Results[0].RecordAccessControl.Value, "record").ContributeContents + "</div>"
							$("#properties-access-control").html(accessControlHTML)
							if(result.Results[0].RecordDestructionDate.IsClear==false)
								{
								$("#properties-date-due-for-destruction").html(formatDate(result.Results[0].RecordDestructionDate.DateTime, config.DateFormat))
								}
							if(config.PropertiesPane.IntermediateFolder.AdditionalFields=="true")
								{
								var recordUri = result.Results[0].Uri
								var recordType = result.Results[0].RecordRecordType.RecordTypeName.Value
								var url = baseUrl + apiPath + "/Search"
								var data = 	{
											"q" : "all",
											"Properties" : "FieldDefinitionName, FieldDefinitionIsUsedByRecordTypes, FieldDefinitionFormat, FieldDefinitionSearchClause, FieldDefinitionLength",
											"TrimType" : "FieldDefinition",
											"PageSize" : "1000"
											}
								var result = searchAPI(data)
									.then(function(result)
										{
										for(i=0; i<result.TotalResults; i++)
											{
											(function(index)
												{
												if(result.Results[i].FieldDefinitionIsUsedByRecordTypes.Value.includes(recordType))
													{
													var fieldFormat = result.Results[i].FieldDefinitionFormat.Value
													
													switch(fieldFormat)
														{
														case "String":
															var additionalFieldId = "properties-additional-fields-" + result.Results[i].FieldDefinitionSearchClause.Value;
												
															var additionalPropertyHTML = '<tr><td scope="row" style="width:20%;text-align:left;padding-left:30px;">'

															additionalPropertyHTML = additionalPropertyHTML + result.Results[i].FieldDefinitionName.Value

															additionalPropertyHTML = additionalPropertyHTML + '</td><td id="' + additionalFieldId + '" style="text-align:left;"></td></tr><tr>'

															$("#properties-pane > table > tbody").append(additionalPropertyHTML)
															break;
														case "Number":
															console.log("Number inputs are not yet supported.")
															break;
														case "Boolean":
															console.log("Boolean inputs are not yet supported.")
															break;
														case "Date":
															var additionalFieldId = "properties-additional-fields-" + result.Results[i].FieldDefinitionSearchClause.Value;
												
															var additionalPropertyHTML = '<tr><td scope="row" style="width:20%;text-align:left;padding-left:30px;">'

															additionalPropertyHTML = additionalPropertyHTML + result.Results[i].FieldDefinitionName.Value

															additionalPropertyHTML = additionalPropertyHTML + '</td><td id="' + additionalFieldId + '" style="text-align:left;"></td></tr><tr>'

															$("#properties-pane > table > tbody").append(additionalPropertyHTML)
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

													var searchClause = result.Results[i].FieldDefinitionSearchClause.Value;
													var url = baseUrl + apiPath + "/Search?q=" + recordUri + "&properties=" + searchClause + "&TrimType=Record"
													$.ajax(
														{
														url: url,
														type: "POST",
														contentType: 'application/json',
														xhrFields: { withCredentials: true},
														success: function(result)
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
																		$("#" + additionalFieldId).html(formatDate(result.Results[0].Fields[searchClause].DateTime, config.DateFormat))	
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
															}, 
														error: function(result)
															{
															console.log("Oooops!")
															}
														})	
													}
											})(i)}
										})
									.fail(function(result)
										{
										// Do something
										})
								}
							break;
						case "folder-terminal":
							$("#properties-record-number").html(result.Results[0].RecordNumber.Value)
							$("#properties-container").html(result.Results[0].RecordContainer.RecordNumber.Value + ": " + result.Results[0].RecordContainer.RecordTitle.Value)
							$("#properties-record-type").html(result.Results[0].RecordRecordType.RecordTypeName.Value)
							$("#properties-date-registered").html(dateRegistered)
							
							// access controls
							var accessControlHTML = "<div>View Folder & Contents: " + parseAccessControlString(result.Results[0].RecordAccessControl.Value, "record").ViewMetadata + "</div>"
							var accessControlHTML = accessControlHTML + "<div>Update Properties: " + parseAccessControlString(result.Results[0].RecordAccessControl.Value, "record").UpdateRecordMetadata + "</div>"
							var accessControlHTML = accessControlHTML + "<div>Add Contents: " + parseAccessControlString(result.Results[0].RecordAccessControl.Value, "record").ContributeContents + "</div>"
							$("#properties-access-control").html(accessControlHTML)
								
							if(result.Results[0].RecordDestructionDate.IsClear==false)
								{
								$("#properties-date-due-for-destruction").html(formatDate(result.Results[0].RecordDestructionDate.DateTime, config.DateFormat))
								}
								
							if(config.PropertiesPane.IntermediateFolder.AdditionalFields=="true")
								{
								var recordUri = result.Results[0].Uri
								var recordType = result.Results[0].RecordRecordType.RecordTypeName.Value
								var url = baseUrl + apiPath + "/Search"
								var data = 	{
											"q" : "all",
											"Properties" : "FieldDefinitionName, FieldDefinitionIsUsedByRecordTypes, FieldDefinitionFormat, FieldDefinitionSearchClause, FieldDefinitionLength",
											"TrimType" : "FieldDefinition",
											"PageSize" : "1000"
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
										for(i=0; i<result.TotalResults; i++)
											{
											(function(index)
												{
												if(result.Results[i].FieldDefinitionIsUsedByRecordTypes.Value.includes(recordType))
													{
													var fieldFormat = result.Results[i].FieldDefinitionFormat.Value
													
													switch(fieldFormat)
														{
														case "String":
															var additionalFieldId = "properties-additional-fields-" + result.Results[i].FieldDefinitionSearchClause.Value;
												
															var additionalPropertyHTML = '<tr><td scope="row" style="width:20%;text-align:left;padding-left:30px;">'

															additionalPropertyHTML = additionalPropertyHTML + result.Results[i].FieldDefinitionName.Value

															additionalPropertyHTML = additionalPropertyHTML + '</td><td id="' + additionalFieldId + '" style="text-align:left;"></td></tr><tr>'

															$("#properties-pane > table > tbody").append(additionalPropertyHTML)
															break;
														case "Number":
															console.log("Number inputs are not yet supported.")
															break;
														case "Boolean":
															console.log("Boolean inputs are not yet supported.")
															break;
														case "Date":
															var additionalFieldId = "properties-additional-fields-" + result.Results[i].FieldDefinitionSearchClause.Value;
												
															var additionalPropertyHTML = '<tr><td scope="row" style="width:20%;text-align:left;padding-left:30px;">'

															additionalPropertyHTML = additionalPropertyHTML + result.Results[i].FieldDefinitionName.Value

															additionalPropertyHTML = additionalPropertyHTML + '</td><td id="' + additionalFieldId + '" style="text-align:left;"></td></tr><tr>'

															$("#properties-pane > table > tbody").append(additionalPropertyHTML)
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

													var searchClause = result.Results[i].FieldDefinitionSearchClause.Value;
													var url = baseUrl + apiPath + "/Search"
													var data =	{
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
														xhrFields: { withCredentials: true},
														success: function(result)
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
																		$("#" + additionalFieldId).html(formatDate(result.Results[0].Fields[searchClause].DateTime, config.DateFormat))	
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
															}, 
														error: function(result)
															{
															console.log("Oooops!")
															}
														})	
													}
											})(i)}									
										}, 
									error: function(result)
										{
										console.log("Oooops!")
										}
									});
								}
							break;
						case "document":
							$("#properties-record-number").html(result.Results[0].RecordNumber.Value)
							$("#properties-container").html(result.Results[0].RecordContainer.RecordNumber.Value + ": " + result.Results[0].RecordContainer.RecordTitle.Value)
							$("#properties-record-type").html(result.Results[0].RecordRecordType.RecordTypeName.Value)
							$("#properties-date-registered").html(dateRegistered)
							
							// access controls
							var accessControlHTML = "<div>View Document Properties: " + parseAccessControlString(result.Results[0].RecordAccessControl.Value, "record").ViewMetadata + "</div>"
							var accessControlHTML = accessControlHTML + "<div>Update Document Properties: " + parseAccessControlString(result.Results[0].RecordAccessControl.Value, "record").UpdateRecordMetadata + "</div>"
							var accessControlHTML = accessControlHTML + "<div>Download Document: " + parseAccessControlString(result.Results[0].RecordAccessControl.Value, "record").ViewDocument + "</div>"
							$("#properties-access-control").html(accessControlHTML)

								
							if(result.Results[0].RecordDestructionDate.IsClear==false)
								{
								$("#properties-date-due-for-destruction").html(formatDate(result.Results[0].RecordDestructionDate.DateTime, config.DateFormat))
								}
							if(config.PropertiesPane.IntermediateFolder.AdditionalFields=="true")
								{
								var recordUri = result.Results[0].Uri
								var recordType = result.Results[0].RecordRecordType.RecordTypeName.Value
								var url = baseUrl + apiPath + "/Search"
								var data = 	{
											"q" : "all",
											"Properties" : "FieldDefinitionName, FieldDefinitionIsUsedByRecordTypes, FieldDefinitionFormat, FieldDefinitionSearchClause, FieldDefinitionLength",
											"TrimType" : "FieldDefinition",
											"PageSize" : "1000"
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
										for(i=0; i<result.TotalResults; i++)
											{
											(function(index)
												{
												if(result.Results[i].FieldDefinitionIsUsedByRecordTypes.Value.includes(recordType))
													{
													var fieldFormat = result.Results[i].FieldDefinitionFormat.Value
													
													switch(fieldFormat)
														{
														case "String":
															var additionalFieldId = "properties-additional-fields-" + result.Results[i].FieldDefinitionSearchClause.Value;
												
															var additionalPropertyHTML = '<tr><td scope="row" style="width:20%;text-align:left;padding-left:30px;">'

															additionalPropertyHTML = additionalPropertyHTML + result.Results[i].FieldDefinitionName.Value

															additionalPropertyHTML = additionalPropertyHTML + '</td><td id="' + additionalFieldId + '" style="text-align:left;"></td></tr><tr>'

															$("#properties-pane > table > tbody").append(additionalPropertyHTML)
															break;
														case "Number":
															console.log("Number inputs are not yet supported.")
															break;
														case "Boolean":
															console.log("Boolean inputs are not yet supported.")
															break;
														case "Date":
															var additionalFieldId = "properties-additional-fields-" + result.Results[i].FieldDefinitionSearchClause.Value;
												
															var additionalPropertyHTML = '<tr><td scope="row" style="width:20%;text-align:left;padding-left:30px;">'

															additionalPropertyHTML = additionalPropertyHTML + result.Results[i].FieldDefinitionName.Value

															additionalPropertyHTML = additionalPropertyHTML + '</td><td id="' + additionalFieldId + '" style="text-align:left;"></td></tr><tr>'

															$("#properties-pane > table > tbody").append(additionalPropertyHTML)
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

													var searchClause = result.Results[i].FieldDefinitionSearchClause.Value;
													var url = baseUrl + apiPath + "/Search?q=" + recordUri + "&properties=" + searchClause + "&TrimType=Record"
													$.ajax(
														{
														url: url,
														type: "POST",
														contentType: 'application/json',
														xhrFields: { withCredentials: true},
														success: function(result)
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
																	$("#" + additionalFieldId).html(formatDate(result.Results[0].Fields[searchClause].DateTime, config.DateFormat))
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
															}, 
														error: function(result)
															{
															console.log("Oooops!")
															}
														})	
													}
											})(i)}									
										}, 
									error: function(result)
										{
										console.log("Oooops!")
										}
									});
								}
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
			displaySessionExpiredModal()
			}
		});
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
							clearForm("new-folder-form")
							refreshFolderNodes("classification", "classification-uri-" + recordClassificationUri)			
							}
						}
					if(recordContainerUri != null)
						{
						if($("#record-uri-" + recordContainerUri + " > span:nth-child(1)").hasClass("expanded"))
							{
							clearForm("new-sub-folder-form")
							refreshFolderNodes("record", "record-uri-" + recordContainerUri)								
							}

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
					console.log("Oooops!")
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

// END MSICELLANEOUS //