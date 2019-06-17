# node:10.15.0-alpine
FROM node@sha256:409726705cd454a527af5032f67ef068556f10d3c40bb4cc5c6ed875e686b00e

WORKDIR /app

# takes both package and package-lock for CI
COPY package*.json ./

# prepare build process modules
RUN npm ci --no-progress

COPY . .

# questionable method of setting build defaults - this should be removed when
# tunneling is no longer required
RUN ./scripts/generate-dev-environment docker

RUN npm run build
RUN npm prune --production

EXPOSE 3000

CMD [ "npm", "start" ]
