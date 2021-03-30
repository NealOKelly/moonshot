$(document).ready(function()
	{
	$('#loading').modal('show')
	preauthenticateApi().then(function()
		{
		//var url = baseUrl + apiPath + "/Search";
		var data = {
					"q" : "all",
					"Properties" : "ClassificationName, ClassificationParentClassification, ClassificationCanAttachRecords, ClassificationChildPattern, ClassificationIdNumber",
					"TrimType" : "Classification",
					"PageSize" : "1000000"
					};
		var result = searchAPI(data)
			.then(function(result)
				{
				var classifications = result;
				for(var i=0; i<classifications.TotalResults; i++)  // populate top level classifications.
					{
					if(!classifications.Results[i].hasOwnProperty("ClassificationParentClassification"))
						{
						if(!$("#classification-uri-" + classifications.Results[i].Uri).length)
							{
							addClassificationNode("#all-files > ul", classifications.Results[i].Uri, classifications.Results[i].ClassificationName.Value, classifications.Results[i].ClassificationCanAttachRecords.Value, classifications.Results[i].ClassificationChildPattern.Value, result.Results[i].ClassificationIdNumber.Value)
							}
							$("#all-files > ul").addClass("classification-hidden")
						}
					}	
				// sort	 this list.
				sortClassificationTree(".classification-name")
				// display top-level classifications
				$("#all-files ul").removeClass("classification-hidden")
				$("#all-files > span.collapsed").addClass("expanded")
				$("#all-files > span.collapsed").removeClass("collapsed")
				$("#all-files > span.folder").addClass("folder-open")
				$("#all-files > span.folder").removeClass("folder")	
				hideLoadingSpinner()
				})
			.fail(function(result)
				{
				hideLoadingSpinner()
				$('#connection-failed').modal('show')
				})
		})
	});


//////// Handle User-Initiated Events  /////////

$(document).on("click", ".edit-properties-link", function()
	{
	var linkElement = event.target
	var editableCellId = $("#" + $(linkElement).parent().attr("id")).parent().find("td:nth-child(2)").attr("id")
	switch($(event.target).html())
		{
		case "Edit":
			// hide form on action panel
			if($("#record-uri-" + $("#" + editableCellId).data("record-uri")).hasClass("folder-intermediate"))
				{
				$("#" + editableCellId).data("record-type", "folder-intermediate")
				$("#new-sub-folder-form-container").hide()
				}
			if($("#record-uri-" + $("#" + editableCellId).data("record-uri")).hasClass("folder-terminal"))
				{
				$("#" + editableCellId).data("record-type", "folder-terminal")
				$("#upload-form-container").hide()
				}	
			if($("#record-uri-" + $("#" + editableCellId).data("record-uri")).hasClass("record-row"))
				{
				$("#" + editableCellId).data("record-type", "document")
				$("#upload-form-container").hide()
				}
			if($("#level-0-search-result-recordNumber-uri-" + $("#" + editableCellId).data("record-uri")).hasClass("folder-intermediate"))	
				{
				$("#" + editableCellId).data("record-type", "folder-intermediate")
				$("#new-sub-folder-form-container").hide()					
				}
			if($("#level-0-search-result-recordNumber-uri-" + $("#" + editableCellId).data("record-uri")).hasClass("folder-terminal"))
				{
				$("#" + editableCellId).data("record-type", "folder-terminal")
				$("#upload-form-container").hide()					
				}
			if($("#level-0-search-result-recordNumber-uri-" + $("#" + editableCellId).data("record-uri")).hasClass("document"))
				{
				$("#" + editableCellId).data("record-type", "document")
				$("#upload-form-container").hide()					
				}
			if($("#level-1-search-result-recordNumber-uri-" + $("#" + editableCellId).data("record-uri")).hasClass("folder-terminal"))
				{
				$("#" + editableCellId).data("record-type", "folder-terminal")
				$("#upload-form-container").hide()					
				}	
			if($("#level-2-search-result-recordNumber-uri-" + $("#" + editableCellId).data("record-uri")).hasClass("document"))
				{
				$("#" + editableCellId).data("record-type", "document")
				$("#upload-form-container").hide()					
				}
				
			$("#" + editableCellId).parent().find("td:nth-child(3)").addClass("editing")
			// capture original value to be used to reset the table in an error scenario.
			$("#" + editableCellId).data("original-value", $("#" + editableCellId).html())
			// create the input box
				
			
			if(editableCellId.includes("properties-additional-fields"))
				{
				switch($("#" + editableCellId).data("field-definition-format"))
					{
					case "String":
						$("#" + editableCellId).html('<form autocomplete="off"><input id="editRecordPropertiesInput" type="text" style="width:100%;" value="' + $("#" + editableCellId).html().replace('"', '&quot;') + '" maxlength="' + $("#" + editableCellId).data("field-length") + '"></form>')
						break;
					case "Number":
						console.log("Number inputs are not yet supported.")
						break;
					case "Boolean":
						console.log("Boolean inputs are not yet supported.")
						break;
					case "Date":
						$("#" + editableCellId).html('<form autocomplete="off"><input id="editRecordPropertiesInput" class="properties-date-input" type="text" style="width:100%;" value="' + formatDate($("#" + editableCellId).html(), "dd-mmm-yyyy", config.DateFormat) + '" data-provide="datepicker" data-date-format="' + config.DatePicker.DateFormat + '" data-date-autoclose="' + config.DatePicker.AutoClose + '" placeholder="' + config.DatePicker.Placeholder + '" data-date-start-date="' + config.DatePicker.StartDate + '" data-date-assume-nearby-year="' + config.DatePicker.AssumeNearbyYear + '" maxlength="10"></form>')
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
			else // it's a record title
				{
				$("#" + editableCellId).html('<form autocomplete="off"><input id="editRecordPropertiesInput" type="text" style="width:100%;" value="' + $("#" + editableCellId).html().replace('"', '&quot;') + '"></form>')
				}

			// hide all other Edit links
			$(".edit-properties-link:not(.editing) > a").css("display", "none")
			$(linkElement).html("Save")
			break;
		case "Save":
			var url = baseUrl + apiPath + "/Record";
			if(editableCellId.includes("properties-additional-fields"))
				{
				gtag('event', 'Edit Additional Properties')
				var data = 	{
							"Uri" : $("#" + editableCellId).data("record-uri"),
							"RecordTitle" : $("#" + editableCellId).data("record-title"),
							"RecordRecordType" : $("#" + editableCellId).data("record-record-type"),
							"AdditionalFields" : {}	 
							}
					data.AdditionalFields[$("#" + editableCellId).data("field-name")] = $("#editRecordPropertiesInput").val()
				}
			else
				{
				gtag('event', 'Edit Record Title')
				var data = 	{
							"Uri" : $("#" + editableCellId).data("record-uri"),
							"RecordTitle" : $("#editRecordPropertiesInput").val(),
							"RecordRecordType" : $("#" + editableCellId).data("record-record-type")
							}					
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
					var data = 	{
								"q" : $("#" + editableCellId).data("record-uri"),
								"Properties" : "RecordTitle, RecordNumber",
								"TrimType" : "Record"
								}
					var result = searchAPI(data)
						.then(function(result)
							{
							//$("#" + editableCellId).html($("#editRecordPropertiesInput").val())
							
							// update the classification tree with the new title.
							$("#record-uri-" + $("#" + editableCellId).data("record-uri") + " >span:nth-child(3)>a").html(result.Results[0].RecordTitle.Value)
							sortClassificationTree(".record-title")
							// update the records list pane
							$("#record-uri-" + $("#" + editableCellId).data("record-uri") + " >td:nth-child(3)").html(result.Results[0].RecordTitle.Value)
							
							// update the search results pane
							$('[id*="search-result-recordTitle-uri-' + $("#" + editableCellId).data("record-uri") + '"]').html(result.Results[0].RecordTitle.Value)
							
							
							// change save link back to edit link
							$(linkElement).html("Edit")							
							$("#" + editableCellId).parent().find("td:nth-child(3)").removeClass("editing")
							
							// show hidden edit links
							$(".edit-properties-link > a").css("display", "block")
							
							// show the form on the action panel
							if($("#record-uri-" + $("#" + editableCellId).data("record-uri")).hasClass("folder-intermediate"))
								{
								$("#new-sub-folder-form-record-title").val("")
								$("#new-sub-folder-form-record-container").val(result.Results[0].RecordNumber.Value + ": " + result.Results[0].RecordTitle.Value)
								$("#new-sub-folder-form-container").show()
								}
							if($("#record-uri-" + $("#" + editableCellId).data("record-uri")).hasClass("folder-terminal"))
								{
								// remove and re-add file upload input control in order to clear it.
								$("#upload-form-file").remove()
								$("#upload-form-file-label").remove()
								$("#upload-form-file-container").append('<input id="upload-form-file" name="upload" type="file" class="custom-file-input" id="validatedCustomFile"><label id="upload-form-file-label" class="custom-file-label" for="upload-form-file">Choose file...</label>')
								// clear record title field
								$("#upload-form-record-title").val("")
								// update container field with new container title.
								$("#upload-form-record-container").val(result.Results[0].RecordNumber.Value + ": " + result.Results[0].RecordTitle.Value)
								// show upload form
								$("#upload-form-container").show()
								}
							if($("#record-uri-" + $("#" + editableCellId).data("record-uri")).hasClass("record-row"))
								{
								// remove and re-add file upload input control in order to clear it.
								$("#upload-form-file").remove()
								$("#upload-form-file-label").remove()
								$("#upload-form-file-container").append('<input id="upload-form-file" name="upload" type="file" class="custom-file-input" id="validatedCustomFile"><label id="upload-form-file-label" class="custom-file-label" for="upload-form-file">Choose file...</label>')
								// clear record title field
								$("#upload-form-record-title").val("")
								// update container field with new container title.
								$("#upload-form-record-container").val(result.Results[0].RecordNumber.Value + ": " + result.Results[0].RecordTitle.Value)
								// show upload form
								$("#upload-form-container").show()
								}
							if($("#level-0-search-result-recordNumber-uri-" + $("#" + editableCellId).data("record-uri")).hasClass("folder-intermediate"))
								{
								$("#new-sub-folder-form-record-title").val("")
								$("#new-sub-folder-form-record-container").val(result.Results[0].RecordNumber.Value + ": " + result.Results[0].RecordTitle.Value)
								$("#new-sub-folder-form-container").show()									
								}
							if($("#level-0-search-result-recordNumber-uri-" + $("#" + editableCellId).data("record-uri")).hasClass("folder-terminal"))
								{
								// remove and re-add file upload input control in order to clear it.
								$("#upload-form-file").remove()
								$("#upload-form-file-label").remove()
								$("#upload-form-file-container").append('<input id="upload-form-file" name="upload" type="file" class="custom-file-input" id="validatedCustomFile"><label id="upload-form-file-label" class="custom-file-label" for="upload-form-file">Choose file...</label>')
								// clear record title field
								$("#upload-form-record-title").val("")
								// update container field with new container title.
								$("#upload-form-record-container").val(result.Results[0].RecordNumber.Value + ": " + result.Results[0].RecordTitle.Value)
								// show upload form
								$("#upload-form-container").show()									
								}
							if($("#level-1-search-result-recordNumber-uri-" + $("#" + editableCellId).data("record-uri")).hasClass("folder-terminal"))
								{
								// remove and re-add file upload input control in order to clear it.
								$("#upload-form-file").remove()
								$("#upload-form-file-label").remove()
								$("#upload-form-file-container").append('<input id="upload-form-file" name="upload" type="file" class="custom-file-input" id="validatedCustomFile"><label id="upload-form-file-label" class="custom-file-label" for="upload-form-file">Choose file...</label>')
								// clear record title field
								$("#upload-form-record-title").val("")
								// update container field with new container title.
								$("#upload-form-record-container").val(result.Results[0].RecordNumber.Value + ": " + result.Results[0].RecordTitle.Value)
								// show upload form
								$("#upload-form-container").show()									
								}

						
							if(editableCellId=="properties-record-title")
								{
								$("#" + editableCellId).html($("#editRecordPropertiesInput").val())
								$(".edit-properties-link:not(.editing) > a").css("display", "block")
								}
							else
								{
								switch($("#" + editableCellId).data("field-definition-format"))
									{
									case "String":
										$("#" + editableCellId).html($("#editRecordPropertiesInput").val())
										$(".edit-properties-link:not(.editing) > a").css("display", "block")
										break;
									case "Number":
										console.log("Number inputs are not yet supported.")
										break;
									case "Boolean":
										console.log("Boolean inputs are not yet supported.")
										break;
									case "Date":
										console.log('$("#editRecordPropertiesInput").val(): ' + $("#editRecordPropertiesInput").val())
										switch($("#editRecordPropertiesInput").val().length)
											{
											case 0:
												$("#" + editableCellId).html("")
												break;
											case 10:
												console.log("This code is called.  Boo-yah!")
												$("#" + editableCellId).html(formatDate($("#editRecordPropertiesInput").val(), "tenDigit", config.DateFormat))
												break;
											case 11:
												$("#" + editableCellId).html(formatDate($("#editRecordPropertiesInput").val(), "dd-mmm-yyyy", config.DateFormat))												
												break;
											}
											$(".edit-properties-link:not(.editing) > a").css("display", "block")
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

							})
						.fail(function(result)
							{
							// do something
							})
					}, 
				error: function(result)
					{
					showEditPropertiesError(result.responseJSON.ResponseStatus.Message)
					}
				});
			break;
		}
	})

$(document).on("click", "#edit-properties-error-ok-button", function()
	{
	dismissEditPropertiesError()
	})

$(document).on("click", "#all-files>span>a", function()
	{
	hideNewRecordForms()
	$("#properties-pane").hide()
	$("#properties-pane-placeholder").html('<img id="properties-pane-logo" src="img/gilbyim-logo-inline-white-2.png">') // I don't understand why this code is necessary.
	$("#classification-treeview li").removeClass("node-selected")
	$("#all-files").addClass("node-selected")
	$("#all-files>span>a").css("font-weight", "bold")
	$("#properties-pane-placeholder").css("display", "block")
	})

$(document).on("click", "#all-files > span.folder", function()
	{
	hideNewRecordForms()
	$("#properties-pane").hide()
	$("#properties-pane-placeholder").html('<img id="properties-pane-logo" src="img/gilbyim-logo-inline-white-2.png">') // I don't understand why this code is necessary.
	$("#classification-treeview li").removeClass("node-selected")
	$("#all-files").addClass("node-selected")
	$("#all-files>span>a").css("font-weight", "bold")
	$("#properties-pane-placeholder").css("display", "block")
	})

$(document).on("click", "#all-files > span.folder-open", function()
	{
	hideNewRecordForms()
	$("#properties-pane").hide()
	$("#properties-pane-placeholder").html('<img id="properties-pane-logo" src="img/gilbyim-logo-inline-white-2.png">') // I don't understand why this code is necessary.
	$("#classification-treeview li").removeClass("node-selected")
	$("#all-files").addClass("node-selected")
	$("#all-files>span>a").css("font-weight", "bold")
	$("#properties-pane-placeholder").css("display", "block")
	})

//Upload
$(document).on("click", "#upload-button", function()
	{
	getAuthenticationStatus().then(function () 
		{
		if(isAuthenticated)
			{
			if($("#drop-zone").data("file"))
					{
					console.log("Use the drag and dropped file.")
					file = $("#drop-zone").data("file")
					console.log("The filename is: " + file.name)
					$("#dropped-filename").html("")
					var extension = getFileExtension(file.name);
					}
				else
					{
					file = $("#upload-form-file").prop('files')[0];
					var extension = getFileExtension($("#upload-form-file").val().substr(12))
					}
			if($("#upload-form-file").prop('files').length > 0 || $("#drop-zone").data("file"))
				{
				$("#upload-status").modal("show")
				var fileName = uuidv4();
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
					gtag('event', 'Upload Document');					
					})
				}
				$("#dropped-file-filetype-icon").removeClass()
				$("#dropped-file-filetype-icon").addClass("fiv-viv")
				
				if($("#drop-zone").data("file"))
					{
					$("#drop-zone").removeData("file")		
					}
				$("#file-details-container").css("display", "none")
				$("#browse-button-container").css("display", "inline-block")
			}
		else
			{
			displaySessionExpiredModal()
			}
		});
	})

$("#browse-button").click(function()
	{
	$("#upload-form-file").trigger("click"); // opening dialog
	gtag('event', 'Browse for File')
	document.activeElement.blur()
	return false; // avoiding navigation
    });



$(document).on("click", "#search-button", function()
	{
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
			gtag('event', 'Search (Folders Only)');
			}
		else
			{
			populateSearchResultPane($("#search-input").val(), "false")	
			gtag('event', 'Search (All Records)');
			}
			//if($("#folders-only").val())
		
		$("#search-input").val("")
		$("#folders-only").prop("checked", true)
		}
	})

$('#search-input').keydown(function (e){
    if(e.keyCode == 13){
    	$("#search-button").click()
		return false;
		//alert('you pressed enter ^_^');
    }
})

function expandCollapsedSearchResult(recordUri, level)
	{
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



$(document).on("click", ".search-result-caret-collapsed", function()
	{
	var recordUri = $(event.target).parent().attr("id").substr(31)
	var level = parseInt($(event.target).parent().attr("id").substr(6, 1), 10)
	expandCollapsedSearchResult(recordUri, level)
	})

$(document).on("click", "#search-results li", function()
	{
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
							$("#new-sub-folder-form-record-title").val("")
							$("#new-sub-folder-form-record-type").html("")
							populateContainerField("folder-intermediate", uri)
							populateRecordTypeField("folder-intermediate", uri).then(function()
								{
								populateAdditionalFields("folder-intermediate").then(function()
									{
									$("#new-sub-folder-form-container").removeClass("new-sub-folder-form-hidden")
									})
								})
							break;
						case "folder-terminal":
							$("#upload-form-record-title").val("")
							$("#upload-form-record-type").html("")
							populateContainerField("folder-terminal", uri)
							populateRecordTypeField("folder-terminal", uri).then(function()
								{
								populateAdditionalFields("folder-terminal").then(function()
									{
									$("#upload-form-container").removeClass("upload-form-hidden")
									})
								})	
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



$(document).on("click", ".search-result-caret-expanded", function()
	{
	$(event.target).addClass("search-result-caret-collapsed")
	$(event.target).removeClass("search-result-caret-expanded")
	$(event.target).parent().children().eq(1).addClass("search-result-folder")
	$(event.target).parent().children().eq(1).removeClass("search-result-folder-open")
	
	var level = $(event.target).parent().attr("id").substr(6, 1)
	var uri = $(event.target).parent().attr("id").substr(31)
	$("#level-" + level + "-search-result-type-uri-" + uri).next().addClass("remove-me")
	$("#level-" + level + "-search-result-recordNumber-uri-" + uri).next().addClass("remove-me")
	$("#level-" + level + "-search-result-recordTitle-uri-" + uri).next().addClass("remove-me")
	$("#level-" + level + "-search-result-recordType-uri-" + uri).next().addClass("remove-me")
	$("#level-" + level + "-search-result-download-uri-" + uri).next().addClass("remove-me")
	$(".remove-me").html("")
	$(".remove-me").removeClass("remove-me")
	})

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
								console.log(getTimeStamp() - startTime)
									
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
		$("#records-list-pane").html("<div class='no-records display-4'>Browse or search to display records.</div>")
		$("#new-sub-folder-form-record-title").val("")
		$("#new-sub-folder-form-record-type").html("")
		populateContainerField("folder-intermediate", node.attr("id").substr(11))
		populateRecordTypeField("folder-intermediate", node.attr("id").substr(11)).then(function()
			{
			populateAdditionalFields("folder-intermediate").then(function()
				{
				$("#new-sub-folder-form-container").removeClass("new-sub-folder-form-hidden")				
				})
			})
		drawPropertiesTable("folder-intermediate")
		getRecordProperties("folder-intermediate", node.attr("id").substr(11))
		}
	})

// Click on open folder icon //
$(document).on("click", ".folder-open", function()
	{
	var node = $(event.target).parent();
	if(node.attr("id")!="all-files")
		{
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
			$("#records-list-pane").html("<div class='no-records display-4'>Browse or search to display records.</div>")
			$("#new-sub-folder-form-record-title").val("")
			$("#new-sub-folder-form-record-type").html("")
			populateContainerField("folder-intermediate", node.attr("id").substr(11))
			populateRecordTypeField("folder-intermediate", node.attr("id").substr(11)).then(function()
				{
				populateAdditionalFields("folder-intermediate").then(function()
					{
					$("#new-sub-folder-form-container").removeClass("new-sub-folder-form-hidden")				
					})
				})
			drawPropertiesTable("folder-intermediate")
			getRecordProperties("folder-intermediate", node.attr("id").substr(11))
			}
		if(node.hasClass("folder-terminal"))
			{
			getRecords(node.attr("id").substr(11))
			populateContainerField("folder-terminal", node.attr("id").substr(11))
			$("#upload-form-record-type").html("")
			populateRecordTypeField("folder-terminal", node.attr("id").substr(11)).then(function()
				{
				populateAdditionalFields("folder-terminal").then(function()
					{
					$("#upload-form-container").removeClass("upload-form-hidden")					
					})
				})
			drawPropertiesTable("folder-terminal")
			getRecordProperties("folder-terminal", node.attr("id").substr(11))	
			}			
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
		$("#upload-form-record-type").html("")
		populateRecordTypeField("folder-terminal", node.attr("id").substr(11)).then(function()
			{
			populateAdditionalFields("folder-terminal").then(function()
				{
				$("#upload-form-container").removeClass("upload-form-hidden")					
				})
			})
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
		$("#new-sub-folder-form-record-title").val("")
		$("#new-sub-folder-form-record-type").html("")
		populateContainerField("folder-intermediate", node.attr("id").substr(11))
		populateRecordTypeField("folder-intermediate", node.attr("id").substr(11)).then(function()
			{
			populateAdditionalFields("folder-intermediate").then(function()
				{
				$("#new-sub-folder-form-container").removeClass("new-sub-folder-form-hidden")				
				})
			})
		drawPropertiesTable("folder-intermediate")
		getRecordProperties("folder-intermediate", node.attr("id").substr(11))
		}
	else
		{
		if($(node).hasClass("folder-terminal"))
			{
			getRecords(node.attr("id").substr(11))
			populateContainerField("folder-terminal", node.attr("id").substr(11))
			$("#upload-form-record-type").html("")
			populateRecordTypeField("folder-terminal", node.attr("id").substr(11)).then(function()
				{
				populateAdditionalFields("folder-terminal").then(function()
					{
					$("#upload-form-container").removeClass("upload-form-hidden")					
					})
				})
			drawPropertiesTable("folder-terminal")
			getRecordProperties("folder-terminal", node.attr("id").substr(11))
			}
		}
	})

// Click on collpased caret
$(document).on("click", ".collapsed", function()
	{
	gtag('event', 'Expand Classification');
	var parentNodeId = $(event.target).parent().attr("id");
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
			gtag('event', 'Browse (to Folder)');
			}
		if($(this).parent().hasClass("folder-intermediate"))
			{
			refreshFolderNodes("record", $(this).parent().attr("id"))
			gtag('event', 'Browse (to Sub Folder)');
			}
		});
	})

// File input
$(document).on("change", "#upload-form-file", function()
	{
	var fileName = $("#upload-form-file").val().substr(12)
	var extension = getFileExtension($("#upload-form-file").val().substr(12))
	$("#browse-button-container").css("display", "none")
	$("#dropped-file-filetype-icon").addClass("fiv-icon-" + extension)
	$("#dropped-file-name").html(fileName)
	$("#file-details-container").css("display", "inline-block")
	var recordTitle = fileName.substr(0, fileName.length - (extension.length + 1))
	$("#upload-form-record-title").val(recordTitle)
	})

// This prevent dragOver and drop behaviours at a document level
$(document).on(
	{
    dragover: function()
		{
        return false;
    	},
    drop: function()
		{
        return false;
    	}
	});

$("#x-icon").on(
	{
    dragover: function()
		{
        return false;
    	},
    drop: function()
		{
        return false;
    	}
	});

$("#browse-button").on(
	{
    dragover: function()
		{
        return false;
    	},
    drop: function()
		{
        return false;
    	}
	});


function dragstart_handler(ev)
	{
 	//console.log("dragStart: target.id = " + ev.target.id);
 	// Add this element's id to the drag payload so the drop handler will
 	// know which element to add to its tree
 	ev.dataTransfer.setData("text/plain", ev.target.id);
 	ev.dataTransfer.effectAllowed = "move";
	}


function dropHandler(ev)
	{
  	console.log('File(s) dropped');

  	// Prevent default behavior (Prevent file from being opened)
  	ev.preventDefault();

  	if(ev.dataTransfer.items) 
		{
    	// Use DataTransferItemList interface to access the file(s)
	  	if(ev.dataTransfer.items.length>1)
			{
			console.log("This code is called.")
			$("#drag-and-drop-error").modal("show")
			}
		else
			{
			if(ev.dataTransfer.items[0].kind === 'file')
				{
        		var file = ev.dataTransfer.items[0].getAsFile();
				$("#drop-zone").data("file", file)
				$("#browse-button-container").css("display", "none")
				$("#file-details-container").css("display", "inline-block")
				$("#dropped-file-filetype-icon").addClass("fiv-icon-" + getFileExtension(file.name))
				var recordTitle = file.name.substr(0, file.name.length - (getFileExtension(file.name).length + 1))
				$("#dropped-file-name").html(file.name)
				$("#upload-form-record-title").val(recordTitle)
				gtag('event', 'Drop File')
      			}
			}
  		}
	}

function dragOverHandler(ev)
	{
  	//console.log('File(s) in drop zone');
	// Prevent default behavior (Prevent file from being opened)
  	ev.preventDefault();
	}

$(document).on("click", "#drag-and-drop-error-ok-button", function()
	{
	$("#drag-and-drop-error").modal("hide")
	})

$(document).on("click", "#x-icon", function()
	{
	console.log("x-icon clicked.")
	$("#dropped-file-filetype-icon").removeClass()
	$("#dropped-file-filetype-icon").addClass("fiv-viv")
	$("#dropped-file-name").html("")
	$("#file-details-container").css("display", "none")
	$("#browse-button-container").css("display", "inline-block")
	$("#upload-form-record-title").val("")
	$("#drop-zone").removeData("file")
	$("#upload-form-file").parent().html( $("#upload-form-file").parent().html() )
	gtag('event', 'Clear File Control')
	})

// Click on expanded caret
$(document).on("click", ".expanded", function()
	{
	gtag('event', 'Collapse Classification');
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
		gtag('event', 'Create Folder');
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
		gtag('event', 'Create Sub Folder');
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
	alert($("#additional-field-").val())
	alert($("#additional-field-").value)
	})




$(".date-input").keyup(function(event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
        //alert('You pressed a "enter" key in textbox');  

		
    }
});


$(".date-input").focus(function(event)
	{
//	oldValue = $(event.target).val()
//	$(event.target).val("").trigger("change")
//	$(event.target).val(isValidDate(oldValue)).trigger("change")
	})

$(".properties-date-input").change(function(event)
	{
	console.log("Change event called.")
//	oldValue = $(event.target).val()
//	$(event.target).val("").trigger("change")
//	$(event.target).val(isValidDate(oldValue)).trigger("change")
	})



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




// Click re-athentication button
$(document).on("click", "#reauthenticate-button", function()
	{
	gtag('event', 'Click Reauthenticate Button');
	removeAPISessionCookies();
	$(location).attr("href","/logout");
	})

// Click logout link
$(document).on("click", "#logout", function()
	{
	gtag('event', 'Logout');
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
