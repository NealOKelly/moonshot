////////SORTING

//NOTE: JQUERY IS CALLED WITH jqOPA, NOT $

//THIS FUNCTION IS CALLED WHENEVER THE ADD INSTANCE BUTTON IS CLICKED, INCLUDING THE COPY ROW ETC. 
//IT SHOULD ALWAYS BE INCLUDED IN THE RULEBASE

function sorting(control) {
	
		//only applies to entity collects with sort-table = on.  
		//note that it won't do anything for non-tabular entity collects
		var tableName = control.getCaption();
		//we use this to identify the table headers if more than one table on the page
		var columnTitles = new Array();
		for (i=0;i<control.getRows()[0].length;i++) {
			columnTitles[i] = control.getRows()[0][i].getCaption();
			//this creates an array of the question titles
			if (control.getRows()[0][i].getProperty("sort")!=="no" && control.getRows()[0][i].getValue) {
				//this excludes those which are sort=no and those which are labels
				var thisControlText = jqOPA("[aria-label='"+tableName+"'] [role='columnheader']:nth-child("+(i+1)+")").text();
				jqOPA("[aria-label='"+tableName+"'] [role='columnheader']:nth-child("+(i+1)+")").addClass("sortable-entity-column").attr("aria-label", thisControlText+" Click to sort");
			}
		}
		var entityRecords = new Array();
		jqOPA(".sortable-entity-column>div").off().on("click",function(){
			var colNumber = columnTitles.indexOf(this.innerHTML);
			if (control.getRows().length > 1) {
				//we only continue if there is more than one instance and not a non-sortable column
				var entityCount = control.getRows().length;
				//this gets us the column number we want to deal with
				for (i=0;i<entityCount;i++) {
					//for each row
					entityRecords[i] = new Array()
					for (j=0;j<columnTitles.length;j++) {
						//for each column in the current row
						if (control.getRows()[i][j].getValue) {
							//if not a label
							entityRecords[i][j] = control.getRows()[i][j].getValue()
							//we populate the array with the values
						}
					}
				}
				
				if (jqOPA(this).hasClass("orderedDown")) {
					//we see if we are already ordered down - if so, we order up
					jqOPA("[role='columnheader']>div").removeClass("orderedUp"); //remove class orderedUp if it exists
					jqOPA("[role='columnheader']>div").removeClass("orderedDown"); //remove class orderedUp if it exists
					jqOPA(this).addClass("orderedUp"); //apply class orderedUp so we know we're ordered up
					entityRecords.sort(function(a,b){ return a[colNumber] <= b[colNumber] ? 1 : -1; }); //sort the other way around
				} else {
					jqOPA("[role='columnheader']>div").removeClass("orderedUp"); //remove class orderedUp if it exists
					jqOPA("[role='columnheader']>div").removeClass("orderedDown"); //remove class orderedUp if it exists
					jqOPA(this).addClass("orderedDown"); //add class orderedDown - so we know it is ordered down
					entityRecords.sort(function(a,b){ return a[colNumber] >= b[colNumber] ? 1 : -1; }); //sort the main way around
				}
			
				//this sorts the arrays according to which column is clicked
				for (i=0;i<entityCount;i++) {
					//here we blank the canvas, ready to re-write from the array
					control.removeRow(i);
					control.addNewRow();
				}
				for (i=0;i<entityCount;i++) {
					//for each row
					for (j=0;j<columnTitles.length;j++) {
						//for each column in the current row
						if (control.getRows()[i][j].getValue) {
							//if not a label
							control.getRows()[i][j].setValue(entityRecords[i][j]);
							//we populate the values with the values from the sorted array
						}
					}
				}
				//the below 2 functions removes the ordering if either a value in the ordered column is changed or another row added
				jqOPA("[aria-label='"+tableName+"']").on("focus","div[role=row]>div:nth-child("+(colNumber+1)+")",function(){
					//add a focus event to all childs we care about.
					//this is needed because the change event will otherwise be stripped by OPA.  
					//This re-adds it, but only when we think it might change.
					jqOPA("[aria-label='"+tableName+"'] div[role=row]>div:nth-child("+(colNumber+1)+")").change(function(){
						//this is the actual change event.  We remove all classes (we are in the sorted column, so a blanket removal is okay)
						jqOPA("[role='columnheader']>div").removeClass("orderedUp"); //remove class orderedUp if it exists
						jqOPA("[role='columnheader']>div").removeClass("orderedDown"); //remove class orderedUp if it exists
					});
					jqOPA("[aria-label='"+tableName+"'] div[role=row]>div:nth-child("+(colNumber+1)+")").on("DOMNodeRemoved","div.opa-control",function(){
						//this is for drop downs which aren't affected by the above
						jqOPA("[role='columnheader']>div").removeClass("orderedUp"); //remove class orderedUp if it exists
						jqOPA("[role='columnheader']>div").removeClass("orderedDown"); //remove class orderedUp if it exists
					});
				});
				jqOPA("button[restylekey=entityAddButton]").click(function(){
					//this now does the same for the add row button.  
					jqOPA("[role='columnheader']>div").removeClass("orderedUp"); //remove class orderedUp if it exists
					jqOPA("[role='columnheader']>div").removeClass("orderedDown"); //remove class orderedUp if it exists
				});
			}
		});
		
	
}
