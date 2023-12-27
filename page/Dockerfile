FROM node:14

WORKDIR /usr/src/pbl

COPY package.json ./

RUN apt-get update && apt-get -y install cmake
RUN export OPENCV4NODEJS_DISABLE_AUTOBUILD=0
RUN export OPENCV4NODEJS_AUTOBUILD_OPENCV_VERSION=4.1.0
RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
