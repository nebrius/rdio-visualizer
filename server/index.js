var express = require('express');
var bodyParser = require('body-parser');
var SerialPort = require('serialport').SerialPort;
var app = express();

var NUM_BANDS = 8;
var BAND_HEIGHT = 5;
var MAX_FREQ = 44100 / 2;
var MAX_ENERGY = 35;

var SIGNAL_COLOR = [0, 20, 71];
var BACKGROUND_COLOR = [5, 5, 5];

var FREQUENCY_BUCKETS = [64, 128, 256, 512, 1024, 2048, 4096, 8192];

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
    var curPSIdx = 0;
    var prevFreq = 0;

    for (var i = 0; i < NUM_BANDS; i++){
      var max = 0;
      var numBinsForBucket;
      if (i == FREQUENCY_BUCKETS.length - 1) {
        numBinsForBucket = powerSpectArray.length - curPSIdx - 1;
      } else {
        numBinsForBucket = Math.floor((FREQUENCY_BUCKETS[i] - prevFreq) / binFreqRange);
      }
      prevFreq = FREQUENCY_BUCKETS[i];
      for (var j = 0; j < numBinsForBucket; j++) { // pick max energy peak from the frequency bins within the range of numBinsForBucket
        if (powerSpectArray[j + curPSIdx] > max) {
          max = powerSpectArray[j + curPSIdx];
        }
      }
      curPSIdx = j;
      var decibelVal = Math.min(0, Math.max(-50, 20 * Math.log(max / MAX_ENERGY) / Math.log(10)));  // convert to dB
      bucketedPowerArray[i] = Math.round((decibelVal + 50) / 10);
    }
    return bucketedPowerArray;
  }

  function calculateLEDs(spectrumValues) {
    var ledMatrix = [[], [], [], [], []];
    var lightMatrix = [];
    for (var i = 0; i < spectrumValues.length; i++) {
      lightMatrix[i] = Math.min(Math.max(Math.round(spectrumValues[i]), 0), BAND_HEIGHT);
      for (var j = 0; j < lightMatrix[i]; j++) {
        ledMatrix[BAND_HEIGHT - j - 1][i] = SIGNAL_COLOR;
      }
      for (; j < BAND_HEIGHT; j++) {
        ledMatrix[BAND_HEIGHT - j - 1][i] = BACKGROUND_COLOR;
      }
    }
    return ledMatrix;
  }

  function serializeRGB(ledMatrix) {
    var serializedVals = [];
    var counter = 0;
    for (var i = 0; i < BAND_HEIGHT; i++) {
      for (var j = 0; j < NUM_BANDS; j++) {
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
        if (vals[i] == SIGNAL_COLOR[0] && vals[i + 1] == SIGNAL_COLOR[1] && vals[i + 2] == SIGNAL_COLOR[2]) {
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
