FROM node:16.17.1-alpine3.16@sha256:88d9d8da697877a4a771a40e5cbc10a12c2ad959e82f3b0f36ef35635e17f693

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
RUN node ./scripts/generate-dev-environment.js docker

RUN npm run build
RUN npm prune --production

EXPOSE 3000

CMD [ "npm", "start" ]
