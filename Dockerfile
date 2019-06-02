# node:10.15.0-alpine
FROM node@sha256:409726705cd454a527af5032f67ef068556f10d3c40bb4cc5c6ed875e686b00e as base

WORKDIR /cache

# takes both package and package-lock for CI
COPY package*.json ./

FROM base AS dependencies

# ensure removed dependencies are cleaned up - RUN npm prune
# prepare production build modules
RUN npm install --only=production --no-progress
RUN cp -R node_modules production_node_modules

# prepare build process modules
RUN npm ci --no-progress

FROM dependencies as build

WORKDIR /app

COPY --from=dependencies /cache/node_modules ./node_modules

# current folder assets into working directory
COPY . .

# questionable method of setting build defaults - this should be removed when
# tunneling is no longer required
RUN ./scripts/generate-dev-environment docker

RUN npm run build

# FROM base AS release - aliasing this triggers a bug in Jenkins pipeline, it cannot inspect 
# an aliased multi-stage, extend the original image as a temporary workaround
FROM node@sha256:409726705cd454a527af5032f67ef068556f10d3c40bb4cc5c6ed875e686b00e

WORKDIR /app

COPY --from=dependencies /cache/production_node_modules node_modules
COPY --from=build /app/dist dist

COPY --from=build /app/package.json .
COPY --from=build /app/.env .

EXPOSE 3000

CMD [ "npm", "start" ]
