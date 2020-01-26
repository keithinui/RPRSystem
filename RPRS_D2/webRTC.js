const Peer = window.Peer;
var room;
var peer;
var waveLogData = [];  // Log data of waveforms 
var lastTime;

(async function main() {
  const localVideo = document.getElementById('js-local-stream');
  const remoteVideos = document.getElementById('js-remote-streams');
  const roomId = document.getElementById('js-room-id');
  const roomMode = document.getElementById('js-room-mode');
  const localText = document.getElementById('js-local-text');
  const sendTrigger = document.getElementById('js-send-trigger');
  const messages = document.getElementById('js-messages');
  const meta = document.getElementById('js-meta');
  const sdkSrc = document.querySelector('script[src*=skyway]');
  const joinTrigger = document.getElementById('js-join-trigger');
  const jtDisplayOriginal = joinTrigger.style.display;

  meta.innerText = `
    UA: ${navigator.userAgent}
    SDK: ${sdkSrc ? sdkSrc.src : 'unknown'}
  `.trim();

  const getRoomModeByHash = () => (location.hash === '#sfu' ? 'sfu' : 'mesh');

  roomMode.textContent = getRoomModeByHash();
  window.addEventListener(
    'hashchange',
    () => (roomMode.textContent = getRoomModeByHash())
  );

  const localStream = await navigator.mediaDevices
    .getUserMedia({
      audio: true,
      video: true,
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
      joinTrigger.style.display = "none";
      leaveTrigger.style.display = ltDisplayOriginal;
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
        // Request Command data 
        textPR.innerHTML             = cData[0];
        textRR.innerHTML             = cData[1];
        statusSpo2.innerHTML         = cData[2];
        statusBatteryLavel.innerHTML = cData[3];
        
        console.log("Data number=" + cData[26] + " Status=" + cData[28] + " Checksum=" + cData[29]);

      }else{
        // Waveform data
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
        `[data-peer-id=${peerId}]`
      );
      remoteVideo.srcObject.getTracks().forEach(track => track.stop());
      remoteVideo.srcObject = null;
      remoteVideo.remove();

      messages.textContent += `=== ${peerId} left ===\n`;
    });

    // for closing myself
    room.once('close', () => {
      sendTrigger.removeEventListener('click', onClickSend);
      messages.textContent += '== You left ===\n';
      leaveTrigger.style.display = "none";
      joinTrigger.style.display = jtDisplayOriginal;

      // Before cloasing send command to stop sendeing data
      if(sendWaveforms == 1){ onClickSend(); }

      Array.from(remoteVideos.children).forEach(remoteVideo => {
        remoteVideo.srcObject.getTracks().forEach(track => track.stop());
        remoteVideo.srcObject = null;
        remoteVideo.remove();
      });
    });

    sendTrigger.addEventListener('click', onClickSend);
    leaveTrigger.addEventListener('click', () => room.close(), { once: true });


    /////////////////////////////////////////////////////////////////////////
    //  Request to send waveforms
    /////////////////////////////////////////////////////////////////////////
    function onClickSend() {
      if(sendWaveforms == 1){
        // Stop sending data and prepare display to send
        sendWaveforms = 0;
        sendTrigger.innerText = 'Send Waveforms';
        sendTrigger.style = "background:''; width:200px";

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
          waveLogData.length = 0;   // Clear log data
        }

      }else{
        // Clear the waveform window and start sending waveforms
        m_workDC.clearRect(0, 0, ox, oy);  // Clear all canvas
        sendWaveforms = 1;
        sendTrigger.innerText = 'Stop sending data';
        sendTrigger.style = "background:#00F00F; width:200px";
        initDisplay = 1;

        // Start Rehabilitation timer
        timer1 = setInterval("onOneSecRihaTimer()", 1000);
        startTime = 0;
      }

      // Send sendWaveform request
      let tmpData = "waveform" + String(sendWaveforms).trim() + "_";
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

      room.send(tmpData);        // Send comand and checksum
      lastTime = Date.now();     // Set current time for evaluation
    }
  });

  peer.on('error', console.error);
})();
