// Shared JSON shape: expose `id`, hide internals.
export const toJSON = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    delete ret._id;
    delete ret.passwordHash;
    return ret;
  },
};

const URL_RE = /^https?:\/\/\S+$/i;
export const urlField = {
  type: String,
  trim: true,
  maxlength: 300,
  validate: { validator: (v) => !v || URL_RE.test(v), message: 'must be a URL starting with http(s)://' },
};
