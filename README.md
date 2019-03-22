# Pay Toolbox (revised) 
Internal administrative tools service for GOV.UK Pay products.

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## Running in a support role
The repository is pushed to Dockerhub when changes are approved into master, to use 
the latest version in a support role, simply run: 

```bash
pay toolbox start
```

## Setting up local development 
Getting the toolbox up and running for development. 

```bash
npm install

# generate a dev environment file - run the version according to your needs
./scripts/generate-dev-environment # default - target services running through SSH tunnel
./scripts/generate-dev-environment local # target services running locally on your machine
./scripts/generate-dev-environment docker # for docker deployment - talk to external network

# this will watch javascript files for changes and restart the server accordingly
npm run dev
```

## Development Goals/ Focus
* Small files, each piece responsible for one thing 
* Contextual tests, tests close to what they are testing, organised by feature
* Simple to understand architecture
* Latest language development standards

## Notes on coding style restriction
See `.eslintrc.json` for specifics, we extend the popular
[Airbnb Style Guide](https://github.com/airbnb/javascript) with a number of 
exceptions. 

`semi` - see [Eslint referenced blogpost](https://blog.izs.me/2010/12/an-open-letter-to-javascript-leaders-regarding)
`comma-dangle` - many popular diff/ review tools now allow ignoring whitespace
this should no longer be something we have to account for with hacks 
`array-bracket-spacing` - opinion: :+1: spacing

