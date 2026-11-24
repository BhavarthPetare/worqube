export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

// Parse with a zod schema; turn the first problem into a readable 400.
export function parse(schema, data) {
  const result = schema.safeParse(data);
  if (!result.success) {
    const issue = result.error.issues[0];
    const field = issue.path.join('.');
    throw new HttpError(400, field ? `${field}: ${issue.message}` : issue.message);
  }
  return result.data;
}

export const isObjectId = (value) => typeof value === 'string' && /^[0-9a-fA-F]{24}$/.test(value);

export function assertObjectId(value, what = 'id') {
  if (!isObjectId(value)) throw new HttpError(400, `Invalid ${what}`);
  return value;
}
