const textPR = document.getElementById('textPR');
const textRR = document.getElementById('textRR');
const textBorg = document.getElementById('textBorg');
const leaveTrigger = document.getElementById('js-leave-trigger');
const container = document.getElementById("canvas_warp");
const picture = document.getElementById("js-remote-streams");


var heartRateData;                // 0. Heart rate data
var respRateData;                 // 1. Resp. rate data
var spo2 = 99;                    // 2. SpO" data
var batteryLevel;                 // 3. Battery Level
var dataSendWaveforms = [[]];     // Waveform Data to send (8ch x DataCount[ms])
var timer1 =0;                    // Interval timer for rehabilitation time
var timer2 =0;                    // Interval timer for getStats() API
var sendWaveforms = 0;            // 0: Send waveforms Off,      1: On
var calCommand = 0;               // 0: Cal Off,                 1: On
var ltDisplayOriginal ;
var startTime = 0;                // Rehabilitation time


// ********************************************************************
// Timer to get the Statistics data by getStats()
// ********************************************************************
function onStatisticsTimer() {
    const stats = await publication.getStats(subscriber);
    // stats is [{},{},{},...]
    stats.forEach((report) => {
        // When report is `RTCCodecStats` Object.
        if(report.type == "codec") {
            console.log(report.clockRate); // 90000
        }
    });
}

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
  // Hide Leave button
  leaveTrigger.style = "background:#00F00F";
  ltDisplayOriginal  = leaveTrigger.style.display;
  leaveTrigger.style.display = "none";

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

