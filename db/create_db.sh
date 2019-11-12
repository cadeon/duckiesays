#! /bin/sh

## DATABASE CREATION
#
# Make sure ALL connections (app, pgAdmin) to db are disconnected before running
#
# Note: psql must be in $PATH

# For authentication to postgres to work from a non-postgres system level user, we need to set
# the PGPASSWORD environment variable. 

echo "Killing old db"

rm ../duckiedb.sqlite3

## CREATE EMPTY SCHEMA + LOOKUP TABLES
echo "Creating schema..."

sqlite3 ../duckiedb.sqlite3 < create_tables.sql

echo "...done"

## DATA INSERTION
## uncomment psql line below
echo "Creating data..."
sqlite3 ../duckiedb.sqlite3 < create_db.dmp
echo "...done"

