FROM node:18

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . /app

EXPOSE 5554
CMD [ "npm", "start" ]