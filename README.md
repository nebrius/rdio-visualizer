Rdio Visualizer
===============

Part of a hackday project for Rdio. Takes raw data from the Rdio client and displays the real-time frequency data (like an equalizer) on a NeoPixel grid. See https://t.co/I04zMx2sqV to see everything in action.

This repo represents about 2/3 of the project. The remaining parts are Rdio specific, so they aren't shared here.

In short, there are three parts to the system: the client, the server, and the Arduino firmware.

The client code written for this project is specific to Rdio, but the output is pretty generic and could come from anywhere. The only thing the client needs to do is call the server with properly formatted FFT data. For our specific hackday, we used the [Meyda](https://github.com/hughrawlinson/meyda) framework, and used the "powerSpectrum" feature.
 
The server consists of a single HTTP endpoint, ```/```, which, when POSTed to, accepts url encoded data with a single parameter, 'powerSpectrum`, which is a JSON.stringified array of FFT raw data. The window size needs to be a power of two, ideally. The server takes this data and converts it to RGB raw data.

The firmware takes in serial data from the server and displays it on a NeoPixel grid. It has only been tested on https://www.adafruit.com/products/1430, but hypothetically should work on anything if you tweak the parameters properly.

See [index.js](https://github.com/bryan-m-hughes/rdio-visualizer/blob/master/server/index.js) for details and customization.

Note: this is a hackday project, and so the code is not well commented, abstracted, etc. Make of it what you will :).

License
=======

The MIT License (MIT)

Copyright (c) 2015 Bryan Hughes <bryan.hughes@rd.io> and Vanessa Li <vanessa.li@rd.io>

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
THE SOFTWARE.
