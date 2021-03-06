const fs = require("fs");
const request = require("request");
const lpcm16 = require("node-record-lpcm16");
const randomstring = require("randomstring");
const config = require("./config.json");

//request.debug = true;

let pair = randomstring.generate({length: 16, charset: "hex", capitalization: "uppercase"});

//Start the microphone
const mic = lpcm16.start({
  sampleRateHertz: 16000,
  threshold: 0,
  verbose: false,
  silence: '10.0',
  device: 'plughw:1,0'
});

//Start the uploading (speech) stream:
let upOptions = {
  url: `https://www.google.com/speech-api/full-duplex/v1/up?key=${config.key}&pair=${pair}&output=json&lang=en-US&app=chromium&interim&continuous`,
  headers: {
    "Content-Type": "audio/l16; rate=16000",
    "Referer": "https://docs.google.com"
  }
}
mic.pipe(request.post(upOptions));

//Create a JSON stream parser
const parser = new require("stream").Writable({
  write: function(chunk, encoding, next) {
    let obj = JSON.parse(chunk);
    //console.log(obj);
    if(obj && obj.result && obj.result[0] && obj.result[0].alternative && obj.result[0].alternative[0] && obj.result[0].alternative[0].transcript && obj.result[0].final)
      console.log(obj.result[0].alternative[0].transcript);
    next();
  }
});

//Start the downloading (text) stream:
request.get(`https://www.google.com/speech-api/full-duplex/v1/down?key=${config.key}&pair=${pair}&output=json`).pipe(parser);
