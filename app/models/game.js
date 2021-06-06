const mongoose = require('mongoose')

const gameSchema = new mongoose.Schema({
  currentArea: {
    type: String,
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
  },
  rooms: {
    type: Array,
    required: true
  }
}, {
  timestamps: true
})

module.exports = mongoose.model('Game', gameSchema)
