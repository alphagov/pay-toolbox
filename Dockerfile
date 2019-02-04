FROM node:10.15.0-alpine

WORKDIR /app 

# also take package.lock? 
# copies packages first for docker caching mechanisms
COPY package*.json ./

RUN npm install

# copy this folder into WORKDIR directory
COPY . .

RUN apk add bash
# hacky method of setting build defaults - this should be removed when
# tunneling is no longer required
# RUN chmod +x /app/scripts/generate-dev-environment && . /app/scripts/generate-dev-environment
RUN ./scripts/generate-dev-environment docker

EXPOSE 3000

CMD [ "npm", "start" ]
