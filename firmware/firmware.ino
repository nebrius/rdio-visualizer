#include <Adafruit_NeoPixel.h>

// Which pin on the Arduino is connected to the NeoPixels?
#define PIN 6

#define NUM_PIXELS 8 * 5
#define SERIAL_BUFFER_LENGTH NUM_PIXELS * 3
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
  for (int i = 0; i < NUM_PIXELS; i++) {
    pixels.setPixelColor(i, 0, 0, 0);
  }
  pixels.show();
}

void processColors() {
  for (int i = 0; i < NUM_PIXELS; i++) {
    Serial.flush();
    /*Serial.print(i, DEC);
    Serial.print(": ");
    Serial.print(serialBuffer[i * 3], DEC);
    Serial.print(", ");
    Serial.print(serialBuffer[i * 3 + 1], DEC);
    Serial.print(", ");
    Serial.print(serialBuffer[i * 3 + 2], DEC);
    Serial.print("\n");*/
    pixels.setPixelColor(i, pixels.Color(serialBuffer[i * 3], serialBuffer[i * 3 + 1], serialBuffer[i * 3 + 2]));
  }
  pixels.show();
}

void loop() {
  while (Serial.available() > 0) {
    Serial.readBytes(serialBuffer, SERIAL_BUFFER_LENGTH);
    processColors();
  }
}
