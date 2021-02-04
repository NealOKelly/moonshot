$(document).ready(function()
	{
	$('#loading').modal('show')
	preauthenticateApi().then(function()
		{
  	   	// populate the #classification-data div
		var url = baseUrl + apiPath + "/Search?q=all&properties=ClassificationName, ClassificationParentClassification, ClassificationCanAttachRecords, ClassificationChildPattern&trimtype=Classification&pageSize=1000000"
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
				expandAllFilesOnLoad()
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
	//alert("cclicked")
	if($("#search-input").val() != "")
		{
		showLoadingSpinner()
		hideNewRecordForms()
		// collapse clafficication tree on search
		$("#all-files li").removeClass("node-selected")
		$("#all-files > ul").addClass("classification-hidden")
		$("#all-files > span.expanded").addClass("collapsed")
		$("#all-files > span.expanded").removeClass("expanded")
		$("#all-files > span.folder-open").addClass("folder")
		$("#all-files > span.folder-open").removeClass("folder-open")

		// clear records list pane on search
		$("#records-list-pane").css("display", "none")


		// clear existing search result
		$("#search-results-pane").html("")

		// clear properties pane on search
		$("#properties-pane").hide()
		$("#properties-pane-placeholder").html('<img id="properties-pane-logo" src="img/gilbyim-logo-inline-white-2.png">') // I don't understand why this code is necessary.
		$("#properties-pane-placeholder").show()

		
		$("#search-results-pane").show()
		if($("#folders-only").is(":checked"))
			{
			populateSearchResultPane($("#search-input").val(), "true")		
			}
		else
			{
			populateSearchResultPane($("#search-input").val(), "false")		
			}
			//if($("#folders-only").val())
		
		$("#search-input").val("")
		}
	})

$('#search-input').keydown(function (e){
    if(e.keyCode == 13){
    	$("#search-button").click()
		return false;
		//alert('you pressed enter ^_^');
    }
})

$(document).on("click", ".search-result-caret-collapsed", function()
	{
	var recordUri = $(event.target).parent().attr("id").substr(31)
	var level = parseInt($(event.target).parent().attr("id").substr(6, 1), 10)
	var newTypeNodeId;
	var newRecordNumberNodeId;
	var newRecordTitleNodeId;
	var newRecordTypeNodeId;
	var newDownloadNodeId;
	//alert(level)

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
											$("#level-" + level + "-search-result-type-uri-" + recordUri).after("<ul><li id='level-" + (level + 1) + "-search-result-type-uri-" + result.Results[i].Uri + "' style='padding-left:40px;' data-record-title='" + result.Results[i].RecordTitle.Value + "' data-record-extension='" + result.Results[i].RecordExtension.Value + "'  data-record-mime-type='" + result.Results[i].RecordMimeType.Value + "'><span class='fiv-viv fiv-icon-blank fiv-icon-" + result.Results[i].RecordExtension.Value.toLowerCase() + "'></span></li></ul>")

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
											$(newTypeNodeId).parent().append("<li id='level-" + (level + 1) + "-search-result-type-uri-" + result.Results[i].Uri + "' style='padding-left:40px;' data-record-title='" + result.Results[i].RecordTitle.Value + "' data-record-extension='" + result.Results[i].RecordExtension.Value + "'  data-record-mime-type='" + result.Results[i].RecordMimeType.Value + "'><span class='fiv-viv fiv-icon-blank fiv-icon-" + result.Results[i].RecordExtension.Value.toLowerCase() + "'></span></li>")	
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
								}
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
	})

$(document).on("click", "#search-results li", function()
	{
	//alert($(event.target).attr("id"))
	
	if(!$(event.target).hasClass("search-result-caret-expanded"))
		{
		if(!$(event.target).hasClass("search-result-caret-collapsed"))
			{
			if(!$(event.target).hasClass("file-earmark-grey"))
			   {
				if(!$(event.target).hasClass("no-results"))
					{
					if($(event.target).hasClass("search-result-folder"))
						{
						level = $(event.target).parent().attr("id").substr(6, 1)
						uri = $(event.target).parent().attr("id").substr(31)
						}
					else
						{
						if($(event.target).hasClass("fiv-viv"))
							{
							level = $(event.target).parent().attr("id").substr(6, 1)
							uri = $(event.target).parent().attr("id").substr(31)
							}
						else
							{
							if($(event.target).hasClass("download-grey"))
								{
								level = $(event.target).parent().attr("id").substr(6, 1)
								uri = $(event.target).parent().attr("id").substr(35)	
								}
							else
								{
								if($(event.target).hasClass("download"))
									{
									// Do the download.
							
										
									var level = $(event.target).parent().attr("id").substr(6, 1)
									var recordUri = $(event.target).parent().attr("id").substr(35)
									var recordTitle = $("#level-" + level + "-search-result-type-uri-"+ recordUri).data("record-title")
									var recordExtension = $("#level-" + level + "-search-result-type-uri-"+ recordUri).data("record-extension")
									var recordMimeType = $("#level-" + level + "-search-result-type-uri-"+ recordUri).data("record-mime-type")
									$("#level-" + level + "-search-result-download-uri-"+ recordUri + ">span").toggleClass("download-green download")
									$("#level-" + level + "-search-result-recordNumber-uri-"+ recordUri).toggleClass("search-result-green")
									$("#level-" + level + "-search-result-recordTitle-uri-"+ recordUri).toggleClass("search-result-green")
									$("#level-" + level + "-search-result-recordType-uri-"+ recordUri).toggleClass("search-result-green")
									
									
									setTimeout(function()
										{
										$("#level-" + level + "-search-result-download-uri-"+ recordUri + ">span").toggleClass("download-green download")
										$("#level-" + level + "-search-result-recordNumber-uri-"+ recordUri).toggleClass("search-result-green")
										$("#level-" + level + "-search-result-recordTitle-uri-"+ recordUri).toggleClass("search-result-green")
										$("#level-" + level + "-search-result-recordType-uri-"+ recordUri).toggleClass("search-result-green")
										},
										1000);
										

									downloadDocument(recordUri, recordTitle, recordExtension, recordMimeType)
									}
								else
									{
									level = $(event.target).attr("id").substr(6, 1)		
									if($(event.target).attr("id").includes("search-result-type"))
										{
										uri = $(event.target).attr("id").substr(31)
										}
									if($(event.target).attr("id").includes("search-result-recordNumber"))
										{
										uri = $(event.target).attr("id").substr(39)
										}
									if($(event.target).attr("id").includes("search-result-recordTitle"))
										{
										uri = $(event.target).attr("id").substr(38)
										}
									if($(event.target).attr("id").includes("search-result-recordType"))
										{
										uri = $(event.target).attr("id").substr(37)
										}
									if($(event.target).attr("id").includes("search-result-download"))
										{
										uri = $(event.target).attr("id").substr(35)
										}
									}
								}
							}
						}
					highlightSelectedSearchResult(uri, level)
					if($("#level-" + level + "-search-result-recordNumber-uri-" + uri).attr("class").includes("search-result-green"))
						{
						nodeType="document"
						}
					else
						{
						nodeType = $("#level-" + level + "-search-result-recordNumber-uri-" + uri).attr("class")		
						}
					drawPropertiesTable(nodeType)
					getRecordProperties(nodeType, uri)
					hideNewRecordForms()
					switch(nodeType)
						{
						case "folder-intermediate":
							populateContainerField("folder-intermediate", uri)
							populateRecordTypeField("folder-intermediate", uri)
							$("#new-sub-folder-form-record-title").val("")
							$("#new-sub-folder-form-record-type").html("")
							$("#new-sub-folder-form-container").removeClass("new-sub-folder-form-hidden")
							populateAdditionalFields("folder-intermediate")
							break;
						case "folder-terminal":
							populateContainerField("folder-terminal", uri)
							populateRecordTypeField("folder-terminal", uri)
							populateAdditionalFields("folder-terminal")
							$("#new-folder-form-record-title").val("")
							$("#new-folder-form-container").removeClass("upload-form-hidden")
							break;
						case "document":
							// do something
							break;
						}
					}
			   }
			}
		}
	})

function highlightSelectedSearchResult(uri, level)
	{
	if($("#level-" + level + "-search-result-recordNumber-uri-" + uri).css("font-weight")!="700")
		{
		$("#search-results li").css("font-weight", "normal")
		$("[id*='-search-result-download-uri-'] span").removeClass("download")
		$("[id*='-search-result-download-uri-'] span").addClass("download-grey")
		//$("#level-" + level + "-search-result-download-uri-" + uri + ">span").addClass("download-grey")
		$("#level-" + level + "-search-result-recordNumber-uri-" + uri).css("font-weight", "bold")
		$("#level-" + level + "-search-result-recordTitle-uri-" + uri).css("font-weight", "bold")
		$("#level-" + level + "-search-result-recordType-uri-" + uri).css("font-weight", "bold")
		if($("#level-" + level + "-search-result-recordNumber-uri-" + uri).hasClass("document"))
			{
			//alert("It's a document.")
			$("#level-" + level + "-search-result-download-uri-" + uri + ">span").removeClass("download-grey")
			$("#level-" + level + "-search-result-download-uri-" + uri + ">span").addClass("download")
			}
		}
	}



$(document).on("click", ".search-result-caret-expanded", function()
	{
	$(event.target).addClass("search-result-caret-collapsed")
	$(event.target).removeClass("search-result-caret-expanded")
	$(event.target).parent().children().eq(1).addClass("search-result-folder")
	$(event.target).parent().children().eq(1).removeClass("search-result-folder-open")
	
	var level = $(event.target).parent().attr("id").substr(6, 1)
	//alert("level:" + level)
	var uri = $(event.target).parent().attr("id").substr(31)
	//alert(uri)
	$("#level-" + level + "-search-result-type-uri-" + uri).next().addClass("remove-me")
	$("#level-" + level + "-search-result-recordNumber-uri-" + uri).next().addClass("remove-me")
	$("#level-" + level + "-search-result-recordTitle-uri-" + uri).next().addClass("remove-me")
	$("#level-" + level + "-search-result-recordType-uri-" + uri).next().addClass("remove-me")
	$("#level-" + level + "-search-result-download-uri-" + uri).next().addClass("remove-me")
	$(".remove-me").html("")
	$(".remove-me").removeClass("remove-me")
	
	//$("#level-" + level + "-search-result-type-uri-" + uri).parent().find("ul").remove()
	//$("#level-" + level + "-search-result-recordNumber-uri-" + uri).parent().find("ul").remove()
	//$("#level-" + level + "-search-result-recordTitle-uri-" + uri).parent().find("ul").remove()
	//$("#level-" + level + "-search-result-recordType-uri-" + uri).parent().find("ul").remove()
	//$("#level-" + level + "-search-result-download-uri-" + uri).parent().find("ul").remove()
	
	//columns = $($(event.target).parent().parent().parent().parent()).children().length
	//var level = $(event.target).parent().attr("id").substr(6, 1)

	})

function populateSearchResultPane(searchString, foldersOnly)
	{
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
					var q = 'content:"'+ searchString +'" Or anyWord:' + searchString;
					var url = baseUrl + apiPath + "/Search?q=" + q + "&properties=RecordNumber,RecordTitle,RecordRecordType,RecordMimeType,RecordExtension&trimtype=Record&pageSize=1000&sortBy=typedTitle"
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
								$("#search-results-pane").html("<div class='no-records display-4'>Your search did not return any records.</div>")
								//Browse or search to display records.
								//<div class='no-records display-4'>Browse or search to display records.</div>
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
								hideLoadingSpinner()	
								}
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
		resultRowHTML = '<tr><td>'
		resultRowHTML = resultRowHTML + '<ul><li id="level-0-search-result-type-uri-' + record.Uri + '" style="padding-left:45px;" data-record-title="' + record.RecordTitle.Value + '" data-record-extension="' + record.RecordExtension.Value + '" data-record-mime-type="' + record.RecordMimeType.Value + '">'
		
		resultRowHTML = resultRowHTML + '<span class="fiv-viv fiv-icon-blank fiv-icon-' + record.RecordExtension.Value.toLowerCase() + '" arial-label="' + record.RecordExtension.Value.toUpperCase() + '">'
			
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
		resultRowHTML = resultRowHTML + '<td style="text-align:center;"><ul><li id="level-0-search-result-download-uri-' + record.Uri + '"><span class="download-grey"></span></li></ul></td></tr>'
		}
	else
		{
		resultRowHTML = resultRowHTML + '<td style="text-align:center;"><ul><li id="level-0-search-result-download-uri-' + record.Uri + '"><!--Intentionally Blank--></li></ul></td>'	
		}
	
	resultRowHTML = resultRowHTML + '</tr>'
	$("#search-results").append(resultRowHTML)
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
		var row = $(event.target).parent()
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
	$("#search-results-pane").hide()
	$("#records-list-pane").show()
	classificationTreeNodeSelected(node)
	if(node.hasClass("classification-can-attach-records"))
		{
		$("#new-folder-form-record-type").html("")
		populateRecordTypeField("classification", node.attr("id").substr(19)).then(function()
			{
			populateAdditionalFields("classification").then(function()
				{
				$("#new-folder-form-container").removeClass("new-folder-form-hidden")	
				})
			})
		}
	if(node.hasClass("folder-intermediate"))
		{
		//alert(node.attr("id").substr(19))
		populateContainerField("folder-intermediate", node.attr("id").substr(11))
		populateRecordTypeField("folder-intermediate", node.attr("id").substr(11))
		$("#new-sub-folder-form-record-title").val("")
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
	$("#search-results-pane").hide()
	$("#records-list-pane").show()
	classificationTreeNodeSelected(node)
	if(node.hasClass("classification-can-attach-records"))
		{
		$("#new-folder-form-record-type").html("")
		populateRecordTypeField("classification", node.attr("id").substr(19)).then(function()
			{
			populateAdditionalFields("classification").then(function()
				{
				$("#new-folder-form-container").removeClass("new-folder-form-hidden")	
				})
			})
		}
	if(node.hasClass("folder-intermediate"))
		{
		populateContainerField("folder-intermediate", node.attr("id").substr(11))
		populateRecordTypeField("folder-intermediate", node.attr("id").substr(11))
		$("#new-sub-folder-form-record-title").val("")
		$("#new-sub-folder-form-record-type").val("")
		$("#new-sub-folder-form-container").removeClass("new-sub-folder-form-hidden")
		populateAdditionalFields("folder-intermediate")
		}
	})

// Click on Classification Name Hyperlink //
$(document).on("click", ".classification-name>a", function()
	{
	var node = $(event.target).parent().parent();
	hideNewRecordForms()
	$("#search-results-pane").hide()
	$("#records-list-pane").show()
	classificationTreeNodeSelected(node)
	if(node.hasClass("classification-can-attach-records"))
		{
		$("#new-folder-form-record-type").html("")
		populateRecordTypeField("classification", node.attr("id").substr(19)).then(function()
			{
			populateAdditionalFields("classification").then(function()
				{
				$("#new-folder-form-container").removeClass("new-folder-form-hidden")	
				})
			})
		}
	})

// Click on folder-fill Icon //
$(document).on("click", ".folder-fill", function()
	{
	var node = $(event.target).parent();
	hideNewRecordForms()
	$("#search-results-pane").hide()
	$("#records-list-pane").show()
	highlightSelectedNode(node)
	$("#records-list-pane").css("display", "block")
	if($(node).hasClass("folder-terminal"))
		{
		getRecords(node.attr("id").substr(11))
		populateContainerField("folder-terminal", node.attr("id").substr(11))
		populateRecordTypeField("folder-terminal", node.attr("id").substr(11))
		populateAdditionalFields("folder-terminal")
		$("#new-folder-form-record-title").val("")
		$("#new-folder-form-container").removeClass("upload-form-hidden")
		$("#properties-pane").css("display", "block")
		drawPropertiesTable("folder-terminal")
		getRecordProperties("folder-terminal", node.attr("id").substr(11))
		}
	})

$(document).on("click", ".record-title>a", function()
	{
	var node = $(event.target).parent().parent();
	hideNewRecordForms()
	$("#search-results-pane").hide()
	$("#records-list-pane").show()
	highlightSelectedNode(node)
	$(".record-row").removeClass("row-selected")
	$(".record-row > td:nth-child(5) > span").addClass("download-grey")
	$(".record-row > td:nth-child(5) > span").removeClass("download")
	
	if($(node).hasClass("folder-intermediate"))
		{
		$("#records-list-pane").html("<div class='no-records display-4'>Browse or search to display records.</div>")
		populateContainerField("folder-intermediate", node.attr("id").substr(11))
		populateRecordTypeField("folder-intermediate", node.attr("id").substr(11))
		drawPropertiesTable("folder-intermediate")
		getRecordProperties("folder-intermediate", node.attr("id").substr(11))
		$("#new-sub-folder-form-record-title").val("")
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
			$("#upload-form-record-type").html("")
			$("#upload-form-container").removeClass("upload-form-hidden")
			drawPropertiesTable("folder-terminal")
			getRecordProperties("folder-terminal", node.attr("id").substr(11))
			}
		}
	})

function expandAllFilesOnLoad()
	{
	$("#all-files ul").removeClass("classification-hidden")
	$("#all-files > span.collapsed").addClass("expanded")
	$("#all-files > span.collapsed").removeClass("collapsed")
	$("#all-files > span.folder").addClass("folder-open")
	$("#all-files > span.folder").removeClass("folder")	
	}


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
		$("#" + parentNodeId + " > span.folder-fill").addClass("folder-open")
		$("#" + parentNodeId + " > span.folder-fill").removeClass("folder-fill")
			
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
	console.log("Record type changed.")
	populateAdditionalFields("classification")
	})

$(document).on("change", "#new-sub-folder-form-record-type", function()
	{
	populateAdditionalFields("folder-intermediate")
	})

// Click re-athentication button
$(document).on("click", "#test-button", function()
	{
	//console.log("Frame Title: " + $("#authentication-frame").contents().find("title").html())
	alert("Length: " + $('select[id=new-folder-form-record-type] option').length)
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
