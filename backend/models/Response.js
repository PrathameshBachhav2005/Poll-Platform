const mongoose = require('mongoose');

const AnswerSchema = new mongoose.Schema({
  questionIndex: { type: Number, required: true },
  selectedOption: { type: String, required: true }
});

const ResponseSchema = new mongoose.Schema({
  pollId: { type: mongoose.Schema.Types.ObjectId, ref: 'Poll', required: true },
  respondentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null }, // Null if anonymous
  answers: [AnswerSchema]
}, { timestamps: true });

module.exports = mongoose.model('Response', ResponseSchema);
