FROM node:14

WORKDIR /usr/src/pbl

COPY package.json ./

RUN npm install

COPY . .

EXPOSE 3000

CMD ["node", "server.js"]
