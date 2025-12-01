#!/usr/bin/env node
import dotenv from 'dotenv';
import connectDB from '../config/db.js';
import { gasFeeModel } from '../models/gasFeeModel.js';

dotenv.config();

const argv = process.argv.slice(2);
if (argv.length < 1) {
  console.log('Usage: node scripts/set_global_service_charge.js <serviceChargeUSD> [salePercentage]');
  process.exit(1);
}

const serviceChargeUSD = Number(argv[0]);
const salePercentage = argv[1] !== undefined ? Number(argv[1]) : undefined;

if (isNaN(serviceChargeUSD)) {
  console.error('serviceChargeUSD must be a valid number');
  process.exit(1);
}

if (salePercentage !== undefined && isNaN(salePercentage)) {
  console.error('salePercentage must be a valid number');
  process.exit(1);
}

const run = async () => {
  try {
    await connectDB();

    const updates = {
      serviceChargeUSD: serviceChargeUSD,
      updatedBy: 'migration-script',
      updatedAt: new Date(),
      isActive: true,
    };

    if (salePercentage !== undefined) updates.salePercentage = salePercentage;

    const res = await gasFeeModel.findOneAndUpdate(
      { network: 'global' },
      { $set: updates },
      { new: true, upsert: true }
    );

    console.log('Global service charge updated:');
    console.log(JSON.stringify(res, null, 2));
    process.exit(0);
  } catch (err) {
    console.error('Error updating global service charge:', err);
    process.exit(2);
  }
};

run();
