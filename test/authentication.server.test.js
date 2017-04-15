process.env.NODE_ENV = 'test';

var chai = require('chai');
var should = chai.should();
var chaiHttp = require('chai-http');
var server = require('../server');

chai.use(chaiHttp);

// UNAUTHENTICATED ROUTES

// Test create of Admin user
var adminUserId = '';

var ts = Date.now();
var adminTs = "auth.test"+ ts;
var appTs = "app.user"+ ts;

describe('POST /auth/register for Admin User', function() {
  it('should register Admin user and return JWT token', function(done) {
    chai.request(server)
    .post('/auth/register')
    .send( {
        "first_name": "Art",
        "last_name": "Test",
        "email": adminTs+"@gmail.com",
        "password": adminTs,
        "role": "ADMIN"
    })
    .end(function (err, res) {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('object')
      res.body.should.have.property('token');
      res.body.should.have.property('user');
      res.body.user.should.have.property('id');

      adminUserId = res.body.user.id;

      res.body.user.should.have.property('username');
      res.body.user.username.should.equal(adminTs+'@gmail.com');
      res.body.user.should.have.property('role');
      res.body.user.role.should.equal('ADMIN');

      done();
    });
  });
});


// Test create of App user
var appUserId = '';

describe('POST /auth/register for App User', function() {
  it('should register app user and return JWT token', function(done) {
    chai.request(server)
    .post('/auth/register')
    .send( {
        "first_name": "App",
        "last_name": "User",
        "email": appTs+ "@gmail.com",
        "password": appTs,
        "role": "APPUSER"
    })
    .end(function (err, res) {
      res.should.have.status(201);
      res.should.be.json;
      res.body.should.be.a('object')
      res.body.should.have.property('token');
      res.body.should.have.property('user');
      res.body.user.should.have.property('id');

      appUserId = res.body.user.id;

      res.body.user.should.have.property('username');
      res.body.user.username.should.equal(appTs+'@gmail.com');
      res.body.user.should.have.property('role');
      res.body.user.role.should.equal('APPUSER');

      done();
    });
  });
});


// AUTHENTICATED ROUTES

var token = '';

// Login Admin user
describe('Login Admin user', function() {
  it('should login and retrieve JWT token for Admin user', function(done) {
    chai.request(server)
    .post('/auth/login')
    .send({
        "username": adminTs +"@gmail.com",
        "password": adminTs
    })
    .end(function (err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object')

      // Save the JWT token
      res.body.should.have.property('token');
      token = res.body.token;
      console.log(' token: '+ token);

      res.body.should.have.property('user');
      res.body.user.should.have.property('id');
      res.body.user.should.have.property('username');
      res.body.user.username.should.equal(adminTs+'@gmail.com');
      res.body.user.should.have.property('role');
      res.body.user.role.should.equal('ADMIN');
      done();
    });
  });
  it('should read admin user '+ adminUserId, function(done) {
    chai.request(server)
    .get('/api/v1/users/' + adminUserId)
    .set('Authorization', token)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('first_name');
      res.body.first_name.should.equal('Art');
      res.body.should.have.property('last_name');
      res.body.last_name.should.equal('Test');
      res.body.should.have.property('username');
      res.body.username.should.equal(adminTs+'@gmail.com');
      done();
    });
  });
  it('should read app user '+ appUserId, function(done) {
    chai.request(server)
    .get('/api/v1/users/' + appUserId)
    .set('Authorization', token)
    .end(function(err, res) {
      res.should.have.status(200);
      res.should.be.json;
      res.body.should.be.a('object');
      res.body.should.have.property('first_name');
      res.body.first_name.should.equal('App');
      res.body.should.have.property('last_name');
      res.body.last_name.should.equal('User');
      res.body.should.have.property('username');
      res.body.username.should.equal(appTs+'@gmail.com');
      done();
    });
  });
});

// Delete App user
describe('Delete App user', function() {
  it('should delete app user', function(done) {
    chai.request(server)
    .delete('/api/v1/users/' + appUserId)
    .set('Authorization', token)
    .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('status');
        res.body.status.should.equal(true);
        done();
      });
  });
});

// Delete Admin user
describe('Delete Admin user', function() {
  it('should delete Admin user', function(done) {
    chai.request(server)
    .delete('/api/v1/users/' + adminUserId)
    .set('Authorization', token)
    .end(function(err, res) {
        res.should.have.status(200);
        res.should.be.json;
        res.body.should.be.a('object');
        res.body.should.have.property('status');
        res.body.status.should.equal(true);
        done();
    });
  });
});