
jQuery( document ).ready( function() {

	new EventDetails();	
});

function EventDetails()
{
	var me = this;

	me.optionSet = {};
	
	me.PARAM_EVENTID = "@PARAM_EVENTID";
	me.PARAM_SERVER = "@PARAM_SERVER";
	me._query_EventDetails = "event?eventId=" + me.PARAM_EVENTID + "&server=" + me.PARAM_SERVER;
	
	me.HEADER_COLOR_RANGE = ["#c2c2c2", "#d2d2d2", "#e6e6e6"];
	me.COLOR_WHITE = "#f5f5f5";
	me.BIG_FONT_SIZE = 18;
	
	me.DE_ID_AssessmentScheduled = "M93RYt47CMK";
	me.DE_ID_Gap = "lI09tJv3h4z";
	me.DE_ID_ActionPlan = "Im5C86I2ObV";
	
	me.ATTR_ID_DeType = "IMVz39TtAHM";
	me.ATTR_ID_DeType_COMPOSITE_SCORE = "93";
	me.ATTR_ID_DeType_QUESTION = "92";
	me.ATTR_ID_CompositiveScoreValue = "k738RpAYLmz";
	me.ATTR_ID_QuestionOrder = "xf9iDHNFLgx";

	me.collapseAllLinkTag = $("#collapseAllLink");
	me.expandAllLinkTag = $("#expandAllLink");
	me.printLinkTag = $("#printLink");
	me.debugModeChkTag = $("#debugModeChk");
	me.expandAllTag = $("#expandAll");

	me.errorMsgTbTag = $("#errorMsgTb");
	me.errorMsgTag = $("#errorMsg");
	
	me.eventDataDivTag = $("#eventDataDiv");
	me.ouNameTag = $("#ouName");
	me.eventNameTag = $("#eventName");
	me.eventDateTag = $("#eventDate");
	me.showFailQuestionsTag = $("#showFailQuestions");
	me.eventDetailsTbTag = $("#eventDetailsTb");
	
	me.initialSetup = function()
	{
		MsgManager.appBlock( "Processing ..");
		me.setUp_Events();
		me.checkAndLoadEventDetails();
	};
	
	me.setUp_Events = function()
	{
		me.showFailQuestionsTag.change( function(){
			
			// Hide PASS questions
			if( $(this).prop("checked") )
			{
				me.eventDetailsTbTag.find("[isPass='true']").each(function(){
					var deId = $(this).attr("deId");
					$(this).hide();
					me.eventDetailsTbTag.find("tr[descripDeId='" + deId + "']" ).hide();
				});
			}
			else if( eval( me.expandAllTag.val() ) )
			{
				me.eventDetailsTbTag.find("tr[deId]").show();
			}
		});
		
		me.collapseAllLinkTag.click( function(){
			me.expandAllTag.val("false");
			me.eventDataDivTag.find("tr.question").hide();
			me.eventDataDivTag.find("tr[descripDeId]").hide();
			me.collapseAllLinkTag.hide();
			me.expandAllLinkTag.show();
		});
		
		me.expandAllLinkTag.click( function(){
			me.expandAllTag.val("true");
			me.eventDataDivTag.find("tr.question").show();
			me.showFailQuestionsTag.change();
			me.collapseAllLinkTag.show();
			me.expandAllLinkTag.hide();
		});
		
		me.debugModeChkTag.change( function(){
			var checked = me.debugModeChkTag.prop("checked");
			if( checked )
			{
				me.eventDataDivTag.find("span.deIdLink").show();
			}
			else
			{
				me.eventDataDivTag.find("span.deIdLink").hide();
			}
		});
		
		me.printLinkTag.click( function(){
			var table = $( jQuery.parseHTML( me.eventDataDivTag.prop('outerHTML') ) );
			
			var originalURL = window.location.origin + window.location.pathname.replace("feedback", "");
			
			// Add proper image logo address
			var logoTag = table.find("img");
			var imgAddress = originalURL + logoTag.attr("src");
			logoTag.attr("src", imgAddress);
			
			// Expand ALL
			table.find("[deId]").show();
			table.find("[descripdeId]").hide(); // Hide description
			
			//Hide PRINT button and Hide the "Collapse All"/"Expand All" and "Only show failed questions"
			table.find(".controlBar").hide();
			table.find("#printLink").hide();
			
			
			// Hide data element ids
			table.find(".deIdLink").hide();
			
			// Hide debug mode control
			table.find("#debugModeChk").closest( "div" ).hide();
			
			// Hide Color the score TEXT (NO BACKGROUND)
			
			table.find(".scoreValue").css("color", "");
			
			// PRINT
			 //var printContents = table.html();
		     // document.body.innerHTML = printContents;
		     // window.print();
			 
			 var printWindow = window.open('', '');
		     var doc = printWindow.document;
			 doc.write(table.html());
		    
			 printWindow.print();
			 printWindow.close();
			
		})
	};
	
	// --------------------------------------------------------------------------
	// Load data
	
	me.checkAndLoadEventDetails = function()
	{
		var eventId = Util.getParameterByName( "eventId" );
		
		// check eventId
		if( eventId == null || eventId == "" )
		{
			me.errorMsgTag.html("Event id is missing in URL");
			MsgManager.appUnblock();
		}
		else 
		{	
			me.loadEventDetails( eventId, me.getServerParam() );
		}
	};
	
	me.getServerParam = function()
	{
		var server = Util.getParameterByName( "server" );
		if( server == null || server === "" )
		{
			server = "https://data.psi-mis.org";
		}
		else if( server.lastIndexOf("/") == server.length - 1 )
		{
			server = server.substring(0, server.length - 1 );
		}
		
		return server;
	};
	
	me.loadEventDetails = function( eventId, server )
	{
		var url =  me._query_EventDetails;
		url = url.replace( me.PARAM_EVENTID, eventId );
		url = url.replace( me.PARAM_SERVER, server );
		
		RESTUtil.getAsyncData( url
			, function( json ){
				
				// STEP 1. Populate orgunitName, program name, ...
				me.ouNameTag.html( json.ou.name );
				me.eventNameTag.html( json.deList.program.name );
				
				// STEP 2. Build event table
				me.buildEventDataTable( json.deList.programStageDataElements );
				
				// STEP 3. Populate event data
				me.populateEventData( json.event, me.optionSet );
				me.eventDataDivTag.show();
				me.errorMsgTbTag.hide();
				
				MsgManager.appUnblock();
			}, function( data, b ){

				
				if( data.responseText == "" )
				{
					me.errorMsgTag.html("Server " + server + " not found - server could be offline.");
				}
				else
				{
					var jsonResponse = JSON.parse( data.responseText )
				
					var statusCode = jsonResponse.httpStatusCode;
					if( statusCode == 404 ) // STATUS_EVENT_NOTEXIST
					{	
						me.errorMsgTag.html("Event " + eventId + " doesn’t exist in server " + server );
					}
					else if( statusCode == 401 ) // STATUS_ACCOUNT_ISSUE
					{	
						me.errorMsgTag.html("Failed to authenticate in server " + server );
					}
				}
				MsgManager.appUnblock();
			}); 
	};
	
	
	me.buildEventDataTable = function( json_DataElements )
	{
		var data = me.resolveDataElements( json_DataElements );
		
		var compScoreList = data.compScoreList;
		var deList = data.deList;
		
		for( var i in compScoreList )
		{
			var compScoreKey = compScoreList[i];
			var comScoreDe = deList[compScoreKey];
			
			// STEP 1. Create row for TOP data element
			me.addDataRow( comScoreDe, compScoreKey, true );
			
			// STEP 2. Create the rows the SUB question if any
			var subQuestions = comScoreDe.subQuestions;
			if( subQuestions.length > 0  )
			{
				for( var j in subQuestions )
				{
					me.addDataRow( subQuestions[j], compScoreKey, false );
				}
			}
		}
	};
	
	me.resolveDataElements = function( json_DataElements )
	{
		var compScoreDeList = {};
		var compScoreList = [];
		
		for( var i in json_DataElements )
		{
			var dataElement = json_DataElements[i].dataElement;
			dataElement.compulsory = json_DataElements[i].compulsory;
			
			var attrValues = dataElement.attributeValues;
			for( var j in attrValues )
			{
				var attrValue = attrValues[j];
				
				// STEP 1. Get "Compositive Score" data elements
				if( attrValue.attribute.id == me.ATTR_ID_DeType && attrValue.value == me.ATTR_ID_DeType_COMPOSITE_SCORE )
				{
					var compScore = me.getAttribute( attrValues, me.ATTR_ID_CompositiveScoreValue ).value;

					// STEP 2. Save "Compositive Score" key in list
					compScoreList.push( compScore );
					
					// STEP 3. Add compScore in font of formName of data element if score is not "0"
					if( compScore !== "0")
					{
						dataElement.displayFormName = compScore + " " + dataElement.displayFormName;
					}
					
					//STEP 4. Get questions which belong to this TOP question
					dataElement.subQuestions = [];	
					dataElement.subQuestions = me.getQuestionsByCompScore( json_DataElements, compScore );
			
					//STEP 5. Add TOP question in result list
					compScoreDeList[compScore] = dataElement;
					
					//STEP 6. Get option set if any
					if( dataElement.optionSet != undefined )
					{
						me.optionSet[dataElement.id] = dataElement.optionSet.options;
					}
				}
			}
		}
		
		return {
			"compScoreList" : compScoreList.sort()
			,"deList": compScoreDeList
		};
	};
	
	me.addDataRow = function( dataElement, compScore, isCompScoreDE )
	{
		if( isCompScoreDE )
		{
			me.addCompScoreDERow( dataElement, compScore );
		}
		else
		{
			me.addDataValueRow( dataElement, compScore );
		}
		
		me.addDecriptionRow( dataElement );
	};
	
	me.addCompScoreDERow = function( dataElement, compScore )
	{
		var subHeaderLevel = compScore.split(".").length
		var style = "background-color:" + me.HEADER_COLOR_RANGE[subHeaderLevel - 1];
		var fontSize = me.BIG_FONT_SIZE - subHeaderLevel * 2;
		style += ";font-size:" + fontSize + "px";

		style += ";font-weight:bold";
		
		var server = me.getServerParam();
		var editDeLink = server + "/dhis-web-maintenance/#/edit/dataElementSection/dataElement/" + dataElement.id;
		var aLinkTag = "<span style='font-style:italic;display:none;' class='deIdLink'><a href='" + editDeLink +"' target='_blank'>(" + dataElement.id + ")</a></span>";
		
		
		var rowTag = $("<tr deId='" + dataElement.id + "' showed='true'></tr>");
		rowTag.append( "<td style='" + style + "'>" + dataElement.displayFormName + "<br>" + aLinkTag + "</td>" );
		rowTag.append( "<td style='" + style + "'></td>" );
		rowTag.append( "<td style='" + style + "'><span class='value' style='float:right;" + style + "'></span></td>" );
		
		me.eventDetailsTbTag.append( rowTag );
		
		me.setUp_CompScoreHeaderOnClick( rowTag, compScore );
	};
	
	me.setUp_CompScoreHeaderOnClick = function( rowTag, compScore )
	{
		if( compScore.indexOf(".") >= 0 )// Only apply onClick event for subHeader, such as 1.1, 1.2, 1.2.3, ...
		{
			rowTag.css("cursor", "pointer");
			rowTag.click( function(){
		
				var showed = eval( rowTag.attr("showed") );
				rowTag.attr( "showed", !showed );
				if( showed )
				{
					me.eventDetailsTbTag.find("tr[compScoreKey='" + compScore + "']").hide("fast");
				}
				else
				{
					me.eventDetailsTbTag.find("tr[compScoreKey='" + compScore + "']").show("fast");
				}
			});
		}
	};
	
	
	me.addDataValueRow = function( dataElement, compScore )
	{
		var server = me.getServerParam();
		var editDeLink = server + "/dhis-web-maintenance/#/edit/dataElementSection/dataElement/" + dataElement.id;
		var aLinkTag = "<span style='font-style:italic;display:none;' class='deIdLink'><a href='" + editDeLink +"' target='_blank'>(" + dataElement.id + ")</a></span>";
		var compulsoryTag = ( dataElement.compulsory ) ? "<span style='color:red;'> *</span>" : "";
		
		var rowTag = $("<tr compScoreKey='" + compScore + "' class='question' deId='" + dataElement.id + "' style='cursor:pointer;background-color:" + me.COLOR_WHITE  + "'  isPass='true'></tr>");
		rowTag.append( "<td><span class='deName'>" + dataElement.displayFormName + "</span>" + compulsoryTag + "<br>" + aLinkTag + "</td>" );
		rowTag.append( "<td class='value realValue'></td>" );
		rowTag.append( "<td class='status'></td>" );
		
		
		me.eventDetailsTbTag.append( rowTag );
		
		me.setUp_DecriptionRowToggle( rowTag );
	};
	

	me.addDecriptionRow = function( dataElement )
	{
		if( dataElement.description != undefined )
		{
			var rowTag = $("<tr style='display:none;' descripDeId='" + dataElement.id + "'></tr>");
			rowTag.append( "<td colspan='3'>" + dataElement.description + "</td>" );
			
			me.eventDetailsTbTag.append( rowTag );
		}
	};
	
	me.setUp_DecriptionRowToggle = function( rowTag ){
		rowTag.find("span.deName").click( function(){
			var deId = rowTag.attr("deId");
			me.eventDetailsTbTag.find( "tr[descripDeId='" + deId + "']" ).toggle();
		});
		
	};
	
	me.getQuestionsByCompScore = function( json_DataElements, compScore )
	{
		var list = [];
		for( var i in json_DataElements )
		{
			var dataElement = json_DataElements[i].dataElement;
			var attrValues = dataElement.attributeValues;
			
			var searched = me.getAttribute( attrValues, me.ATTR_ID_DeType );
			var isQuestion = ( searched !== undefined && searched.value == me.ATTR_ID_DeType_QUESTION ); // "Question" Data element
			
			if( isQuestion )
			{
				var deQuestion = me.getAttribute( attrValues, me.ATTR_ID_CompositiveScoreValue );
				
				if( deQuestion !== undefined && deQuestion.value == compScore )
				{
					list.push( dataElement );
				}
			}
		}
		
		return list;
	};
	
	me.getAttribute = function( attributeValues, attrId )
	{
		for( var i in attributeValues )
		{
			var attrValue = attributeValues[i];
			
			if( attrValue.attribute.id == attrId )
			{
				return attrValue;
			}
		}
		
		return;
	};
	
	// Populate event data values
	me.populateEventData = function( eventData, optionSet )
	{	
		// STEP 1. Populate eventDate
		me.eventDateTag.html( Util.formatDate( eventData.eventDate ) );
		
		// STEP 2. Populate data value
		var dataValues = eventData.dataValues;
		
		for( var i in dataValues )
		{
			var dataValue = dataValues[i];
			
			var valueTag = me.eventDataDivTag.find("tr[deId='" + dataValue.dataElement + "']").find(".value");
			if( valueTag.length > 0 )
			{
				var value = dataValue.value;
				var optionList = optionSet[dataValue.dataElement];
				if( optionList != undefined )
				{
					var searched = Util.findItemFromList( optionList, "code", value );
					if( searched != undefined )
					{
						dataValue = searched.name;
					}
				}
			
				if( valueTag.hasClass("realValue" ) )
				{
					value = ( value == 1 ) ? "Yes" : "No";
					valueTag.html( value );
					
					var statusValueTag = ( dataValue.value == "1" ) ? "<span style='color:green;float:right;'>PASS</span>" : "<span style='color:red;float:right;'>FAIL</span>";
					var statusTag = me.eventDetailsTbTag.find("tr[deId='" + dataValue.dataElement + "']").find(".status");
					statusTag.append( statusValueTag );
					statusTag.closest("tr").attr("isPass", ( dataValue.value == "1" ) );
				}
				else if( dataValue.dataElement == me.DE_ID_AssessmentScheduled )
				{
					valueTag.html( Util.formatDate( value ) );
				}
				else if( dataValue.dataElement == me.DE_ID_Gap
						|| dataValue.dataElement == me.DE_ID_ActionPlan )
				{
					valueTag.html( value );
				}
				else
				{
					me.setScoreValueAndColor( valueTag, value );
				}
			}
			
			
		}
		
		// Add FAIL status for NULL data values
		me.eventDetailsTbTag.find(".status:empty").each(function(){
			$(this).append( "<span style='color:#bfb9b9;float:right;'>NA</span>" );
		});
		
	};
	
	me.setScoreValueAndColor = function( valueTag, value )
	{
		if( value != "" )
		{
			value = eval( value );
			var color = "";
			
			if( value >= 90 )
			{
				color = "green";
			}
			else if( value >= 80 )
			{
				color = "yellow";
			}
			else
			{
				color = "red";
			}
			
			valueTag.addClass("scoreValue", true);
			valueTag.css( "color", color );
			valueTag.html( value + "%" );
		}
		
		
		/* if( value != "" )
		{
			value = eval( value );
			var color = "";
			
			if( value < 1 )
			{
				color = "#FFFFFF";
			}
			else if( value < 50 )
			{
				color = "#FF0000";
			}
			else if( value < 90 )
			{
				color = "#FFAA48";
			}
			else
			{
				color = "#00FF00";
			}
			
			valueTag.addClass("scoreValue", true);
			valueTag.css( "color", color );
			valueTag.html( value + "%" );
		} */
		
	}
	
	
	// --------------------------------------------------------------------------
	// RUN init method
	
	me.initialSetup();
	
}


