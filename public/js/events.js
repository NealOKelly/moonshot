///// CONTENTS /////
// 1. READY //
// 2. NAVBAR //
// 3. CLASSIFICATION & FOLDER TREE //
// 4. RECORDS LIST PANEL //
// 5. RIGHT PANEL //
// 6. PROPERTIES PANEL //
// 7. MODALS //
// 8. MISCELLANEOUS //

// 1. READY //
$(document).ready(function()
	{
	$('#loading').modal('show')
	preauthenticateApi().then(function()
		{
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
// END READY //

// 2. NAVBAR //
// Click logout link
$(document).on("click", "#logout", function()
	{
	gtag('event', 'Logout');
	removeAPISessionCookies();
	$(location).attr("href", "/logout");
	})

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
		$("#properties-pane-placeholder").html('<img id="properties-pane-logo" src="img/gilbyim-logo-inline-white-2.png" alt="GilbyIM powered by Micro Focus Logo">') // I don't understand why this code is necessary.
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
		
		$("#search-input").val("")
		$("#folders-only").prop("checked", true)
		}
	})

$('#search-input').keydown(function (e){
    if(e.keyCode == 13){
    	$("#search-button").click()
		return false;
    }
})
// END NAVBAR //

// 3. CLASSIFICATION & FOLDER TREE //
$(document).on("click", "#all-files>span[class^='folder']", function()
	{
	doAllFilesSelected()
	})

$(document).on("click", "#all-files>span>a", function()
	{
	doAllFilesSelected()
	})

//////////////////////////////////////////////////////////////////////////////////////////////
$(document).on("click", "span[class^='folder']", function()
	{
	var node = $(event.target).parent();
	hideNewRecordForms()
	$("#search-results-pane").hide()
	$("#records-list-pane").show()
	classificationTreeNodeSelected(node)
	if(node.hasClass("classification-can-attach-records"))
		{
		populateRecordTypeField("classification", node.attr("id").substr(19)).then(function()
			{
			// Display the record type selector only if there is more than one record type than can be used with the classification.
			$("#new-folder-form-record-type-field-container").css("display", "none")
			if($("#new-folder-form-record-type>option").length>1)
				{
				$("#new-folder-form-record-type-field-container").css("display", "block")
				}	
			populateDataEntryFormPages("new-folder-form")
			})		
		}
	if(node.hasClass("folder-intermediate"))
		{
		$("#records-list-pane").html("<div class='no-records display-4'>Browse or search to display records.</div>")
		//$("#new-sub-folder-form-record-type").html("")
		populateContainerField("folder-intermediate", node.attr("id").substr(11))
		populateRecordTypeField("folder-intermediate", node.attr("id").substr(11)).then(function()
			{
			// Display the record type selector only if there is more than one record type than can be used with the classification.
			$("#new-sub-folder-form-record-type-field-container").css("display", "none")
			if($("#new-sub-folder-form-record-type>option").length>1)
				{
				$("#new-sub-folder-form-record-type-field-container").css("display", "block")
				}	
			populateDataEntryFormPages("new-sub-folder-form")
			})
		drawPropertiesTable("folder-intermediate")
		getRecordProperties("folder-intermediate", node.attr("id").substr(11))
		}
	if(node.hasClass("folder-terminal"))
		{
		getRecords(node.attr("id").substr(11))
		populateContainerField("folder-terminal", node.attr("id").substr(11))
		//$("#upload-form-record-type").html("")

		populateRecordTypeField("folder-terminal", node.attr("id").substr(11)).then(function()
		{
		$("#upload-form-record-type-field-container").css("display", "none")
		if($("#upload-form-record-type>option").length>1)
			{
			$("#upload-form-record-type-field-container").css("display", "block")
			}	
		populateDataEntryFormPages("upload-form")
		})
		drawPropertiesTable("folder-terminal")
		getRecordProperties("folder-terminal", node.attr("id").substr(11))
		}
	})

$(document).on("click", ".data-entry-form-tabs>li>a:not(.active)", function()
	{
	$(".data-entry-form-tabs>li>a").removeClass("active")
	$(event.target).addClass("active")
	$("#new-folder-form-page-items>div").css("display", "none")
	$("#new-folder-form-page-items-" + $(event.target).data("page-caption")).css("display", "block")
	})

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
//						console.log("dataEntryFormDefinition.length: " + dataEntryFormDefinition.Pages.length)
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
//						console.log("dataEntryFormDefinition.Pages.length:" + dataEntryFormDefinition.Pages.length)
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
				console.log("dataEntryFormDefinition:")
				console.log(dataEntryFormDefinition)
				
				for(i=0;i<dataEntryFormDefinition.Pages.length;i++)
					{
					if(dataEntryFormDefinition.Pages[i].Caption==pageCaption)
						{
//						console.log("Page Caption: " + pageCaption)
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
												
												
												
											
												//console.log("dataEntryFormDefinition.Pages[i].PageItems[x].LookupValues.length: " + dataEntryFormDefinition.Pages[i].PageItems[x].LookupValues.length)
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
										
										//$("#" + formName).append(inputHTML)											
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

$(document).on("click", ".classification-name>a", function()
	{
	hideNewRecordForms()
	$("#new-folder-form-tabs").html("")
	$("#new-folder-form-page-items").html("")
	$("#new-folder-form-record-type").empty()
	var node = $(event.target).parent().parent();

	$("#search-results-pane").hide()
	$("#records-list-pane").show()
	classificationTreeNodeSelected(node)
	if(node.hasClass("classification-can-attach-records"))
		{
		populateRecordTypeField("classification", node.attr("id").substr(19)).then(function()
			{
			// Display the record type selector only if there is more than one record type than can be used with the classification.
			$("#new-folder-form-record-type-field-container").css("display", "none")
			if($("#new-folder-form-record-type>option").length>1)
				{
				$("#new-folder-form-record-type-field-container").css("display", "block")
				}	
			populateDataEntryFormPages("new-folder-form")
			})		
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
		//$("#new-sub-folder-form-record-type").html("")
		populateContainerField("folder-intermediate", node.attr("id").substr(11))
		populateRecordTypeField("folder-intermediate", node.attr("id").substr(11)).then(function()
			{
			// Display the record type selector only if there is more than one record type than can be used with the classification.
			$("#new-sub-folder-form-record-type-field-container").css("display", "none")
			if($("#new-sub-folder-form-record-type>option").length>1)
				{
				$("#new-sub-folder-form-record-type-field-container").css("display", "block")
				}	
			populateDataEntryFormPages("new-sub-folder-form")
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
			//$("#upload-form-record-type").html("")

			populateRecordTypeField("folder-terminal", node.attr("id").substr(11)).then(function()
			{
			$("#upload-form-record-type-field-container").css("display", "none")
			if($("#upload-form-record-type>option").length>1)
				{
				$("#upload-form-record-type-field-container").css("display", "block")
				}	
			populateDataEntryFormPages("upload-form")
			})
			drawPropertiesTable("folder-terminal")
			getRecordProperties("folder-terminal", node.attr("id").substr(11))
			}
		}
	})
///////////////////////////////////////////////////////////////////////////////////////////////////////

// Click on collapsed caret
$(document).on("click", ".collapsed", function()
	{
	gtag('event', 'Expand Classification');
	var parentNodeId = $(event.target).parent().attr("id");
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
			gtag('event', 'Browse (to Folder)');
			}
		if($(this).parent().hasClass("folder-intermediate"))
			{
			refreshFolderNodes("record", $(this).parent().attr("id"))
			gtag('event', 'Browse (to Sub Folder)');
			}
		});
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
// END CLASSIFICATION & FOLDER TREE //

// 4. RECORDS LIST PANEL //
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
		
						//$("#records-list-pane").html("<div class='no-records display-4'>Browse or search to display records.</div>")
						//$("#new-sub-folder-form-record-type").html("")
						populateContainerField("folder-intermediate", uri)
						populateRecordTypeField("folder-intermediate", uri).then(function()
							{
							// Display the record type selector only if there is more than one record type than can be used with the classification.
							$("#new-sub-folder-form-record-type-field-container").css("display", "none")
							if($("#new-sub-folder-form-record-type>option").length>1)
								{
								$("#new-sub-folder-form-record-type-field-container").css("display", "block")
								}	
							populateDataEntryFormPages("new-sub-folder-form")
							})
						drawPropertiesTable("folder-intermediate")
						getRecordProperties("folder-intermediate", uri)
		
							break;
						case "folder-terminal":
							populateRecordTypeField("folder-terminal", uri).then(function()
								{
								populateContainerField("folder-terminal", uri)
								$("#upload-form-record-type-field-container").css("display", "none")
								if($("#upload-form-record-type>option").length>1)
									{
									$("#upload-form-record-type-field-container").css("display", "block")
									}	
								populateDataEntryFormPages("upload-form")
								})
								drawPropertiesTable("folder-terminal")
								getRecordProperties("folder-terminal", uri)
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

// END RECORDS LIST PANEL //

// 5. RIGHT PANEL //
$(document).on("change", "#new-folder-form-record-type", function()
	{
	populateDataEntryFormPages("new-folder-form")
	//populateAdditionalFields("classification")
	})

$(document).on("change", "#new-sub-folder-form-record-type", function()
	{
	//populateAdditionalFields("folder-intermediate")
	populateDataEntryFormPages("new-folder-form")
	})

// Create Folder
$(document).on("click", "#create-folder-button", function()
	{
	if($("#new-folder-form-page-item-RecordTypedTitle").val().length)
		{
		$("#create-folder-status").modal("show")
		recordTitle = $("#new-folder-form-page-item-RecordTypedTitle").val()
		recordClassificationUri = $("#new-folder-form-record-classification").data("classificationUri")
		//var recordClassificationUri = "534"
		var recordContainerUri;
		recordType = $("#new-folder-form-record-type").val()
		var additionalFieldKeys = [];
		var additionalFieldValues = [];
		for(i=0; i<$("#new-folder-form-page-items .additional-field").length; i++)
			{
			//console.log("Hello World: " + i)
			additionalFieldKeys.push($("#new-folder-form-page-items .additional-field").eq(i).attr("data-pageItem-name"))
			additionalFieldValues.push($("#new-folder-form-page-items .additional-field").eq(i).val())
			}
		console.log("additionalFieldKeys:" + additionalFieldKeys)
		console.log("additionalFieldKeys:" + additionalFieldValues)
		gtag('event', 'Create Folder');
		createFolder(recordTitle, recordClassificationUri, recordContainerUri, recordType, additionalFieldKeys, additionalFieldValues)
		}
	})

// Create Sub Folder
$(document).on("click", "#create-sub-folder-button", function()
	{
	console.log("Create sub folder button has been clicked.")
	if($("#new-sub-folder-form-page-item-RecordTypedTitle").val().length)
		{
		$("#create-folder-status").modal("show")
		recordTitle = $("#new-sub-folder-form-page-item-RecordTypedTitle").val()
		var recordClassificationUri;
		recordContainerUri = $("#new-sub-folder-form-record-container").data("record-Uri")		
		recordType = $("#new-sub-folder-form-record-type").val()
		var additionalFieldKeys = [];
		var additionalFieldValues = [];
		for(i=0; i<$("#new-sub-folder-form-page-items .additional-field").length; i++)
			{
			//console.log("Hello World: " + i)
			additionalFieldKeys.push($("#new-sub-folder-form-page-items .additional-field").eq(i).attr("data-pageItem-name"))
			additionalFieldValues.push($("#new-sub-folder-form-page-items .additional-field").eq(i).val())
			}
		console.log("additionalFieldKeys:" + additionalFieldKeys)
		console.log("additionalFieldKeys:" + additionalFieldValues)
		gtag('event', 'Create Folder');
		createFolder(recordTitle, recordClassificationUri, recordContainerUri, recordType, additionalFieldKeys, additionalFieldValues)
		}
	})





// Upload Form
$("#browse-button").click(function()
	{
	$("#upload-form-file").trigger("click"); // opening dialog
	gtag('event', 'Browse for File')
	document.activeElement.blur()
	return false; // avoiding navigation
    });

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

// This prevents dragOver and drop behaviours at a document level
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

// This may be redundant - check.
$("#browse-button").on(
	{
    dragover: function()
		{
        return false;
    	},
	});

function dragstart_handler(event)
	{
 	// Add this element's id to the drag payload so the drop handler will
 	// know which element to add to its tree
 	event.dataTransfer.setData("text/plain", event.target.id);
 	event.dataTransfer.effectAllowed = "move";
	}

function dropHandler(event)
	{
  	// Prevent default behavior (Prevent file from being opened)
  	event.preventDefault();

  	if(event.dataTransfer.items) 
		{
    	// Use DataTransferItemList interface to access the file(s)
	  	if(event.dataTransfer.items.length>1)
			{
			$("#drag-and-drop-error").modal("show")
			}
		else
			{
			console.log("Items Legth: " + event.dataTransfer.items.length)
				
			for(i=0;i<event.dataTransfer.items.length;i++)	
				{
				var entry = event.dataTransfer.items[i].webkitGetAsEntry();
				if (entry.isFile)
					{
				  	console.log("It's a file.")
					}
				else if (entry.isDirectory) 
					{
				  	console.log("It's a directory.")
					}
				}
			
			if(event.dataTransfer.items[0].kind === 'file')
				{
        		var file = event.dataTransfer.items[0].getAsFile();
				$("#drop-zone").data("file", file)
				$("#browse-button-container").css("display", "none")
				$("#file-details-container").css("display", "inline-block")
				$("#dropped-file-filetype-icon").addClass("fiv-icon-" + getFileExtension(file.name))
				var recordTitle = file.name.substr(0, file.name.length - (getFileExtension(file.name).length + 1))
				$("#dropped-file-name").html(file.name)
				$("#upload-form-page-item-RecordTypedTitle").val(recordTitle)
				gtag('event', 'Drop File')
      			}
			}
  		}
	}

function dragOverHandler(event)
	{
	// Prevent default behavior (Prevent file from being opened)
  	event.preventDefault();
	}

$(document).on("click", "#x-icon", function()
	{
	console.log("x-icon clicked.")
	clearForm("upload-form")
	gtag('event', 'Clear File Control')
	})

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
					var recordTitle = $("#upload-form-page-item-RecordTypedTitle").val()
					var recordType = $("#upload-form-record-type").val()
					var recordContainerUri = $("#upload-form-record-container").data("record-Uri")
					var additionalFieldKeys = [];
					var additionalFieldValues = [];
					for(i=0; i<$("#upload-form-page-items .additional-field").length; i++)
						{
						//console.log("Hello World: " + i)
						additionalFieldKeys.push($("#upload-form-page-items .additional-field").eq(i).attr("data-pageItem-name"))
						additionalFieldValues.push($("#upload-form-page-items .additional-field").eq(i).val())
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
// END RIGHT PANEL //

// 6. PROPERTIES PANEL //
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
			
			if(editableCellId.includes("properties-additional-fields"))
				{
				switch($("#" + editableCellId).data("field-definition-format"))
					{
					case "String":
						if($("#" + editableCellId).data("is-dropdown"))
							{
							alert("The fucker is a dropdown.")
							}
							
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

$(".date-input").keyup(function(event){
    var keycode = (event.keyCode ? event.keyCode : event.which);
    if(keycode == '13'){
    }
});
// END PROPERTIES PANEL //

// 7. MODALS //
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

$(document).on("click", "#drag-and-drop-error-ok-button", function()
	{
	$("#drag-and-drop-error").modal("hide")
	})

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

$(document).on("click", "#edit-properties-error-ok-button", function()
	{
	dismissEditPropertiesError()
	})

$(document).on("click", "#reauthenticate-button", function()
	{
	gtag('event', 'Click Reauthenticate Button');
	removeAPISessionCookies();
	$(location).attr("href","/logout");
	})
// END MODALS //

// 8. MISCELLANEOUS //
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
// END MISCELLANEOUS //