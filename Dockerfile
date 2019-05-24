# node:10.15.0-alpine
FROM node@sha256:409726705cd454a527af5032f67ef068556f10d3c40bb4cc5c6ed875e686b00e

WORKDIR /app 

# also take package.lock? 
# copies packages first for docker caching mechanisms
COPY package*.json ./

RUN npm install

# current folder assets into working directory
COPY . .

# questionable method of setting build defaults - this should be removed when
# tunneling is no longer required
RUN apk add bash
RUN ./scripts/generate-dev-environment docker

EXPOSE 3000

CMD [ "npm", "start" ]
