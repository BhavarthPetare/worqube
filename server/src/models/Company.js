import mongoose from 'mongoose';
import { toJSON, urlField } from './_shared.js';

const CompanySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    website: urlField,
    description: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true, toJSON },
);

// Case-insensitive uniqueness ("Acme" and "acme" are the same company).
CompanySchema.index({ name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

export default mongoose.model('Company', CompanySchema);
