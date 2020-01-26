var textPR = document.getElementById('textPR');
var textRR = document.getElementById('textRR');
var sendCal = document.getElementById('js-send-calTrigger');
var leaveTrigger = document.getElementById('js-leave-trigger');

var heartRateData;                // 0. Heart rate data
var respRateData;                 // 1. Resp. rate data
var spo2 = 99;                    // 2. SpO" data
var batteryLevel;                 // 3. Battery Level
var dataSendWaveforms = [[]];     // Waveform Data to send (8ch x DataCount[ms])
var timer1 =0;                    // Interval timer
var sendWaveforms = 0;            // 0: Send waveforms Off,      1: On
var calCommand = 0;               // 0: Cal Off,                 1: On
var ltDisplayOriginal ;
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
  // Make position offset for each waveform
  for (var k = 0; k < ch; ++k) {
    Voffset[k] = (k + 1) * (oy / (ch + 1));
  }

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

  // Hide Leave button
  leaveTrigger.style = "background:#00F00F";
  ltDisplayOriginal  = leaveTrigger.style.display;
  leaveTrigger.style.display = "none";

  // Hide CAL button for all mode
  sendCal.style.display = "none";

}
