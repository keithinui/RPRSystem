const textPR = document.getElementById('textPR');
const textRR = document.getElementById('textRR');
const textBorg = document.getElementById('textBorg');
const container = document.getElementById("canvas_warp");
const picture = document.getElementById("js-remote-streams");


var heartRateData;                // 0. Heart rate data
var respRateData;                 // 1. Resp. rate data
var spo2 = 99;                    // 2. SpO" data
var batteryLevel;                 // 3. Battery Level
var dataSendWaveforms = [[]];     // Waveform Data to send (8ch x DataCount[ms])
var timer1 =0;                    // Interval timer for rehabilitation time
var sendWaveforms = 0;            // 0: Send waveforms Off,      1: On
var calCommand = 0;               // 0: Cal Off,                 1: On
var startTime = 0;                // Rehabilitation time


// ********************************************************************
//  Rihabilitation Timer
// ********************************************************************
function onOneSecRihaTimer() {
    startTime++;
    let mm = (Math.floor(startTime/60)).toString().padStart(2, '0');
    let ss = (startTime % 60).toString().padStart(2, '0');
    rihabilitationTime.innerHTML = mm + ":" + ss; 
}


// ********************************************************************
//  Initial setup
// ********************************************************************
window.onload = function () {
  console.log("onload event!!");

  //-------------------------------------------------------------------
  // Make position offset for each waveform
  for (var k = 0; k < ch; ++k) {
    Voffset[k] = (k + 1) * (oy / (ch + 1));
  }

  //-------------------------------------------------------------------
  // Make canvas and get its size
  cvs = document.getElementById("waveformCanvas");
  m_workDC = cvs.getContext('2d');
  cvs.setAttribute("width", ox * displayResolution);
  cvs.setAttribute("height", oy * displayResolution);
  m_workDC.scale(displayResolution, displayResolution);

  m_workDC.fillStyle = "#FFFFFF";
  m_workDC.font = "20px Verdana";
  m_workDC.textAlign = "left";
  m_workDC.textBaseline = "top";

  WaveStep = (ox - stdW) / Sweep;	            // Number of count up step per sample

  //-------------------------------------------------------------------
  // Make an event to cofirm closong window
  window.addEventListener('beforeunload', beforeUnloadEvent, false);

  //-------------------------------------------------------------------
  // Display picture in center
  container.scrollTop = 50; //(picture.height - container.clientHeight)/2;
  container.scrollLeft = 0; //(picture.width - container.clientWidth)/2;

}


//***************************************************************************
// beforeUnloadEvent
//***************************************************************************
var beforeUnloadEvent = function(e){
	let confirmMessage =  'Are you sure to close this application?';
	e.returnValue = confirmMessage;
	return confirmMessage;
}


//***************************************************************************
// Pointer events
//***************************************************************************
container.onmousedown = function(e) {

    console.log("onmousedown event!!");

    // 下記では、背景が大きくなるが肝心の画像の大きさはそのまま。
    // picture.style.height = '200%';

}

