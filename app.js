let express = require('express');
let app = express();
const { readK8SServices } = require('./lib/k8s');
const { getDestEnv } = require("./lib/utils/vcap-utils")
const bootstrap = require('./lib/bootstrap')

let options = {};
let routerConfig = {};

app.get('/', function (req, res) {
  let obj = {
    endpoints: [
      "/ping",
      "/current-date",
      "/fibo/:n",
      "/k8sservices",
      "/vcaputils/getdestenv",
      "/getrouterconfig"
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

app.get('/k8sservices', function (req, res) {
  let obj = readK8SServices();
  res.send(obj);
});

app.get('/vcaputils/getdestenv', function (req, res) {
  let obj = getDestEnv();
  res.send(obj);
});

app.get('/getrouterconfig', function (req, res) {
  res.send(routerConfig);
});


app.listen(3000, function () {
  routerConfig = bootstrap(options);
  console.log('Example app listening on port 3000!');
});


function fibo(n) { // 1
  if (n < 2)
    return 1;
  else   return fibo(n - 3) + fibo(n - 1);
}