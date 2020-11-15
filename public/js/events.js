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
			}
		else
			{
			$("#session-expired").modal("show")
			}
		});
	})




$(document).on("click", "#upload-status-ok-button", function()
	{
    $("#upload-status").modal("hide")
	$("#upload-progress-bar").css("width", "0%")
	})


$(document).on("click", ".record-row", function()
	{
	if ($(event.target).hasClass("download") || $(event.target).hasClass("fiv-viv"))
		{
		var node = $(event.target).parent().parent();		
		}
	else
		{
		var node = $(event.target).parent()
		}
	$(".record-row").removeClass("row-selected")
	$("#classification-treeview li").removeClass("node-selected")
	$(node).addClass("row-selected")
	//$("#records-list-pane tr > td:nth-child(1) > span").removeClass("file-earmark-green")
	//$("#records-list-pane tr > td:nth-child(1) > span").addClass("file-earmark")
	$("#records-list-pane tr > td:nth-child(5) > span").removeClass("download-green")
	$("#records-list-pane tr > td:nth-child(5) > span").addClass("download")
	//$("#" + node.attr("id") + " > td:nth-child(1) > span").removeClass("file-earmark")
	//$("#" + node.attr("id") + " > td:nth-child(1) > span").addClass("file-earmark-green")
	$("#" + node.attr("id") + " > td:nth-child(5) > span").removeClass("download")
	$("#" + node.attr("id") + " > td:nth-child(5) > span").addClass("download-green")
	drawPropertiesTable("document")
	getRecordProperties("document", node.attr("id").substr(11))
	})





///// Classiciation Control Events /////
function classificationTreeNodeSelected(node)
	{
	//$("#records-list-pane").css("display", "none")
	$("#records-list-pane").html("Select a bottom-level folder to display records.")
	highlightSelectedNode(node)
	if((node).attr("id").substr(0, 19) == "classification-uri-")
		{
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


// Click on folder Icon //
$(document).on("click", ".folder", function()
	{
	var node = $(event.target).parent();
	classificationTreeNodeSelected(node)
	})

// Click on open folder icon //
$(document).on("click", ".folder-open", function()
	{
	var node = $(event.target).parent();
	classificationTreeNodeSelected(node)
	})

// Click on Classification Name Hyperlink //
$(document).on("click", ".classification-name>a", function()
	{
	var node = $(event.target).parent().parent();
	classificationTreeNodeSelected(node)
	})


// Click on folder-fill Icon //
$(document).on("click", ".folder-fill", function()
	{
	$("#records-list-pane").css("display", "block")
	var node = $(event.target).parent();
	highlightSelectedNode(node)
	if($(node).hasClass("folder-terminal"))
		{
		drawPropertiesTable("folder-terminal")
		getRecordProperties("folder-terminal", node.attr("id").substr(11))
		getRecords(node.attr("id").substr(11))
		}
	clearUploadForm()
	$("#upload-form-container").removeClass("upload-form-hidden")
	})


$(document).on("click", ".record-title>a", function()
	{
	var node = $(event.target).parent().parent();
	highlightSelectedNode(node)

	if($(node).hasClass("folder-intermediate"))
		{
		$("#records-list-pane").html("Select a bottom-level folder to display records.")
		//$("#records-list-pane").css("display", "none")
		drawPropertiesTable("folder-intermediate")
		getRecordProperties("folder-intermediate", node.attr("id").substr(11))	
		$("#upload-form-container").addClass("upload-form-hidden")
		clearUploadForm()
		}
	else
		{
		if($(node).hasClass("folder-terminal"))
			{
			$("#records-list-pane").css("display", "block")
			drawPropertiesTable("folder-terminal")
			getRecordProperties("folder-terminal", node.attr("id").substr(11))
			getRecords(node.attr("id").substr(11))
			$("#upload-form-container").removeClass("upload-form-hidden")
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

// Temporary link for testing session expiry modal.
$(document).on("click", ".download", function()
	{
	var recordUri = $(event.target).parent().parent().attr("id").substr(11)
	var recordTitle = $(event.target).parent().parent().data("recordTitle")
	var recordMimeType = $(event.target).parent().parent().data("recordMimeType")
	var recordExtension = $(event.target).parent().parent().data("recordExtension")
	downloadDocument(recordUri, recordTitle, recordExtension, recordMimeType)
	})

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
