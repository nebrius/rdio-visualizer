#include <Adafruit_NeoPixel.h>

// Which pin on the Arduino is connected to the NeoPixels?
#define PIN 6

#define NUM_PIXELS 8 * 5
#define SERIAL_BUFFER_LENGTH NUM_PIXELS * 3 * 2
#define SERIAL_BAUD_RATE 115200

// When we setup the NeoPixel library, we tell it how many pixels, and which pin to use to send signals.
// Note that for older NeoPixel strips you might need to change the third parameter--see the strandtest
// example for more information on possible values.
Adafruit_NeoPixel pixels = Adafruit_NeoPixel(NUM_PIXELS, PIN, NEO_GRB + NEO_KHZ800);

unsigned short int serialBufferPosition = 0;
char serialBuffer[SERIAL_BUFFER_LENGTH];

void setup() {
  Serial.begin(SERIAL_BAUD_RATE);
  pixels.begin();
  for (unsigned int i = 0; i < NUM_PIXELS; i++) {
    pixels.setPixelColor(i, 0, 0, 0);
  }
  pixels.show();
  Serial.println(SERIAL_BUFFER_LENGTH, DEC);
}

int getNumFromBuffer(int pixel, int channel) {
  char digit[3];
  digit[0] = serialBuffer[pixel * 3 * 2 + channel * 2];
  digit[1] = serialBuffer[pixel * 3 * 2 + channel * 2 + 1];
  digit[2] = 0;
  return strtol(digit, NULL, 16);
}

void processColors() {
  for (unsigned int i = 0; i < NUM_PIXELS; i++) {
    getNumFromBuffer(i, 0);
    getNumFromBuffer(i, 1);
    getNumFromBuffer(i, 2);
    pixels.setPixelColor(i, pixels.Color(getNumFromBuffer(i, 0), getNumFromBuffer(i, 1), getNumFromBuffer(i, 2)));
  }
  pixels.show();
}

void loop() {
  while (Serial.available() > 0) {
    Serial.readBytes(serialBuffer, SERIAL_BUFFER_LENGTH);
    processColors();
  }
}
