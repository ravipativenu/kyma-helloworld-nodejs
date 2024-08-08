# kyma-helloworld-nodejs

</br>

#### Install dependencies

</br>

npm install

</br>

#### Run application locally

</br>

npm start

</br>

![alt text](images/IMG1.PNG)

</br>

![alt text](images/IMG2.PNG)

</br>

![alt text](images/IMG3.PNG)

</br>

![alt text](images/IMG4.PNG)

</br>

![alt text](images/IMG5.PNG)

</br>

#### Build container image using docker file

</br>

docker build -t ravipativenu/kyma-helloworld-nodejs:latest .

</br>

![alt text](images/IMG6.PNG)

</br>

![alt text](images/IMG7.PNG)

</br>

#### Run the container

</br>

docker run -d -p 3000:3000 ravipativenu/kyma-helloworld-nodejs:latest

</br>

![alt text](images/IMG8.PNG)

</br>

![alt text](images/IMG9.PNG)

</br>

Explore container image fiels and open them

</br>

![alt text](images/IMG10.PNG)

</br>

![alt text](images/IMG11.PNG)

</br>

#### Push container image to docker registry

</br>

![alt text](images/IMG12.PNG)

</br>

![alt text](images/IMG13.PNG)

</br>

#### Deploy application to kubernetes using Deployment

</br>

![alt text](images/IMG15.PNG)

</br>

![alt text](images/IMG16.PNG)

</br>

| Kubernetes Object           | Details          |
| --------------------------- | --------------- |
| ***Deployment***                  | ***Name***: deployment-kyma-helloworld-nodejs </br> ***Pod Name***: deployment-kyma-helloworld-nodejs-7684d89f54-slg6j |
| ***Replica Set***                 | ***Name***: deployment-kyma-helloworld-nodejs-7684d89f54 </br> ***Controlled By***: Deployment (deployment-kyma-helloworld-nodejs) </br> ***Limits***: CPU, Memory </br> ***Requests***: CPU, Memory    </br> ***Pod Name***: deployment-kyma-helloworld-nodejs-7684d89f54-slg6j                |
| ***Pod***                         | ***Name***: deployment-kyma-helloworld-nodejs-7684d89f54-slg6j  </br> ***Controlled By***: ReplicaSet (deployment-kyma-helloworld-nodejs-7684d89f54) </br> ***Containers***: kyma-helloworld-nodejs-container </br> ***Image***: ravipativenu/kyma-helloworld-nodejs|


</br>

View container logs

</br>

![alt text](images/IMG17.PNG)

</br>

## Create Service - Load balancer

</br>

![alt text](images/IMG18.PNG)

</br>

| Kubernetes Object     | Details          |
| --------------------- | --------------- |
| ***Deployment***      | ***Name***: deployment-kyma-helloworld-nodejs </br> ***Pod Name***: deployment-kyma-helloworld-nodejs-7684d89f54-slg6j  |
| ***Replica Set***     | ***Name***: deployment-kyma-helloworld-nodejs-7684d89f54 </br> ***Controlled By***: Deployment (deployment-kyma-helloworld-nodejs) </br> ***Limits***: CPU, Memory </br> ***Requests***: CPU, Memory    </br> ***Pod Name***: deployment-kyma-helloworld-nodejs-7684d89f54-slg6j                 |
| ***Pod***             | ***Name***: deployment-kyma-helloworld-nodejs-7684d89f54-slg6j  </br> ***Controlled By***: ReplicaSet (deployment-kyma-helloworld-nodejs-7684d89f54) </br> ***Containers***: kyma-helloworld-nodejs-container </br> ***Image***: ravipativenu/kyma-helloworld-nodejs|
| ***Service***         | ***Name***: service-kyma-helloworld-nodejs </br> ***Service Type***: LoadBalancer </br> ***Cluster IP***:
100.108.48.232 </br> ***Ports***: (80) --> (3000) </br> ***External IPs***: a7153076705b24c29b73ce3379116f5e-154082666.us-east-1.elb.amazonaws.com </br> ***Pod***: deployment-kyma-helloworld-nodejs-7684d89f54-slg6j                                                                                                            |

</br>

## Test service

</br>

![alt text](images/IMG19.PNG)

</br>

![alt text](images/IMG20.PNG)

</br>

