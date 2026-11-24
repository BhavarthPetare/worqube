import mongoose from 'mongoose';
import { DEPARTMENTS, JOB_TYPES } from '../lib/constants.js';
import { toJSON } from './_shared.js';

const { Schema } = mongoose;

const JobSchema = new Schema(
  {
    company: { type: Schema.Types.ObjectId, ref: 'Company', required: true, index: true },
    role: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    location: { type: String, trim: true, maxlength: 100 },
    type: { type: String, enum: JOB_TYPES, default: 'Full-time' },
    salaryRange: { type: String, trim: true, maxlength: 60 },
    requiredSkills: [{ type: String, trim: true, maxlength: 40 }],
    eligibility: {
      minCgpa: { type: Number, min: 0, max: 10, default: 0 },
      branches: [{ type: String, enum: DEPARTMENTS }], // empty = all branches
      maxBacklogs: { type: Number, min: 0, max: 50, default: 0 },
    },
    // YYYY-MM-DD, inclusive, India time (see lib/eligibility.js).
    deadline: { type: String, match: /^\d{4}-\d{2}-\d{2}$/ },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true, toJSON },
);

export default mongoose.model('Job', JobSchema);
