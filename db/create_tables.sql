
SET statement_timeout = 0;
SET lock_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SET check_function_bodies = false;
SET client_min_messages = warning;
SET row_security = off;

CREATE EXTENSION IF NOT EXISTS plpgsql WITH SCHEMA pg_catalog;
COMMENT ON EXTENSION plpgsql IS 'PL/pgSQL procedural language';

SET search_path = public, pg_catalog;

SET default_tablespace = '';

SET default_with_oids = false;



CREATE TABLE quotes (
    id SERIAL PRIMARY KEY,
    says text, 
    created_at timestamptz  DEFAULT (now() at time zone 'utc'),
    updated_at timestamptz  DEFAULT (now() at time zone 'utc')
);


GRANT ALL ON SCHEMA public TO postgres;

REVOKE ALL ON TABLE quotes FROM PUBLIC;
GRANT SELECT,INSERT,DELETE,UPDATE ON TABLE quotes TO duckie_rw;


GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public to duckie_rw;

