const Peer = window.Peer;
var room;
var peer;
var waveLogData = [];  		// Log data of waveforms 
var lastTime;
var borgIndex;
var borgDialogOpen = 0;		// 0: dialog not open,        1: dialog open
var borgMeasurement = 0;	// 0: Stop borg measurement   1: Start borg measurement  
// var borgItems = ["未選択", "10 非常に強い", "9", "8", "7   とても強い", "6", "5    強い", "4    多少強い", "3", "2    弱い", "1    やや弱い", "0.5 非常に弱い", "0    感じない"];
var borgItems = ["未選択", "0    感じない", "0.5 非常に弱い", "1    やや弱い", "2    弱い", "3", "4    多少強い", "5    強い", "6", "7   とても強い", "8", "9", "10 非常に強い"];
var volumeLevel;			// Volume level of phone side (patient side)
var timerID;

(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const remoteVideos = document.getElementById('js-remote-streams');
  const roomId = document.getElementById('js-room-id');
  const roomMode = document.getElementById('js-room-mode');
  const localText = document.getElementById('js-local-text');
  const sendTrigger = document.getElementById('js-send-trigger');
  const sendBorg = document.getElementById('js-send-borgTrigger');
  const volumeUp = document.getElementById('js-volume-up');
  const volumeDown = document.getElementById('js-volume-down');
  const messages = document.getElementById('js-messages');
//  const meta = document.getElementById('js-meta');
//  const sdkSrc = document.querySelector('script[src*=skyway]');
  const joinTrigger = document.getElementById('js-join-trigger');
  const jtDisplayOriginal = joinTrigger.style.display;

//  meta.innerText = `
//    UA: ${navigator.userAgent}
//    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
//  `.trim();

  const getRoomModeByHash = () => (location.hash === '#sfu' ? 'sfu' : 'mesh');

  roomMode.textContent = getRoomModeByHash();
  window.addEventListener(
    'hashchange',
    () => (roomMode.textContent = getRoomModeByHash())
  );

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true
      },
      video: true
    })
    .catch(console.error);

  /////////////////////////////////////////////////////////////////////////
  // Render local stream
  localVideo.muted = true;
  localVideo.srcObject = localStream;
  localVideo.playsInline = true;
  await localVideo.play().catch(console.error);

  /////////////////////////////////////////////////////////////////////////
  // eslint-disable-next-line require-atomic-updates
  peer = (window.peer = new Peer({
    key: window.__SKYWAY_KEY__,
    debug: 3,
  }));

  /////////////////////////////////////////////////////////////////////////
  // Register join handler
  joinTrigger.addEventListener('click', () => {
    // Note that you need to ensure the peer has connected to signaling server
    // before using methods of peer instance.
    if (!peer.open) {
      return;
    }

    room = peer.joinRoom(roomId.value, {
      mode: getRoomModeByHash(),
      stream: localStream,
    });

    room.once('open', () => {
      messages.textContent = '=== You joined ===\n';
      joinTrigger.style.display = 'none';
      leaveTrigger.style.display = '';
      timerId = setInterval(timerFunction, 1000);
    });
    
    room.on('peerJoin', peerId => {
      messages.textContent += `=== ${peerId} joined ===\n`;
    });

    // Render remote stream for new peer join in the room
    room.on('stream', async stream => {
      const newVideo = document.createElement('video');
      newVideo.srcObject = stream;
      newVideo.playsInline = true;
      // mark peerId to find it later at peerLeave event
      newVideo.setAttribute('data-peer-id', stream.peerId);
      remoteVideos.append(newVideo);
      await newVideo.play().catch(console.error);
    });

    room.on('data', ({ data, src }) => {
      let cData = new Int16Array(data);
      if (cData.length == 30){
        // Measurement data (16bit * 30 words)
        textPR.innerHTML             = cData[0];
        textRR.innerHTML             = cData[1];
        statusSpo2.innerHTML         = cData[2];
        statusBatteryLavel.innerHTML = cData[3];

        // Borg dialog check (close or open) and display prompt
        let bData = cData[4];
        if(bData==0x80){
            promptBorg("状況:\n[回答選択中]", bData);
            borgDialogOpen = 1;
            sendBorg.style = "background:#00F00F";
        }
        if(borgDialogOpen==1){
            if((bData & 0x0f) !=0){promptBorg("状況:\n[回答選択中]", bData);}
            if((bData & 0x10) !=0){promptBorg("状況:\n[回答終了]", bData);}
            if((bData & 0x20) !=0){promptBorg("状況:\n[強制終了]", bData);}
            if((bData & 0x40) !=0){promptBorg("状況:\n[時間終了]", bData);}
        }

        console.log("Borg="+ cData[4] + " Data number=" + cData[26] + " Status=" + cData[28] + " Checksum=" + cData[29]);

		// Volume level
        statusVolumeLavel.innerHTML  = cData[6];

      }else{
        // Waveform data (20bytes data )
        let buffer0 = new ArrayBuffer(4);
        let buffer1 = new ArrayBuffer(4);
        let rData = [new Int16Array(buffer0), new Int16Array(buffer1)];   // 2 * 2 16bit integer array
        
        rData[0][0] = cData[0];    // Copy data from 1d array to 2d array
        rData[0][1] = cData[1];
        rData[1][0] = cData[2];
        rData[1][1] = cData[3];

        // Waveform log data to investigate communication quality
        for(let n=0; n<10; n++){
          waveLogData.push(cData[n]);
        }
        let currentTime = Date.now();
        waveLogData.push(currentTime - lastTime);    // Interval time in ms
        lastTime = currentTime;

        // Display waveforms
        if(sendWaveforms == 1){
          displayWaveforms(rData);    // Draw waveform
        }
      }
    });

    // for closing room members
    room.on('peerLeave', peerId => {
      const remoteVideo = remoteVideos.querySelector(
        `[data-peer-id="${peerId}"]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();

      messages.textContent += `=== ${peerId} left ===\n`;
    });

    // for closing myself
    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      sendBorg.removeEventListener('click', onClickSendBorg);
      volumeUp.removeEventListener('click', onClickVolumeUp);
      volumeDown.removeEventListener('click', onClickVolumeDown);
      messages.textContent += '== You left ===\n';
      leaveTrigger.style.display = 'none';
      joinTrigger.style.display = '';

      clearInterval(timerId)

      // Before cloasing send command to stop sendeing data
      if(sendWaveforms == 1){ onClickSend(); }

      Array.from(remoteVideos.children).forEach(remoteVideo => {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
    });

    sendTrigger.addEventListener('click', onClickSend);
    sendBorg.addEventListener('click', onClickSendBorg);
    volumeUp.addEventListener('click', onClickVolumeUp);
    volumeDown.addEventListener('click', onClickVolumeDown);
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });


    /////////////////////////////////////////////////////////////////////////
    //  Request to send waveforms
    /////////////////////////////////////////////////////////////////////////
    function onClickSend() {
      if(sendWaveforms == 1){
        // Stop sending data and prepare display to send
        sendWaveforms = 0;
        sendTrigger.innerText = 'Send Waveforms';
        sendTrigger.style = "background:'';";

        // Stop Rehabilitation time
        clearInterval(timer1);

        // Save waveform log data on Download folder in debug mode
        if(debugMode == 1){
          let fileName = "data.txt";
          let blob = new Blob([waveLogData], {type: "text/plain"});
          let a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.target = '_blank';
          a.download = fileName;
          a.click();
          waveLogData.length = 0;          // Clear log data
        }

      }else{
        // Clear the waveform window and start sending waveforms
        m_workDC.clearRect(0, 0, ox, oy);  // Clear all canvas
        sendWaveforms = 1;
        sendTrigger.innerText = 'Stop sending data';
        sendTrigger.style = "background:#00F00F;";
        initDisplay = 1;

        // Start Rehabilitation timer
        timer1 = setInterval("onOneSecRihaTimer()", 1000);
        startTime = 0;
      }

      // Send sendWaveform request
      let tmpData = "waveform" + String(sendWaveforms).trim() + "_";

      room.send(addChecksum(tmpData));     // Send comand and checksum
      lastTime = Date.now();               // Set current time for evaluation
    }

    /////////////////////////////////////////////////////////////////////////
    //  Request to open borg dialog
    /////////////////////////////////////////////////////////////////////////
    function onClickSendBorg() {
      let tmpData = "";
      if(borgDialogOpen == 0){
        // Open borg dialog
        tmpData = "openBorgDl";
      }else{
        // Close borg dialog
        tmpData = "closBorgDl";
      }

      room.send(addChecksum(tmpData));        // Send comand and checksum
    }

    /////////////////////////////////////////////////////////////////////////
    //  Request to control volume level
    /////////////////////////////////////////////////////////////////////////
    function onClickVolumeUp() {
      room.send(addChecksum("volumeUp__"));	  // Send comand and checksum
    }
    function onClickVolumeDown() {
      room.send(addChecksum("volumeDown"));	  // Send comand and checksum
    }


  });

  peer.on('error', console.error);
})();


/////////////////////////////////////////////////////////////////////////
// Add check sum last from text
/////////////////////////////////////////////////////////////////////////
function addChecksum(tmpData){
  let checksum = 0;

  // Make checksum data and convert it in complement
  for(let n=0; n < 10; n++){
    checksum += tmpData.charCodeAt(n);
  }
  checksum = 65536-checksum;

  // Convert checksum data in hex and fix degit and add it in last
  let tmpStr = checksum.toString(16).padStart(4, '0').substr(-2);
  tmpData = tmpData + tmpStr.substring(1, 2) + tmpStr.substring(0, 1);  // Command + 2nd + 1st degit checksum
  console.log("tmpData= " + tmpData);

  return tmpData;
}


/////////////////////////////////////////////////////////////////////////
// Display confirmation dialog for borg recived
//   Parameter(s):
//     borgData: 0x00 to 0x0c,   0x8x/0x4x/0x2x/0x1x
/////////////////////////////////////////////////////////////////////////
function promptBorg(myMessage, borgData){

	// Shape borgData and convert it to table data (12 over data is fixed to 0)
	borgData = borgData & 0x0f;
	let borgScale;
	if(borgData<0 || borgData>12){ borgData = 0; }
	borgScale = borgItems[borgData];
	borgIndex = borgData;

	// Set up title and message
	myTitle = "Borg Scale";
	myMessage = myMessage.replace(/\n/g, "<BR>");
	document.getElementById("idAlertTitle").innerHTML = myTitle;
	document.getElementById("idAlertMessage").innerHTML = myMessage;

	// Setup radio buttons
	document.radioButtons.elements[borgData].checked = true;

	// Display alert dialog
	document.getElementById("idAlert").style.visibility = "visible";
}

////////////////////////////////////////////////////////////////////////////////////
// Close borg check dialog and display result
////////////////////////////////////////////////////////////////////////////////////
function checkBorgClose(operation){
	// Hide alert fialog
	document.getElementById("idAlert").style.visibility = "hidden";

	if(operation == 1){
		let result;
		for(let i=0; i<13; i++){
			if(document.radioButtons.elements[i].checked){	result = i; }
		}
		borgIndex = result;
	}

	// Display final result content
	textBorg.innerHTML = borgItems[borgIndex];

        room.send(addChecksum("closBorgDl"));        // Send comand and checksum

        borgDialogOpen = 0;
        let sendBorg = document.getElementById('js-send-borgTrigger');
        sendBorg.style = "background:''";
}


/////////////////////////////////////////////////////////////////////////
// Captuer images
//
// WebRTC の方は getDisplayMedia で取り込むような感じかも。要調査
//
/////////////////////////////////////////////////////////////////////////
//var video = document.getElementById('js-remote-streams');
var video = document.getElementById('js-local-stream');    // if you need image of rocal stream
var capture = document.getElementById('capture');
var canvas = document.getElementById('draw');

video.onloadedmetadata = function(){ //動画が読み込まれてから処理を開始
    let canvasSizeX = 200; //canvasの幅
    let canvasSizeY = (canvasSizeX*video.videoHeight)/video.videoWidth; //canvasの高さ

    //capture
    capture.addEventListener('click',function(){
        console.log('pushed capture');
        canvas.getContext('2d').drawImage(video, 0, 0, canvasSizeX, canvasSizeY); //videoタグの「今」の状態をcanvasに描写
        console.log(canvas.toDataURL());   //base64でデータ化
    });
}


/////////////////////////////////////////////////////////////////////////
// RTCPeerConnection.getStats() Test
//
// 送受信データ量やパケットロス率などの各種統計情報を取得(Interval in 1s)
//
/////////////////////////////////////////////////////////////////////////
var timerFunction = function() {
	
    console.log("Timer");
	
    room.getStats(null).then(stats => {
    let statsOutput = "";

    stats.forEach(report => {
      statsOutput += `<h2>Report: ${report.type}</h2>\n<strong>ID:</strong> ${report.id}<br>\n` +
                     `<strong>Timestamp:</strong> ${report.timestamp}<br>\n`;

      // Now the statistics for this report; we intentionally drop the ones we
      // sorted to the top above

      Object.keys(report).forEach(statName => {
        if (statName !== "id" && statName !== "timestamp" && statName !== "type") {
          statsOutput += `<strong>${statName}:</strong> ${report[statName]}<br>\n`;
        }
      });
    });

    document.getElementById('js-meta').innerHTML += "Test/n";//statsOutput;
//    document.querySelector(".stats-box").innerHTML = statsOutput;
//    document.querySelector('script[src*=skyway]').innerHTML = statsOutput;

  });

};


