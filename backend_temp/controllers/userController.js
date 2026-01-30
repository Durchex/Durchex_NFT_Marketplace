import { createUser, deleteUserByWalletAddress, getUserByWalletAddress, getUserByGameCode, getUsers, updateUserByWalletAddress, ensureUniqueGameCode } from "../models/userModel.js";

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

// Get single user by wallet address (ensure gameCode exists for existing users)
export const getUserProfile = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        let user = await getUserByWalletAddress(walletAddress);
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        if (!user.gameCode) {
            const code = await ensureUniqueGameCode();
            await updateUserByWalletAddress(walletAddress, { gameCode: code, gameCodeRedeemed: false }, true);
            user = await getUserByWalletAddress(walletAddress);
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const GAME_POINTS_PER_REDEEM = 1000;

// Redeem game code: body { code, walletAddress }. Only the code owner can redeem; credits 1000 points and persists to DB.
export const redeemGameCode = async (req, res) => {
    try {
        const { code, walletAddress } = req.body;
        if (!code || typeof code !== "string" || !code.trim()) {
            return res.status(400).json({ error: "Game code is required" });
        }
        if (!walletAddress || typeof walletAddress !== "string") {
            return res.status(400).json({ error: "Wallet address is required" });
        }
        const user = await getUserByGameCode(code.trim());
        if (!user) {
            return res.status(404).json({ error: "Invalid game code" });
        }
        if (user.gameCodeRedeemed) {
            return res.status(400).json({ error: "This game code has already been redeemed" });
        }
        const wallet = walletAddress.trim().toLowerCase();
        if (user.walletAddress !== wallet) {
            return res.status(403).json({ error: "Only the account that received this code can redeem it" });
        }
        const currentBalance = typeof user.gameBalance === "number" ? user.gameBalance : 0;
        const newBalance = currentBalance + GAME_POINTS_PER_REDEEM;
        await updateUserByWalletAddress(user.walletAddress, {
            gameCodeRedeemed: true,
            gameBalance: newBalance,
        }, true);
        res.status(200).json({
            success: true,
            points: GAME_POINTS_PER_REDEEM,
            gameBalance: newBalance,
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Get or sync game balance: GET returns balance for wallet; PATCH body { walletAddress, balance } updates (so frontend can restore/sync).
export const getGameBalance = async (req, res) => {
    try {
        const { walletAddress } = req.params;
        const user = await getUserByWalletAddress(walletAddress);
        const balance = user && typeof user.gameBalance === "number" ? user.gameBalance : 0;
        res.status(200).json({ gameBalance: balance });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const syncGameBalance = async (req, res) => {
    try {
        const { walletAddress, balance } = req.body;
        if (!walletAddress || typeof balance !== "number" || balance < 0) {
            return res.status(400).json({ error: "walletAddress and balance (number >= 0) required" });
        }
        const user = await getUserByWalletAddress(walletAddress);
        if (!user) {
            return res.status(404).json({ error: "User not found" });
        }
        await updateUserByWalletAddress(walletAddress, { gameBalance: Math.max(0, balance) }, true);
        res.status(200).json({ success: true, gameBalance: Math.max(0, balance) });
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
