//***************************************************************************
// Init registers
//***************************************************************************
var selectionNumber = 0;			// Selected row number
var currentNumber = 0;				// Current room number
var cp0 = 0;						// Cell offset to adjust deleted header cells

// Table data   Row[0]:Header, Row[1]:Data,  Row[2]:Width in viewport width (100% of)
var patientDataArray = [
	// 
	['Room\n#', '開始日', '開始\n時間', 'ID', '氏名', '年齢', '性別',   'PR',   'PR', 'SpO2\nMin.', '目標\n歩数', '負荷内容', '体温', '体温', 'NIBP\nSys.\nMax.', 'NIBP\nDia.\nMax.', 'Patient comments', '医師名\n技師名' ],
	[       '',       '',           '',   '',     '',     '',     '', 'Min.', 'Max.',           '',           '',         '', 'Min.', 'Max.',                 '',                 '',                 '',               '' ],
	['001', '2020/10/18', '14:00', '123456789', '福田 太郎', '75歳', '男', '150', '120', '90', '5,000', '', '37.0', '36.0', '120', '90', '', '順天 太郎'],
	[ 3, 6, 3, 6, 8, 3, 3, 3, 3, 3, 3, 12, 3, 3, 3, 3, 13, 6]
];

const selectionColor = "linear-gradient(to bottom, #e0eee0, #70ee70)";	// Color setup for selection in LightGreen
const defaultColr = "linear-gradient(to bottom, white, white)";
const dataTableRowheight = 4;
const headerColor0 = "linear-gradient(to bottom, #808080, #808080)";
const headerColor1 = "linear-gradient(to bottom, #808080, #808080)";


//***************************************************************************
// Event contoroller for the table
//***************************************************************************
const fp = (e, n) => {
	while (e) {
    	if (e.tagName === n) break;
    	e = e.parentNode;
	}
	return e;
}

document.addEventListener ('click', e => {
	let tr = fp (e.target, 'TR');
	if (tr){
		let tmp = tr.sectionRowIndex;						// Get selection number of table
		if(tmp==0 || tmp ==1) return;
		selectionNumber = tmp;
		let table = tr.parentNode.parentNode;

		table.rows[0].style.background = headerColor0;		// Set header color for just in case
		table.rows[1].style.background = headerColor1;		// Set header color for just in case
		for(let n=2; n<=table.rows["length"]-1; n++){
			table.rows[n].style.background = defaultColr;	// Reset all rows color in white
		}

		if(tr.sectionRowIndex>0){
			tr.style.background = selectionColor;			// Set selection color
		}
	}
}, false);



//***************************************************************************
//Add row data to the tabel
//***************************************************************************
function addRowData(){

	let tObj = document.getElementById("tableK");
	let idy = 2;											// Number of first row
//	let idy = tObj.rows["length"];							// Number of last row
	let insObj = tObj.insertRow(idy);						// Insert row

	let c = document.createElement("th"); insObj.appendChild(c);
	currentNumber++;
	c.innerHTML = String(currentNumber).padStart(3, '0');

	for(let n=2; n<=tObj.rows["length"]-1; n++){
		tObj.rows[n].style.background = defaultColr;		// Reset all rows color in white
	}
	tObj.rows[idy].style.background = selectionColor;		// Set selection color
	selectionNumber = idy;

	// Set initial data in each cell
	for(let n=1; n<tObj.rows[0].cells.length+ cp0; n++){
		insObj.insertCell(n).innerHTML = patientDataArray[2][n];
		tObj.rows[idy].cells[n].style.textAlign = "center";
		tObj.rows[idy].cells[n].style.height = dataTableRowheight + "vh";
	}
}


//***************************************************************************
//Delete row data of the tabel
//   Return value:
//		true:     deleted
//		false:    nothing
//***************************************************************************
function deleteRowData(){

	if(selectionNumber<2){
		alert("No data lelected. \nPlease select data before deleting.");
		 return false;
	}

	let tObj = document.getElementById("tableK");
	let idy = tObj.rows["length"];
	if(idy<2) return false;
	let result = confirm("Are you sure to delete selected data?");
 	if(result) {
		tObj.deleteRow(selectionNumber);					// Delete selected data
		selectionNumber = 0;
		return true;
	}else{
		return false;
	}
}


//***************************************************************************
// Exit Windows
//***************************************************************************
function exitWindows(){
	console.log ("Event: exitWindows");

	let result = confirm("Are you sure to exit RPR System?");
 	if(result) {
		// Remove comfirmation dialog event
		window.removeEventListener('beforeunload', beforeUnloadEvent, false);
		// Back to previous page
		location.href = "../Password/index.html";
	}else{
		return;
	}
}


//***************************************************************************
// Edit Data
//***************************************************************************
function editData(){
	console.log ("Event: editData");
	// Data selecited ?
	if(selectionNumber > 2){
		alert("No data lelected. \nPlease select data before editing.");
	}else{

		// Jump to edit page
		alert("Under construction!!");
	}
}


//***************************************************************************
// Start Rehabilitation
//***************************************************************************
function startRehabilitation(){
	console.log ("Event: startRehabilitation");
	// Data selecited ?
	if(selectionNumber==0){
		alert("No data selected. \nPlease select before strting rehabilitation.");
		return;
	}


	let result = confirm("Are you sure to start rehabilitation with the patinet?");
	if(result) {
		// Remove comfirmation dialog event
		window.removeEventListener('beforeunload', beforeUnloadEvent, false);
		// Jump to next page
		location.href = "../RPRS_D2/index.html";
	}else{
		return;
	}
}


//***************************************************************************
// onload event
//***************************************************************************
window.onload = function () {
	//***************************************************************************
	// Make table for init 
	let cp1 = 0;
	let tObj = document.getElementById("tableK");

	tObj.rows[0].style.background = headerColor0;				// Set header color
	tObj.rows[0].style.color = "white";							// Set header font color
	tObj.rows[1].style.background = headerColor1;				// Set header color
	tObj.rows[1].style.color = "white";							// Set header font color
	tObj.rows[2].style.background = selectionColor;				// Set selection color

	for(let r=0; r<tObj.rows["length"]; r++){

		for(let c=0; c<tObj.rows[0].cells.length; c++){
			switch(r){
			case 0:
				tObj.rows[r].cells[c].style.width = String(patientDataArray[3][c])+"vw";

				// Set the same group if no contents
				if(patientDataArray[1][c] == ""){
					tObj.rows[0].cells[c].rowSpan = "2";
					tObj.rows[1].deleteCell(-1);
				}

				tObj.rows[r].cells[c].innerHTML = patientDataArray[r][c];
				tObj.rows[r].cells[c].style.textAlign = "center";
				break;

			case 1:
				// Set data and align
				if(patientDataArray[r][c] != ""){
					tObj.rows[r].cells[cp1].innerHTML = patientDataArray[r][c];
					tObj.rows[r].cells[cp1].style.textAlign = "center";
					cp1++;
				}
				break;

			case 2:
				tObj.rows[r].cells[c].innerHTML = patientDataArray[r][c];
				tObj.rows[r].cells[c].style.textAlign = "center";
				tObj.rows[r].cells[c].style.height = dataTableRowheight +"vh";
			}
		}
	}

	// Set the same group if next content is the same
	let r=0;
	for(let c=0; c<tObj.rows[0].cells.length - 1; c++){
		if(patientDataArray[r][c+cp0]==patientDataArray[r][c+cp0+1]){
			tObj.rows[r].cells[c].colSpan = "2";
			tObj.rows[r].deleteCell(c+1);
			cp0++;
		}
	}


	// Init data slection and room number
	selectionNumber = 2;
	currentNumber = 2;


	//***************************************************************************
	// Make confamation dialog event
	window.addEventListener('beforeunload', beforeUnloadEvent, false);

}

//***************************************************************************
// beforeUnloadEvent
//***************************************************************************
var beforeUnloadEvent = function(e){
	let confirmMessage =  'Are you sure to close this application?';
	e.returnValue = confirmMessage;
	return confirmMessage;
}




