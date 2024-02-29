FROM node:21-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install

COPY . ./

RUN chmod +x docker-entry.sh

RUN npm install --global serve

EXPOSE 3000

CMD [ "./docker-entry.sh" ]