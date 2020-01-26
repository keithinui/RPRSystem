        //***************************************************************************
        // Registers
        //***************************************************************************

        var FS = 12.5;                      // Sampling frequency 12.5Hz
        var Sweep = FS * 10;                // X axis length of the window (10s)
        var Vnew = [15];
        var xPoint = 0;

        var yLast = [15],xLast = [15];	    // Last draw point data
        var Voffset = [15];
        var ox = 1050, oy = 200;            // Recomandation of ox (800, 925, 1050, 1175, 1300)   ox = WaveStep * Sweep +stdW
        var stdW = 50;
        var Xpoint = stdW;
        var WaveSteps = stdW;
        var WaveStepsPerDot;	            // Number of count up step per sample
        var BufSize = 38;	            // 3s data
        var dSpeed = 1.0;
        var initDisplay = 1;                // Initialize display  1: On,   0: Off
        var displayResolution = 1;
	var instTimer = 0;
	var gain = 1.0;
	var patient = 0
	var DataCount = 2;                 // Data length in ms on one packet   160 ms
        var calTimer = 0;                  // Cal timer(200-161ms=0, 160-41ms=205, 40-1ms=0)
        var ch = 2;
        var m_workDC;
        var cvs;                           // Canvas
        var ecgLabel = ['Resp1','Resp2','-','-','-','-','-','-','-','-','-','-'];


        //***************************************************************************
        // Draw waveforms
        //***************************************************************************
        function displayWaveforms(data) {

	    for (let m = 0; m < DataCount; ++m) {
		// Initialize display parameters
		if(initDisplay == 1){
		  initDisplay = 0;
		  Xpoint = stdW;
                  WaveSteps = stdW;
		}

                // Display ECG labels
                if(Xpoint == stdW){
                    m_workDC.clearRect(0   , 0, stdW-1, oy);  // Clear left label area

                    m_workDC.fillStyle = "rgb(0, 255, 255)";
                    for (let q = 0; q < ch; q++) {
                        m_workDC.fillText(ecgLabel[q], 5, Voffset[q]-10, 40);
                    }
                }

                // Adjust data (Gain, Inst, Cal etc))
                for (let q = 0; q < ch; q++) {
                    // ***** Inst and lead calculations process *****
                    if(instTimer>0){
                        Vnew[q] = 0;			// Inst data
                    }else{
                        Vnew[q] = gain * data[m][q] / 80;
                    }
                }


                //***** Erase and draw waveformes *****/
                // Draw rease line
                if (Xpoint + WaveStep * 4 >= ox) {
                    i = Xpoint + WaveStep * 4 - ox + stdW - 1;
                } else {
                    i = Xpoint + WaveStep * 4 - 1;
                }
                m_workDC.clearRect(i , 0, WaveStep, oy);  // Left area

                // Draw time maker
                q = Math.round((ox -stdW) / (Sweep / FS) * dSpeed);  // 1s point onf canvas
                for (i = xLast[0]; i < Xpoint; i++){
                    if((Math.round(i) - stdW) % q == 0){
                        m_workDC.beginPath();
                        m_workDC.moveTo(i, oy - 10);
                        m_workDC.lineTo(i, oy     );

                        m_workDC.lineJoin = "round";
                        m_workDC.lineWidth = 2.0;
                        m_workDC.strokeStyle = "rgb(255, 255, 255)";
                        m_workDC.stroke();
                    }
                }

                // Draw waveforms
                for (q = 0; q < ch; q++) {
                    if(Xpoint != stdW){
                        m_workDC.beginPath();
                        m_workDC.moveTo(xLast[q], (Voffset[q] - yLast[q]));
                        m_workDC.lineTo(Xpoint,   (Voffset[q] - Vnew[q]));

                        m_workDC.lineCap = "round";
                        m_workDC.lineJoin = "round";
                        m_workDC.lineWidth = 2.0;
                        m_workDC.strokeStyle = "rgb(0, 255, 255)";
                        m_workDC.stroke();
                    }

                    yLast[q] = Vnew[q];
                    xLast[q] = Xpoint;
                }

                Xpoint += WaveStep * dSpeed / displayResolution;

                // Set pointers to the left point of windows
                if (Xpoint + WaveStep > ox) {
                    Xpoint = stdW;
                    //               DisplayLables();
                }
            }
        }
