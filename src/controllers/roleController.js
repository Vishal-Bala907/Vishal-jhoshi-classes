const User = require("../models/User"); // Import your User model

exports.updateRole = async (req, res) => {
  const { userId } = req.params;
  const { newRole } = req.body;

  if (!newRole) {
    return res.status(400).json({ message: "New role is required" });
  }

  try {
    // Find the user and update their role
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { role: newRole }, // Assuming your User model has a 'role' field
      { new: true, runValidators: true } // Options to return the updated document and validate the update
    );

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({ message: "Role updated successfully", user: updatedUser });
  } catch (error) {
    console.error("Error updating role:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find({});

    res.json(users?.reverse() || []);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Server error" });
  }
};
exports.getAllMentors = async (req, res) => {
  try {
    const users = await User.find({ role: "mentor" });

    res.json(users?.reverse() || []);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.getAllStudents = async (req, res) => {
  const { userId } = req.params;
  // console.log(userId);
  let students = null;
  try {
    if (userId === "admin") {
      students = await User.find({ role: "student" }).exec();
    }
    res.json(students?.reverse() || []);
  } catch (error) {
    console.error("Error getting users:", error);
    res.status(500).json({ message: "Server error" });
  }
};
