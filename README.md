# Wellspent Event Queue
This module implements the requirements specified in the document: https://github.com/sedge/WS-back-end-2020. This module exports an EventQueue class running on Redis implemented using the Bull library.

## Project setup
This project can be setup by running `npm install`. In order to test the class with a sample queue and sample data, this project assumes a Redis instance is running on `redis://127.0.0.1:6379`. This can be overridden with a custom connection string by setting an environment variable `REDIS_URL`. The tests can be run with the command: `npm run tests`.

This docker command can be used to quickly setup a redis instance on port 6379 for testing:
`docker run --name redis_test_container -d -p 6379:6379 -i -t redis:alpine`

## Documentation
Documentation for the EventQueue class was generated using jsdoc and can be found in docs/EventQueue.html

## Caveats
I tested the project with a single Redis instance to ensure that I can complete the project in the specified timeframe. I also found certain instructions slightly ambiguous (i.e. for logging), but I tried my best to just make a decision in these cases and hope they meet your expectations. 
