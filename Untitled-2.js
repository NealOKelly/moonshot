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
