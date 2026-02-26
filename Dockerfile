FROM node:22.22.0-alpine3.22@sha256:7aa86fa052f6e4b101557ccb56717cb4311be1334381f526fe013418fe157384

RUN apk -U upgrade --available
WORKDIR /app

# Upgrade npm — if updating the Node.js version, check if this
# is still necessary and make sure it never downgrades npm
RUN npm install -g npm@11.10.1

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
RUN node ./scripts/generate-dev-environment.js docker

RUN npm run build
RUN npm prune --production

EXPOSE 3000

CMD [ "npm", "start" ]
