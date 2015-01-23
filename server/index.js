var express = require('express');
var bodyParser = require('body-parser');
var SerialPort = require('serialport').SerialPort;
var app = express();

var SCALING_FACTOR = 1;
var MAX_INTENSITY = 128;
var NUM_BANDS = 8;
var MAX_FREQ = 44100 / 2;

var debug = process.argv[2] == '-d';

if (debug) {
  run();
} else {
  var serialPort = new SerialPort('/dev/tty.usbmodem1421', {
    baudrate: 115200
  });

  serialPort.on('open', function(err) {
    if (err) {
      console.log('failed to open: ' + err);
      process.exit(1);
    }
    run();
  });
}

function run() {

  app.use(bodyParser.urlencoded({extended: false}));
  app.use(bodyParser.json());
  app.use(function(req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    next();
  });

  /*var lightState = 0;
  setInterval(function() {
    lightState++;
    if (lightState == 3) {
      lightState = 0;
    }
    var a1, a2, a3, b1, b2, b3, c1, c2, c3;
    if (lightState == 0) {
      a1 = 200;
      a2 = 0;
      a3 = 0;
      b1 = 0;
      b2 = 200;
      b3 = 0;
      c1 = 0;
      c2 = 0;
      c3 = 40;
    } else if (lightState == 1) {
      a1 = 0;
      a2 = 200;
      a3 = 0;
      b1 = 0;
      b2 = 0;
      b3 = 200;
      c1 = 200;
      c2 = 0;
      c3 = 0;
    } else if (lightState == 2) {
      a1 = 0;
      a2 = 0;
      a3 = 200;
      b1 = 200;
      b2 = 0;
      b3 = 0;
      c1 = 0;
      c2 = 200;
      c3 = 0;
    }
    writeToDevice(serializeRGB([
      [[a1, a2, a3], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0,  0,  0]],
      [[0,  0,  0],  [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0,  0,  0]],
      [[0,  0,  0],  [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0,  0,  0]],
      [[0,  0,  0],  [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0,  0,  0]],
      [[b1, b2, b3], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [c1, c2, c3]]
    ]));
  }, 1);*/

  app.post('/', function (req, res) {
    var powerSpectrum = JSON.parse(req.body['powerSpectrum']);
    var spectrumValues = bucketPowerSpectrum(powerSpectrum);
    var ledMatrix = calculateLEDs(spectrumValues);
    var serializedArray = serializeRGB(ledMatrix);
    writeToDevice(serializedArray);
    res.status(200).send('OK');
  });

  function bucketPowerSpectrum(powerSpectArray){
    var bucketedPowerArray = [];
    var buffSize = powerSpectArray.length;
    var binFreqRange = MAX_FREQ / buffSize;   // 2048 / 22050 = ~10.8Hz
    var freqBuckets = [64, 128, 256, 512, 1024, 2048, 4096, 8192];
    var curPSIdx = 0;
    var prevFreq = 0;

    for (var i = 0; i < NUM_BANDS; i++){
      var max = 0;
      var numBinsForBucket = Math.floor((freqBuckets[i] - prevFreq) / binFreqRange);
      prevFreq = freqBuckets[i];
      for (var j = 0; j < numBinsForBucket; j++) { // pick max energy peak from the frequency bins within the range of numBinsForBucket
        if (powerSpectArray[j + curPSIdx] > max) {
          max = powerSpectArray[j + curPSIdx];
        }
        curPSIdx++;
      }
      bucketedPowerArray[i] = max;
    }
    return bucketedPowerArray;
  }

  function calculateLEDs(spectrumValues) {
    var ledMatrix = [[], [], [], [], []];
    var lightMatrix = [];
    for (var i = 0; i < spectrumValues.length; i++) {
      lightMatrix[i] = Math.min(Math.max(Math.round(spectrumValues[i] * SCALING_FACTOR), 0), 5);
      for (var j = 0; j < lightMatrix[i]; j++) {
        //ledMatrix[4 - j][i] = [0, Math.floor((j+1) * MAX_INTENSITY / 4), 0];
        ledMatrix[4 - j][i] = [0, 36, 53];  // Rdio blue
      }
      for (; j < 5; j++) {
        ledMatrix[4 - j][i] = [20, 20, 20];
      }
    }
    return ledMatrix;
  }

  function serializeRGB(ledMatrix) {
    var serializedVals = [];
    var counter = 0;
    for (var i = 0; i < 5; i++) {
      for (var j = 0; j < 8; j++) {
        serializedVals[counter++] = ledMatrix[i][j][0]; // Red Value
        serializedVals[counter++] = ledMatrix[i][j][1]; // Green Value
        serializedVals[counter++] = ledMatrix[i][j][2]; // Blue Value
      }
    }
    return serializedVals;
  }

  var writeQueue = [];
  var busyWriting = false;
  function writeToDevice(serializedVals) {
    writeQueue.push(serializedVals.map(function(val) { return val }));

    if (!busyWriting) {
      pump();
    }

    function pump() {
      if (!writeQueue.length) {
        return;
      }
      if (!debug) {
        busyWriting = true;
      }
      var vals = writeQueue.shift();
      console.log('\n--------');
      for (var i = 0; i < vals.length; i += 3) {
        if (vals[i] != 20 && vals[i + 1] != 20 && vals[i + 2]) {
          process.stdout.write('*');
        } else {
          process.stdout.write('.');
        }
        if (i % (24) == 21) {
          process.stdout.write('\n');
        }
      }
      console.log('--------\n');
      var data = '';
      for (var i = 0; i < vals.length; i++) {
        data += ('00' + vals[i].toString(16)).slice (-2);
      }
      if (!debug) {
        serialPort.write(data, function() {
          setTimeout(function() {
            if (writeQueue.length) {
              pump();
            } else {
              busyWriting = false;
            }
          }, 50);
        });
      }
    }
  }

  var server = app.listen(3000, function () {

    var host = server.address().address;
    var port = server.address().port;

    console.log('Rdio Visualizer service listening at http://%s:%s', host, port);

  });

}
