import mongoose from 'mongoose';
import { DEPARTMENTS, SKILL_LEVELS, YEARS } from '../lib/constants.js';
import { toJSON, urlField } from './_shared.js';

const { Schema } = mongoose;
const sub = (fields) => new Schema(fields, { toJSON, id: true });

// Students keep their whole profile in one document: skills, projects, experience
// and certifications are small, owned lists, so they are embedded.
const UserSchema = new Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'admin'], default: 'student', index: true },
    fullName: { type: String, required: true, trim: true, maxlength: 100 },

    rollNumber: { type: String, trim: true, maxlength: 20 },
    phone: { type: String, trim: true, maxlength: 20 },
    department: { type: String, enum: DEPARTMENTS },
    year: { type: String, enum: YEARS },
    cgpa: { type: Number, min: 0, max: 10 },
    activeBacklogs: { type: Number, min: 0, max: 50, default: 0 },
    links: {
      github: urlField,
      linkedin: urlField,
      leetcode: urlField,
      codechef: urlField,
    },

    skills: [sub({
      name: { type: String, required: true, trim: true, maxlength: 50 },
      level: { type: String, enum: SKILL_LEVELS, default: 'Intermediate' },
    })],
    projects: [sub({
      title: { type: String, required: true, trim: true, maxlength: 150 },
      description: { type: String, trim: true, maxlength: 2000 },
      technologies: [{ type: String, trim: true, maxlength: 40 }],
      githubUrl: urlField,
      projectUrl: urlField,
    })],
    experience: [sub({
      company: { type: String, required: true, trim: true, maxlength: 100 },
      role: { type: String, required: true, trim: true, maxlength: 100 },
      location: { type: String, trim: true, maxlength: 100 },
      description: { type: String, trim: true, maxlength: 2000 },
      startDate: { type: String, match: /^\d{4}-\d{2}$/ },
      endDate: { type: String, match: /^\d{4}-\d{2}$/ },
      current: { type: Boolean, default: false },
    })],
    certifications: [sub({
      name: { type: String, required: true, trim: true, maxlength: 150 },
      issuer: { type: String, trim: true, maxlength: 100 },
      issueDate: { type: String, match: /^\d{4}-\d{2}$/ },
      credentialUrl: urlField,
    })],

    // Latest resume, stored in GridFS (bucket "resumes").
    resume: {
      fileId: Schema.Types.ObjectId,
      fileName: String,
      size: Number,
      uploadedAt: Date,
    },
  },
  { timestamps: true, toJSON },
);

// Roll numbers are optional but unique once set.
UserSchema.index({ rollNumber: 1 }, { unique: true, partialFilterExpression: { rollNumber: { $type: 'string' } } });
UserSchema.index({ role: 1, department: 1, year: 1 });

export default mongoose.model('User', UserSchema);
