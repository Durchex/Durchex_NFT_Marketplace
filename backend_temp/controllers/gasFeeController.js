import mongoose from 'mongoose';
import { gasFeeModel } from '../models/gasFeeModel.js';
import { ethers } from 'ethers';

// Get gas fee regulations for a network
export const getGasFeeRegulation = async (req, res) => {
  try {
    const { network } = req.params;

    let gasFee = await gasFeeModel.findOne({ network });

    // If no regulation exists, create default
    if (!gasFee) {
      gasFee = await gasFeeModel.create({
        network,
        isActive: true,
        regulations: {
          enabled: true,
          enforceMin: false,
          enforceMax: false,
          autoAdjust: false,
        },
      });
    }

    res.json(gasFee);
  } catch (error) {
    console.error('Error getting gas fee regulation:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get all gas fee regulations
export const getAllGasFeeRegulations = async (req, res) => {
  try {
    if (mongoose.connection.readyState !== 1) {
      // DB not connected - return empty list with a warning
      return res.json({ gasFees: [], warning: 'Database not connected' });
    }

    const gasFees = await gasFeeModel.find().sort({ network: 1 });
    res.json(gasFees);
  } catch (error) {
    console.error('Error getting all gas fee regulations:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update gas fee regulation (Admin only)
export const updateGasFeeRegulation = async (req, res) => {
  try {
    const { network } = req.params;
    const updates = req.body;
    const { updatedBy } = req.body;

    // Validate network
    const validNetworks = ['ethereum', 'polygon', 'bsc', 'arbitrum', 'tezos', 'hyperliquid', 'siu', 'base', 'monarch'];
    if (!validNetworks.includes(network)) {
      return res.status(400).json({ error: 'Invalid network' });
    }

    // Convert gas prices to wei if provided in gwei
    if (updates.minGasPrice && !updates.minGasPrice.includes('e')) {
      // If it's a number, assume it's in gwei and convert
      if (!isNaN(updates.minGasPrice)) {
        updates.minGasPrice = ethers.utils.parseUnits(updates.minGasPrice.toString(), 'gwei').toString();
      }
    }
    if (updates.maxGasPrice && !updates.maxGasPrice.includes('e')) {
      if (!isNaN(updates.maxGasPrice)) {
        updates.maxGasPrice = ethers.utils.parseUnits(updates.maxGasPrice.toString(), 'gwei').toString();
      }
    }
    if (updates.defaultGasPrice && !updates.defaultGasPrice.includes('e')) {
      if (!isNaN(updates.defaultGasPrice)) {
        updates.defaultGasPrice = ethers.utils.parseUnits(updates.defaultGasPrice.toString(), 'gwei').toString();
      }
    }

    const gasFee = await gasFeeModel.findOneAndUpdate(
      { network },
      { ...updates, updatedBy, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Gas fee regulation updated successfully',
      gasFee,
    });
  } catch (error) {
    console.error('Error updating gas fee regulation:', error);
    res.status(500).json({ error: error.message });
  }
};

// Calculate regulated gas price
export const calculateRegulatedGasPrice = async (req, res) => {
  try {
    const { network, currentGasPrice } = req.body;

    const gasFee = await gasFeeModel.findOne({ network, isActive: true });

    if (!gasFee || !gasFee.regulations.enabled) {
      // If no regulation or disabled, return current gas price
      return res.json({
        gasPrice: currentGasPrice,
        regulated: false,
      });
    }

    let regulatedPrice = currentGasPrice;

    // Apply multiplier
    if (gasFee.multiplier && gasFee.multiplier !== 1.0) {
      const currentPriceBN = ethers.BigNumber.from(currentGasPrice);
      regulatedPrice = currentPriceBN.mul(Math.floor(gasFee.multiplier * 100)).div(100).toString();
    }

    // Enforce minimum
    if (gasFee.regulations.enforceMin && gasFee.minGasPrice) {
      const minPriceBN = ethers.BigNumber.from(gasFee.minGasPrice);
      const regulatedPriceBN = ethers.BigNumber.from(regulatedPrice);
      if (regulatedPriceBN.lt(minPriceBN)) {
        regulatedPrice = gasFee.minGasPrice;
      }
    }

    // Enforce maximum
    if (gasFee.regulations.enforceMax && gasFee.maxGasPrice) {
      const maxPriceBN = ethers.BigNumber.from(gasFee.maxGasPrice);
      const regulatedPriceBN = ethers.BigNumber.from(regulatedPrice);
      if (regulatedPriceBN.gt(maxPriceBN)) {
        regulatedPrice = gasFee.maxGasPrice;
      }
    }

    res.json({
      gasPrice: regulatedPrice,
      regulated: true,
      regulation: {
        multiplier: gasFee.multiplier,
        minGasPrice: gasFee.minGasPrice,
        maxGasPrice: gasFee.maxGasPrice,
        defaultGasPrice: gasFee.defaultGasPrice,
      },
    });
  } catch (error) {
    console.error('Error calculating regulated gas price:', error);
    res.status(500).json({ error: error.message });
  }
};

// Toggle gas fee regulation active status
export const toggleGasFeeRegulation = async (req, res) => {
  try {
    const { network } = req.params;
    const { isActive, updatedBy } = req.body;

    const gasFee = await gasFeeModel.findOneAndUpdate(
      { network },
      { isActive, updatedBy, updatedAt: new Date() },
      { new: true }
    );

    if (!gasFee) {
      return res.status(404).json({ error: 'Gas fee regulation not found' });
    }

    res.json({
      success: true,
      message: `Gas fee regulation ${isActive ? 'activated' : 'deactivated'}`,
      gasFee,
    });
  } catch (error) {
    console.error('Error toggling gas fee regulation:', error);
    res.status(500).json({ error: error.message });
  }
};

// Get global service charge configuration
export const getGlobalServiceCharge = async (req, res) => {
  try {
    let serviceCharge = await gasFeeModel.findOne({ network: 'global' });

    // If no global service charge exists, create default
    if (!serviceCharge) {
      serviceCharge = await gasFeeModel.create({
        network: 'global',
        serviceChargeUSD: 0,
        isActive: true,
        updatedAt: new Date(),
      });
    }

    res.json(serviceCharge);
  } catch (error) {
    console.error('Error getting global service charge:', error);
    res.status(500).json({ error: error.message });
  }
};

// Update global service charge (Admin only)
export const updateGlobalServiceCharge = async (req, res) => {
  try {
    const updates = req.body;
    const { updatedBy } = req.body;

    // Validate serviceChargeUSD
    if (updates.serviceChargeUSD !== undefined && isNaN(updates.serviceChargeUSD)) {
      return res.status(400).json({ error: 'serviceChargeUSD must be a valid number' });
    }

    const serviceCharge = await gasFeeModel.findOneAndUpdate(
      { network: 'global' },
      { ...updates, updatedBy, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: 'Global service charge updated successfully',
      serviceCharge,
    });
  } catch (error) {
    console.error('Error updating global service charge:', error);
    res.status(500).json({ error: error.message });
  }
};

// Toggle global service charge active status
export const toggleGlobalServiceCharge = async (req, res) => {
  try {
    const { isActive, updatedBy } = req.body;

    const serviceCharge = await gasFeeModel.findOneAndUpdate(
      { network: 'global' },
      { isActive, updatedBy, updatedAt: new Date() },
      { new: true, upsert: true }
    );

    res.json({
      success: true,
      message: `Global service charge ${isActive ? 'activated' : 'deactivated'}`,
      serviceCharge,
    });
  } catch (error) {
    console.error('Error toggling global service charge:', error);
    res.status(500).json({ error: error.message });
  }
};
