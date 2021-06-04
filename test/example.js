process.env.TESTENV = true

let game = require('../app/models/game.js')
let User = require('../app/models/user')

const crypto = require('crypto')

let chai = require('chai')
let chaiHttp = require('chai-http')
let server = require('../server')
chai.should()

chai.use(chaiHttp)

const token = crypto.randomBytes(16).toString('hex')
let userId
let gameId

describe('games', () => {
  const gameParams = {
    title: '13 JavaScript tricks SEI instructors don\'t want you to know',
    text: 'You won\'believe number 8!'
  }

  before(done => {
    game.deleteMany({})
      .then(() => User.create({
        email: 'caleb',
        hashedPassword: '12345',
        token
      }))
      .then(user => {
        userId = user._id
        return user
      })
      .then(() => game.create(Object.assign(gameParams, {owner: userId})))
      .then(record => {
        gameId = record._id
        done()
      })
      .catch(console.error)
  })

  describe('GET /games', () => {
    it('should get all the games', done => {
      chai.request(server)
        .get('/games')
        .set('Authorization', `Token token=${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.games.should.be.a('array')
          res.body.games.length.should.be.eql(1)
          done()
        })
    })
  })

  describe('GET /games/:id', () => {
    it('should get one game', done => {
      chai.request(server)
        .get('/games/' + gameId)
        .set('Authorization', `Token token=${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.game.should.be.a('object')
          res.body.game.title.should.eql(gameParams.title)
          done()
        })
    })
  })

  describe('DELETE /games/:id', () => {
    let gameId

    before(done => {
      game.create(Object.assign(gameParams, { owner: userId }))
        .then(record => {
          gameId = record._id
          done()
        })
        .catch(console.error)
    })

    it('must be owned by the user', done => {
      chai.request(server)
        .delete('/games/' + gameId)
        .set('Authorization', `Bearer notarealtoken`)
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should be succesful if you own the resource', done => {
      chai.request(server)
        .delete('/games/' + gameId)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(204)
          done()
        })
    })

    it('should return 404 if the resource doesn\'t exist', done => {
      chai.request(server)
        .delete('/games/' + gameId)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(404)
          done()
        })
    })
  })

  describe('POST /games', () => {
    it('should not POST an game without a title', done => {
      let noTitle = {
        text: 'Untitled',
        owner: 'fakedID'
      }
      chai.request(server)
        .post('/games')
        .set('Authorization', `Bearer ${token}`)
        .send({ game: noTitle })
        .end((e, res) => {
          res.should.have.status(422)
          res.should.be.a('object')
          done()
        })
    })

    it('should not POST an game without text', done => {
      let noText = {
        title: 'Not a very good game, is it?',
        owner: 'fakeID'
      }
      chai.request(server)
        .post('/games')
        .set('Authorization', `Bearer ${token}`)
        .send({ game: noText })
        .end((e, res) => {
          res.should.have.status(422)
          res.should.be.a('object')
          done()
        })
    })

    it('should not allow a POST from an unauthenticated user', done => {
      chai.request(server)
        .post('/games')
        .send({ game: gameParams })
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should POST an game with the correct params', done => {
      let validgame = {
        title: 'I ran a shell command. You won\'t believe what happened next!',
        text: 'it was rm -rf / --no-preserve-root'
      }
      chai.request(server)
        .post('/games')
        .set('Authorization', `Bearer ${token}`)
        .send({ game: validgame })
        .end((e, res) => {
          res.should.have.status(201)
          res.body.should.be.a('object')
          res.body.should.have.property('game')
          res.body.game.should.have.property('title')
          res.body.game.title.should.eql(validgame.title)
          done()
        })
    })
  })

  describe('PATCH /games/:id', () => {
    let gameId

    const fields = {
      title: 'Find out which HTTP status code is your spirit animal',
      text: 'Take this 4 question quiz to find out!'
    }

    before(async function () {
      const record = await game.create(Object.assign(gameParams, { owner: userId }))
      gameId = record._id
    })

    it('must be owned by the user', done => {
      chai.request(server)
        .patch('/games/' + gameId)
        .set('Authorization', `Bearer notarealtoken`)
        .send({ game: fields })
        .end((e, res) => {
          res.should.have.status(401)
          done()
        })
    })

    it('should update fields when PATCHed', done => {
      chai.request(server)
        .patch(`/games/${gameId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ game: fields })
        .end((e, res) => {
          res.should.have.status(204)
          done()
        })
    })

    it('shows the updated resource when fetched with GET', done => {
      chai.request(server)
        .get(`/games/${gameId}`)
        .set('Authorization', `Bearer ${token}`)
        .end((e, res) => {
          res.should.have.status(200)
          res.body.should.be.a('object')
          res.body.game.title.should.eql(fields.title)
          res.body.game.text.should.eql(fields.text)
          done()
        })
    })

    it('doesn\'t overwrite fields with empty strings', done => {
      chai.request(server)
        .patch(`/games/${gameId}`)
        .set('Authorization', `Bearer ${token}`)
        .send({ game: { text: '' } })
        .then(() => {
          chai.request(server)
            .get(`/games/${gameId}`)
            .set('Authorization', `Bearer ${token}`)
            .end((e, res) => {
              res.should.have.status(200)
              res.body.should.be.a('object')
              // console.log(res.body.game.text)
              res.body.game.title.should.eql(fields.title)
              res.body.game.text.should.eql(fields.text)
              done()
            })
        })
    })
  })
})
