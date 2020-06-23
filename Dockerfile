FROM node:14.4.0-alpine3.12@sha256:5180b22a23480404267d695999856bec64d1c9b75144125db399f053da1ad89d

WORKDIR /app

# takes both package and package-lock for CI
COPY package*.json ./

# prepare build process modules
RUN npm ci --no-progress

# ideally command is COPY scr/ scripts/ tsconfig.json ./
# COPY flattens file structures so this is not possible inline right now
# ref: https://github.com/moby/moby/issues/15858
COPY src/ src
COPY browser/ browser
COPY scripts/ scripts
COPY tsconfig.json tsconfig.json
COPY webpack.config.js webpack.config.js

# questionable method of setting build defaults - this should be removed when
# tunneling is no longer required
RUN ./scripts/generate-dev-environment docker

RUN npm run build
RUN npm prune --production

EXPOSE 3000

CMD [ "npm", "start" ]
