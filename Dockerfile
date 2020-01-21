FROM node@sha256:cf63399ae3f4a1424a7776dac98ba088966a727089d7915915ed90db87da141b

WORKDIR /app

# takes both package and package-lock for CI
COPY package*.json ./

# prepare build process modules
RUN npm ci --no-progress

# ideally command is COPY scr/ scripts/ tsconfig.json ./
# COPY flattens file structures so this is not possible inline right now
# ref: https://github.com/moby/moby/issues/15858
COPY src/ src
COPY scripts/ scripts
COPY tsconfig.json tsconfig.json

# questionable method of setting build defaults - this should be removed when
# tunneling is no longer required
RUN ./scripts/generate-dev-environment docker

RUN npm run build
RUN npm prune --production

EXPOSE 3000

CMD [ "npm", "start" ]
