const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    mentors: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
});

module.exports = mongoose.model('Subject', subjectSchema);