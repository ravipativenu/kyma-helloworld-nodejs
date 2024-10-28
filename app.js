let express = require('express');
let app = express();
var xsenv = require('@sap/xsenv');

//const { readK8SServices } = require('./lib/k8s');

app.get('/', function (req, res) {
  let obj = {
    endpoints: [
      "/ping",
      "/current-date",
      "/fibo/:n",
      "/getservices"
    ]
  };
  res.send(obj);
});

app.get('/ping', function (req, res) {
  res.send("pong");
});


app.get('/current-date', function (req, res) {
  let obj = {
    name: "current",
    value: new Date()
  };
  res.send(obj);
});

app.get('/fibo/:n', function (req, res) {
  let obj = {
    name: "fibo",
    value: fibo(req.params.n)
  };
  res.send(obj);
});

app.get('/getservices', function (req, res) {
  var services = xsenv.readServices();
  res.send(services);
});


app.listen(3000, function () {
  console.log('Example app listening on port 3000!');
});


function fibo(n) { // 1
  if (n < 2)
    return 1;
  else   return fibo(n - 3) + fibo(n - 1);
}