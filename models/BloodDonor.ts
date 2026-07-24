import mongoose, { Schema, Document } from 'mongoose';

export interface IBloodDonor extends Document {
  name: string;
  nameBn?: string;
  phoneNumber: string;
  email?: string;
  bloodGroup: string;
  division?: string;
  district?: string;
  thana?: string;
  photo?: string;
  availabilityStatus: string;
  lastDonationDate?: any;
  isApproved: boolean;
  userId?: string;
  createdAt: Date;
  updatedAt: Date;
}

const BloodDonorSchema: Schema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
    },
    nameBn: {
      type: String,
      trim: true,
    },
    phoneNumber: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
    },
    email: {
      type: String,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
    },
    bloodGroup: {
      type: String,
      required: [true, 'Blood group is required'],
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'],
      trim: true,
    },
    division: {
      type: String,
      trim: true,
    },
    district: {
      type: String,
      trim: true,
    },
    thana: {
      type: String,
      trim: true,
    },
    photo: {
      type: String,
      trim: true,
    },
    availabilityStatus: {
      type: String,
      required: [true, 'Availability status is required'],
      enum: ['Available', 'Unavailable', 'Recently Donated'],
      default: 'Available',
    },
    lastDonationDate: {
      type: Schema.Types.Mixed,
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    userId: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

if (process.env.NODE_ENV !== 'production' && mongoose.models.BloodDonor) {
  delete (mongoose.models as any).BloodDonor;
}

const BloodDonor = mongoose.models.BloodDonor || mongoose.model<IBloodDonor>('BloodDonor', BloodDonorSchema);

export default BloodDonor;

