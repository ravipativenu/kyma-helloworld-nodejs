let express = require('express');
const path = require('path');
let app = express();
const { readK8SServices } = require('./lib/k8s');
const { getDestEnv, getServiceEnv } = require("./lib/utils/vcap-utils")
const bootstrap = require('./lib/bootstrap')
const xsservices = require('./lib/env/xsservices')
const servicebingindservices = require('./lib/env/serviceBindingService')

let options = {};
let routerConfig = {};

app.get('/', function (req, res) {
  let obj = {
    endpoints: [
      "/ping",
      "/current-date",
      "/fibo/:n",
      "/k8sservices",
      "/utils/vcaputils/getdestenv",
      "/utils/vcaputils/getserviceenv",
      "/getrouterconfig",
      "/env/xsenv/loaddefaultservices",
      "/env/xsenv/filterservices",
      "/env/servicebindingservice/readfiles"
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

app.get('/utils/vcaputils/getdestenv', function (req, res) {
  let obj = getDestEnv();
  res.send(obj);
});

app.get('/utils/vcaputils/getserviceenv', function (req, res) {
  let obj = getServiceEnv();
  res.send(obj);
});

app.get('/getrouterconfig', function (req, res) {
  res.send(routerConfig);
});

app.get('/env/xsenv/loaddefaultservices', function (req, res) {
  let defaultServices = xsservices.loadDefaultServices(path.join(process.cwd(), 'default-services.json'));
  res.send(defaultServices);
});

app.get('/env/xsenv/filterservices', function (req, res) {
  let defaultServices = xsservices.filterServices({ "name" : "my-xsuaa" } );
  res.send(defaultServices);
});

app.get('/env/servicebindingservice/readservicebindingservices', function (req, res) {
  let serviceBindingRoot = servicebingindservices.readServiceBindingServices();
  res.send(serviceBindingRoot);
});

app.get('/env/servicebindingservice/readfiles', function (req, res) {
  let directoryData = servicebingindservices.readFiles(path.join(process.cwd(), "\\bindings\\xsuaa"));
  res.send(directoryData);
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