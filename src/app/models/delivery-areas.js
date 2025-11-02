import mongoose from 'mongoose';

const deliveryAreaSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  fee: {
    type: Number,
    required: true,
    min: 0,
  },
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Branch',
    required: false, // Made optional to support migration of existing data
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

// Create a compound unique index for name and branch
deliveryAreaSchema.index({ name: 1, branch: 1 }, { unique: true });

deliveryAreaSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  next();
});

// Delete the cached model to ensure the new schema is used
if (mongoose.models.DeliveryArea) {
  delete mongoose.models.DeliveryArea;
}

export default mongoose.model('DeliveryArea', deliveryAreaSchema);