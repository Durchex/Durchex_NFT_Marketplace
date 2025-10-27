import { createUser, deleteUserByWalletAddress, getUserByWalletAddress, getUsers, updateUserByWalletAddress } from "../models/userModel.js";

// Create or update user profile
export const createOrUpdateUserProfile = async (req, res) => {
    try {
        const { walletAddress } = req.body;

        if (!walletAddress) {
            res.status(400).json({ error: "walletAddress is required" });
            return;
        }

        const existingUser = await getUserByWalletAddress(walletAddress);
        console.log("🚀 ~ createOrUpdateUserProfile ~ existingUser:", existingUser)

        if (existingUser) {
            // Update existing profile
            const updatedUser = await updateUserByWalletAddress(walletAddress, req.body, true);
            console.log("🚀 ~ createOrUpdateUserProfile ~ updatedUser:", updatedUser)
            res.status(200).json(updatedUser);
        } else {
            // Create new profile
            const newUser = await createUser(req.body);
            console.log("🚀 ~ createOrUpdateUserProfile ~ newUser:", newUser)
            res.status(201).json(newUser);
        }
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Create a new user
export const createUserProfile = async (req, res) => {
    try {
        const user = await createUser(req.body);
        res.status(201).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Get all users
export const getAllUsers = async (req, res) => {
    try {
        const users = await getUsers();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get single user by wallet address
export const getUserProfile = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const user = await getUserByWalletAddress(walletAddress);
        if (!user) {
            res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Update user by wallet address
export const updateUserProfile = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const user = await updateUserByWalletAddress(walletAddress, req.body, true);
        if (!user) {
            res.status(404).json({ message: "User not found" });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
};

// Delete user by wallet address
export const deleteUserProfile = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const user = await deleteUserByWalletAddress(walletAddress);
        if (!user) {
            res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({ message: "User deleted successfully" });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
