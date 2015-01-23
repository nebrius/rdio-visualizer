var express = require('express');
var bodyParser = require('body-parser');
var app = express();

app.use(bodyParser.urlencoded({extended: false}));

app.use(bodyParser.json());

var SCALING_FACTOR = 1;
var MAX_INTENSITY = 128;
var NUM_BANDS = 8;

var mockData = new Array(256);
var bucketedPowerArray = [];

for (var i = 0; i < 512; i++) {
    mockData[i] = Math.random()
}

app.post('/', function (req, res) {
  var powerSpectrum = JSON.parse(req.body['powerSpectrum']);
  var spectrumValues = bucketPowerSpectrum(powerSpectrum);
  var ledMatrix = calculateLEDs(spectrumValues);
  var serializedArray = serializeRGB(ledMatrix);

  console.log(ledMatrix);
  console.log(serializedArray);
  res.status(200).send('OK');
});

var bucketPowerSpectrum = function(powerSpectArray){
  var windowSize = Math.floor(powerSpectArray.length/NUM_BANDS);
  for (var i = 0; i < NUM_BANDS; i++){
    var max = 0;
    for (var j = 0; j < windowSize; j++) {
      if (powerSpectArray[j + i * windowSize] > max) {
        max = powerSpectArray[j + i * windowSize];
      }
    }
    bucketedPowerArray[i] = max;
  }
  return bucketedPowerArray
};

var calculateLEDs = function(spectrumValues) {
  var ledMatrix = [[], [], [], [], [], [], [], []];
  var lightMatrix = [];

  for (var i = 0; i < spectrumValues.length; i++) {
    lightMatrix[i] = Math.min(Math.max(Math.round(spectrumValues[i] * SCALING_FACTOR), 0), 4);
    for (var j = 0; j <= lightMatrix[i]; j++) {
      ledMatrix[i][j] = [0, Math.floor((j+1) * MAX_INTENSITY / 4), 0];
    }
    for (; j < 5; j++) {
      ledMatrix[i][j] = [0, 0, 0];
    }
  }
  return ledMatrix;
};

var serializeRGB = function(ledMatrix) {
  var serializedVals = [];
  var counter = 0;
  for (var i = 0; i < NUM_BANDS; i++) {
    for (var j = 4; j >= 0; j--) {
      serializedVals[counter++] = ledMatrix[i][j][0]; // Red Value
      serializedVals[counter++] = ledMatrix[i][j][1]; // Green Value
      serializedVals[counter++] = ledMatrix[i][j][2]; // Blue Value
    }
  }
  console.log(serializedVals.length);
  return serializedVals;
};

var server = app.listen(3000, function () {

  var host = server.address().address;
  var port = server.address().port;

  console.log('Example app listening at http://%s:%s', host, port);

});
