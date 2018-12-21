# Pay Toolbox (revised) 
Internal administrative tools service for the GOV.UK Pay products.

[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)

## (to-be-removed) To remove before initial commit 
* remove .npmrc - no need to specifiy --save-exact going forward
* investigate `Got` vs. `axios` REST client libraries, small vs. feature complete?
* ensure travis CI build passing badge is added to the README 
* if code coverage or code climate is used include these badges too
* latest version number in badge

## (to-be-removed) Motivation for development 
// @TODO
1. can run in proudction (allowing non-technical users in support to access production information)
2. increased testing infrastructure around sensitive procedures 
3. common language that the pay development team are familiar with 
4. fits the Java backend, Node frontend pattern adopted by the pay team 
5. set a standard for modern Pay Node apps that can be referenced as good practice 
6. improve development tooling for team working on frontend apps 
7. improve CI environment configurations, tests that should always pass, strong linting practices

## (to-be-removed) Technical goals

## Development Goals/ Focus
* tiny files, each piece responsible for one thing 
* contextual tests, tests close to what they are testing, organised by feature
* simple to understand architecture
