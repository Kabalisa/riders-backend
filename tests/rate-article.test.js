import chai, { expect } from 'chai';
import chaiHttp from 'chai-http';
import app from '../app';

chai.should();
chai.use(chaiHttp);

const userTest = {
  username: 'ratetester',
  email: 'ratetester@test.com',
  password: 'testRate@123!'
};

const anotherUsertest = {
  username: 'anotherratetester',
  email: 'anotherratetester@test.com',
  password: 'testRate@123!'
};

const articleTest = {
  title: 'This is the title of the article',
  description: 'This is the description of the acrticle',
  body: 'this is the body of the article',
  image: 'https/piimg.com/img.jpg'
};

const rateTest = { rate: 2 };

let toKen = null;
let articleSlug = null;
describe('Rate user posted article', () => {
  it('User Signup', (done) => {
    chai.request(app)
      .post('/api/v1/users/signup')
      .send(userTest)
      .end((err, res) => {
        toKen = res.body.token;
        expect(res.body).to.have.status(201);
        expect(res.body).to.have.property('token').to.be.a('string');
        done();
      });
  });
  it('User create an article', (done) => {
    chai.request(app)
      .post('/api/v1/articles')
      .set('authorization', toKen)
      .send(articleTest)
      .end((error, res) => {
        articleSlug = res.body.article.slug;
        expect(res.body).to.have.property('article');
        expect(res.body.article).to.have.property('author');
        expect(res.body.article).to.have.property('title');
        expect(res.body.article).to.have.property('body');
        expect(res.body.article).to.have.property('description');
        expect(res.body.article.title).equals('This is the title of the article');
        expect(res.body.article.description).equals('This is the description of the acrticle');
        expect(res.body.article.body).equals('this is the body of the article');
        expect(res.body.article.image).equals('https/piimg.com/img.jpg');
        done();
      });
  });
  it('User try to rate their article', (done) => {
    chai.request(app)
      .post(`/api/v1/articles/${articleSlug}/rate`)
      .set('authorization', toKen)
      .send(rateTest)
      .end((error, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('Oops! You cannot rate your article');
        done();
      });
  });
  it('Another User Signup', (done) => {
    chai.request(app)
      .post('/api/v1/users/signup')
      .send(anotherUsertest)
      .end((err, res) => {
        toKen = res.body.token;
        expect(res.body).to.have.status(201);
        expect(res.body).to.have.property('token').to.be.a('string');
        done();
      });
  });
  it('User rate another user article', (done) => {
    chai.request(app)
      .post(`/api/v1/articles/${articleSlug}/rate`)
      .set('authorization', toKen)
      .send(rateTest)
      .end((error, res) => {
        expect(res.body).to.have.status(201);
        expect(res.body.data.rating).to.have.property('rate').to.be.equal(rateTest.rate);
        expect(res.body.data.rating).to.have.property('articleSlug').to.be.equal(articleSlug);
        done();
      });
  });
  it('User give a rate an article < 5', (done) => {
    chai.request(app)
      .post(`/api/v1/articles/${articleSlug}/rate`)
      .set('authorization', toKen)
      .send({
        rate: 6
      })
      .end((error, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('Rate must be between 1 and 5');
        done();
      });
  });
  it('User update their rate on article', (done) => {
    chai.request(app)
      .post(`/api/v1/articles/${articleSlug}/rate`)
      .set('authorization', toKen)
      .send({
        rate: 5
      })
      .end((error, res) => {
        expect(res.body).to.have.status(200);
        expect(res.body.data.rating[0]).to.have.property('rate').to.be.equal(5);
        expect(res.body.data.rating[0]).to.have.property('articleSlug').to.be.equal(articleSlug);
        done();
      });
  });
  it('Check if rate was provided', (done) => {
    chai.request(app)
      .post(`/api/v1/articles/${articleSlug}/rate`)
      .set('authorization', toKen)
      .send()
      .end((error, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('Oops! Rate is required');
        done();
      });
  });
  it('Check if the article exist', (done) => {
    chai.request(app)
      .post('/api/v1/articles/this-is-the-title-of-the-article/rate')
      .set('authorization', toKen)
      .send({
        rate: 4
      })
      .end((error, res) => {
        expect(res.body).to.have.status(400);
        expect(res.body.errors.body[0]).to.be.equal('This Article does not exist');
        done();
      });
  });
});
