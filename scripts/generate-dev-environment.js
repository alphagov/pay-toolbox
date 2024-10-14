const fs = require('fs')

const ENV_FILE = '.env'

const LOCAL_URL_MAP =`ADMINUSERS_URL=http://127.0.0.1:9700
CONNECTOR_URL=http://127.0.0.1:9300
PRODUCTS_URL=http://127.0.0.1:18000
PUBLIC_AUTH_URL=http://127.0.0.1:9600
LEDGER_URL=http://127.0.0.1:10700
WEBHOOKS_URL=http://127.0.0.1:10800
SELFSERVICE_URL=http://127.0.0.1:9400`

const TUNNEL_URL_MAP =`ADMINUSERS_URL=https://localhost:9001
CONNECTOR_URL=https://localhost:9003
PRODUCTS_URL=https://localhost:9005
PUBLIC_AUTH_URL=https://localhost:9006
LEDGER_URL=https://localhost:9007
WEBHOOKS_URL=https://localhost:9008
SELFSERVICE_URL=https://selfservice.pymnt.uk`

const DOCKER_URL_MAP =`ADMINUSERS_URL=https://docker.for.mac.localhost:9001
CONNECTOR_URL=https://docker.for.mac.localhost:9003
PRODUCTS_URL=https://docker.for.mac.localhost:9005
PUBLIC_AUTH_URL=https://docker.for.mac.localhost:9006
LEDGER_URL=https://docker.for.mac.localhost:9007
WEBHOOKS_URL=https://docker.for.mac.localhost:9008
SELFSERVICE_URL=https://selfservice.pymnt.uk`

const URL_MAP = (() => {
  switch(process.argv[2]) {
    case 'local':
      return LOCAL_URL_MAP
    case 'docker':
      return DOCKER_URL_MAP
    default:
      return TUNNEL_URL_MAP
  }
})();


const env_vars = `PORT=3000
NODE_ENV=development
BUILD_FOLDER_ROOT=$PWD/dist
TOOLBOX_FILE_ROOT=$PWD
COOKIE_SESSION_ENCRYPTION_SECRET=Wtqf3C5t4f8vd68snKp86RDyfUN2HEj2
${URL_MAP}
AUTH_GITHUB_ENABLED=false`

fs.writeFileSync(ENV_FILE, env_vars)
