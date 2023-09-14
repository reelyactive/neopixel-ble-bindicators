neopixel-ble-bindicators
========================

REST API to light up individual NeoPixels associated with a specific cart/shelf/bin via a Bluetooth Low Energy link to a microcontroller.


Quick Start
-----------

Clone this repository, install package dependencies with `npm install`, and then from the root folder run at any time:

    npm start

__neopixel-ble-bindicators__ will attempt to connect with the Bluetooth Low Energy microcontroller defined in the config/bluetooth.json file, and accept requests to configure via API any LED strips connected to that microcontroller.


REST API
--------

__neopixel-ble-bindicators__'s REST API includes the following base route:
- /bindicators _to indicate one or more bins with specific LED settings_

### PUT /bindicators

Update the strips to indicate one or more bins with specific LED settings.

#### Example request

| Method | Route        | Content-Type     |
|:-------|:-------------|:-----------------|
| PUT    | /bindicators | application/json |

    [
      { "cart": "A", "shelf": 1, "bin": 2, "rgb": "0770a2" },
      { "cart": "B", "shelf": 3, "bin": 1, "rgb": [ 7, 112, 162 ] }
    ]

#### Example response

    {
      "_meta": {
        "message": "ok",
        "statusCode": 200
      },
      "_links": {
        "self": {
          "href": "http://localhost:3000/bindicators/"
        }
      }
    }

#### Notes

To turn off all LEDs, PUT /bindicators with an empty array (`[]`).


Configuration Files
-------------------

On startup, __neopixel-serial-bindicators__ will load all relevant files in the /config directory.

### strips-x.csv

The strips-x.csv files define the association of a chain of strips with the cart(s)/shelves/bins it serves to indicate.  The 'x' represents the id of the chain of strips with reference to the microcontroller (ex: strips-0.csv).

The first line of the file is ignored, and therefore typically used as a header defining each column to facilitate manual editing.  The second line, and all subsequent lines, are read into the configuration, each representing a specific shelf, and observe the following column ordering:

| Column | Title         | Description                                        |
|:-------|:--------------|:---------------------------------------------------|
| 1      | "cartName"    | String identifying the cart (ex: "1")              |
| 2      | "shelfId"     | Positive integer defining the shelf (ex: 2)        |
| 3      | "shelfWidth"  | Width of the shelf in mm (ex: 1000)                |
| 4      | "stripOffset" | Offset of the first LED of this shelf (ex: 0)      |
| 5      | "stripLength" | Number of LEDs associated with this shelf (ex: 60) |
| 6      | "isReverse"   | true if strip goes left-to-right, false otherwise  |
| 7      | "bin(1)"      | Offset in mm from the start of the shelf to the start of the first bin (ex: 0) |
| 7+n-1  | "bin(n)"      | Offset in mm from the start of the shelf to the start of the n-th bin (ex: 920) |

The line corresponding with the table above is as follows:
    "1",2,1000,0,60,true,0,...,920

### bluetooth.json

The bluetooth.json file defines the address of the Bluetooth Low Energy LED driver with which to connect, as follows:

    {
      "peripheralAddress": "b1:ed:57:21:44:e7"
    }


License
-------

MIT License

Copyright (c) 2023 [reelyActive](https://www.reelyactive.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, 
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN 
THE SOFTWARE.