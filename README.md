# DUCKIESAYS REST API
#
## Synopsis

DUCKIESAYS RESTful service API.

## Code Example

REST services of the form:

GET /api/vN/duckie/:sayId


## Motivation

Provides basic REST services API. 

## Installation

To create database and schema:
     db> ./create_db.sh

To populate test data
     db> psql -U postgres duckiedb < create_test_data.dmp


## API Reference

GET:

duckie


## Tests

Mocha test examples live in the test directory

## Contributors



## License

MIT
