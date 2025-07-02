const port = process.env.PORT || 3000;
module.exports = {
  port,
  pg_connection_string: process.env.DATABASE_URL,
  secret: 'WhanThatAprillWithHisShouresSoote',
  apiVersion: 'v2',
};
