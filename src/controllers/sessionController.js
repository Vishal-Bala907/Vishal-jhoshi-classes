const Session = require('../models/Session'); // Import your Session model
const User = require('../models/User'); // Import your User model if needed

// Get session details by session ID
exports.getSessionById = async (req, res) => {
    const { sessionId } = req.params;

    try {
        const session = await Session.findById(sessionId);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json(session);
    } catch (error) {
        console.error("Error fetching session:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAllSessions = async (req, res) => {
    const { userId } = req.params;

    try {
        const sessions = await Session.find({ userId }); // Assuming your Session model has a userId field

        if (!sessions.length) {
            return res.status(404).json({ message: 'No sessions found for this user' });
        }

        res.json(sessions);
    } catch (error) {
        console.error("Error fetching sessions:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.startSession = async (req, res) => {
    const { userId, title, description } = req.body;

    try {
        const newSession = new Session({ userId, title, description, status: 'active' });
        await newSession.save();

        res.status(201).json({ message: 'Session started successfully', session: newSession });
    } catch (error) {
        console.error("Error starting session:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Stop a session
exports.stopSession = async (req, res) => {
    const { sessionId } = req.params;

    try {
        const session = await Session.findByIdAndUpdate(
            sessionId,
            { status: 'inactive' }, // Marking session as inactive
            { new: true }
        );

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json({ message: 'Session stopped successfully', session });
    } catch (error) {
        console.error("Error stopping session:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Update a session
exports.updateSession = async (req, res) => {
    const { sessionId } = req.params;
    const { title, description } = req.body;

    try {
        const updatedSession = await Session.findByIdAndUpdate(
            sessionId,
            { title, description },
            { new: true, runValidators: true }
        );

        if (!updatedSession) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json({ message: 'Session updated successfully', session: updatedSession });
    } catch (error) {
        console.error("Error updating session:", error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete a session
exports.deleteSession = async (req, res) => {
    const { sessionId } = req.params;

    try {
        const session = await Session.findByIdAndDelete(sessionId);

        if (!session) {
            return res.status(404).json({ message: 'Session not found' });
        }

        res.json({ message: 'Session deleted successfully' });
    } catch (error) {
        console.error("Error deleting session:", error);
        res.status(500).json({ message: 'Server error' });
    }
};
