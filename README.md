# DUCKIESAYS REST API
##
## Synopsis

DUCKIESAYS RESTful service API.

## Code Example

REST services of the form:

GET /apiVN/duckie/:SayId


## Motivation

Provides basic REST services API. 

## Permalink Feature
The Duckie Says application now supports permalinks! You can share your prompts and responses via URLs. The prompt and response data are encoded directly into the URL, allowing others to see exactly what you asked Duckie and how it responded.

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
```

