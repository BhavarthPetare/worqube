import mongoose from 'mongoose';
import { APPLICATION_STATUSES } from '../lib/constants.js';
import { toJSON } from './_shared.js';

const { Schema } = mongoose;

const ApplicationSchema = new Schema(
  {
    job: { type: Schema.Types.ObjectId, ref: 'Job', required: true },
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    status: { type: String, enum: APPLICATION_STATUSES, default: 'applied', index: true },
  },
  { timestamps: true, toJSON },
);

// One application per student per job.
ApplicationSchema.index({ job: 1, student: 1 }, { unique: true });

export default mongoose.model('Application', ApplicationSchema);
