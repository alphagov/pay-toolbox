FROM node:16.18.1-alpine3.16@sha256:868e2b6c8923d87a4bbfb157d757898061c9000aaaedf64472074fa7b62d0e72

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
