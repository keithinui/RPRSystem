//***************************************************************************
// Init registers
//***************************************************************************
var selectionNumber = 0;			// Selected row number
var currentNumber = 0;				// Current room number

// Table data   Row[0]:Header, Row[1]:Data,  Row[2]:Width in viewport width (100% of)
var patientDataArray = [
	// 
	['Room\n#', '開始日', '開始\n時間', 'ID', '氏名', '年齢', '性別', 'PR\nMax.', 'PR\n目標', 'SpO2\nMin.', '目標\n歩数', '負荷内容', '体温\nMax.', '体温\nMin.', 'NIBP\nSys.\nMax.', 'NIBP\nDia.\nMax.', 'Patient comments', '医師名\n技師名' ],
	['001', '2020/10/18', '14:00', '123456789', '福田 太郎', '75歳', '男', '150', '120', '90', '5,000', '', '37.0', '36.0', '120', '90', '', '順天 太郎'],
	[ 3, 6, 3, 6, 8, 3, 3, 3, 3, 3, 3, 12, 3, 3, 3, 3, 13, 6]
];

const selectionColor = "#90EE90"	// Color setup for selection in LightGreen
const tableRowheight = 4;


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
		if(tmp == 0) return;
		selectionNumber = tmp;
		let table = tr.parentNode.parentNode;

		table.rows[0].style.backgroundColor = "#b0b0b0";	// Set header colr for just in case
		for(let n=1; n<=table.rows["length"]-1; n++){
			table.rows[n].style.backgroundColor = "white";	// Reset all rows color in white
		}

		if(tr.sectionRowIndex>0){
			tr.style.backgroundColor = selectionColor;		// Set selection color
		}
	}
}, false);



//***************************************************************************
//Add row data to the tabel
//***************************************************************************
function addRowData(){

	let tObj = document.getElementById("tableK");
	let idy = 1;											// Number of first row
//	let idy = tObj.rows["length"];							// Number of last row
	let insObj = tObj.insertRow(idy);						// Insert row last

	let c = document.createElement("th"); insObj.appendChild(c);
	currentNumber++;
	c.innerHTML = String(currentNumber).padStart(3, '0');

	for(let n=1; n<=tObj.rows["length"]-1; n++){
		tObj.rows[n].style.backgroundColor = "white";		// Reset all rows color in white
	}
	tObj.rows[idy].style.backgroundColor = selectionColor;	// Set selection color
	selectionNumber = idy;

	for(let n=1; n<tObj.rows[0].cells.length; n++){
		insObj.insertCell(n).innerHTML = patientDataArray[1][n];
		tObj.rows[idy].cells[n].style.textAlign = "center";
		tObj.rows[idy].cells[n].style.height = tableRowheight + "vh";
	}
}


//***************************************************************************
//Delete row data of the tabel
//   Return value:
//		true:     deleted
//		false:    nothing
//***************************************************************************
function deleteRowData(){

	if(selectionNumber==0){
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
	if(selectionNumber==0){
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
		alert("No data lelected. \nPlease select before strting rehabilitation.");
		return;
	}


	let result = confirm("Are you sure to start rehabilitation with the patinet?");
 	if(result) {
		location.href = "../RPRS_D2/index.html";
	}else{
		return;
	}
}


//***************************************************************************
// Make table for init
//***************************************************************************
window.onload = function () {
	let tObj = document.getElementById("tableK");

	for(let r=0; r<tObj.rows["length"]; r++){

		if(r==1){
			tObj.rows[r].style.backgroundColor = selectionColor;	// Set selection color
		}

		for(let c=0; c<tObj.rows[0].cells.length; c++){
			if(r==0){
				tObj.rows[r].cells[c].style.width = String(patientDataArray[2][c])+"vw"; 
			}

			// Set data and align
			tObj.rows[r].cells[c].innerHTML = patientDataArray[r][c];
			tObj.rows[r].cells[c].style.textAlign = "center";
			tObj.rows[r].cells[c].style.height = tableRowheight +"vh";

		}
	}

	// Init data slection and room number
	selectionNumber = 1;
	currentNumber = 1;
}


