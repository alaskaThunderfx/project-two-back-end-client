const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
  areas: {
    type: Array,
    required: true
  },
  inventory: {
    type: Array,
    required: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Game', gameSchema)
