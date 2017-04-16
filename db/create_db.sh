#! /bin/sh

## DATABASE CREATION
#
# Make sure ALL connections (app, pgAdmin) to db are disconnected before running
#
# Note: psql must be in $PATH

# For authentication to postgres to work from a non-postgres system level user, we need to set
# the PGPASSWORD environment variable. 

export PGPASSWORD=liquidgenius

t=$(date "+%Y.%m.%d-%H.%M.%S")

echo "Backing up db with timestamp $t..."
pg_dump -U postgres -h 127.0.0.1 duckiedb -f logs/backup_$t.sql
echo "...done"
echo

echo "Drop database and roles..."
psql -U postgres -h 127.0.0.1  -c "DROP DATABASE duckiedb;"
psql -U postgres -h 127.0.0.1 -c "DROP ROLE duckie_rw;"
echo "...done"
echo

echo "Create app user role and database, and grant permissions..."
psql -U postgres -h 127.0.0.1 -c "CREATE USER duckie_rw WITH PASSWORD 'duck!3';"

psql -U postgres -h 127.0.0.1 -c "CREATE DATABASE duckiedb WITH OWNER = postgres ENCODING = 'UTF8' TABLESPACE = pg_default \
LC_COLLATE = 'en_US.UTF-8' LC_CTYPE = 'en_US.UTF-8' CONNECTION LIMIT = -1;"

psql -U postgres -h 127.0.0.1 -c "GRANT CONNECT ON DATABASE duckiedb TO duckie_rw;"
echo "...done"
echo

## CREATE EMPTY SCHEMA + LOOKUP TABLES
echo "Creating schema..."
psql -U postgres -h 127.0.0.1 -d duckiedb -f create_tables.sql
echo "...done"

## TEST DATA INSERTION
## uncomment psql line below
# echo "Creating test data..."
# psql duckiedb < create_test_data.dmp
# echo "...done"
