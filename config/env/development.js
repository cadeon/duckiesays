var port = 7007;
module.exports = {
  port: port,
  pg_connection_string: process.env.DATABASE_URL || "postgres://duckie_rw:duck!3@localhost:5432/duckiedb",
  secret: "CorrectHorseBatteryStaple",
  apiVersion: "v1",
};
