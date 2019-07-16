# Pay Toolbox

Internal administrative tools service for GOV.UK Pay products.

[![Codacy Badge](https://api.codacy.com/project/badge/Grade/16fc800bd9904ee38b3540d470d27c23)](https://www.codacy.com/app/govuk-pay/pay-toolbox?utm_source=github.com&amp;utm_medium=referral&amp;utm_content=alphagov/pay-toolbox&amp;utm_campaign=Badge_Grade)
[![Known Vulnerabilities](https://snyk.io//test/github/alphagov/pay-toolbox/badge.svg?targetFile=package.json)](https://snyk.io//test/github/alphagov/pay-toolbox?targetFile=package.json)
[![Code Style](https://badgen.net/badge/eslint/airbnb/ff5a5f?icon=airbnb)](https://github.com/airbnb/javascript)


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

## Key runtime environment variables

| Variable                 | Description                               |
| ------------------------ |:----------------------------------------- |
| `NODE_ENV`               | 
| `STRIPE_ACCOUNT_API_KEY` | 
| `https_proxy`            | 

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
`@typescript-eslint/no-var-requires` - not yet using Typescript module syntax, rule should be set to error when we switch

## Build process (inbox)

  * Currently relies on `tsc-watch` to extend the Typescript compiler in dev mode, ideally
    this should combine `nodemon` waiting on standard `tsc --watch`
  * `ts-node` is used for directly interpreting unit test files, we can either use this
    or include test files in the watch/ build process
