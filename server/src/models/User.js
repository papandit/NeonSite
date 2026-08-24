import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const { Schema, model } = mongoose;

const ROLES = ['customer', 'admin'];

const UserSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
      match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email address'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, default: 'customer', index: true },
  },
  { timestamps: true }
);

/**
 * Set the password (hashes with bcrypt). Use instead of assigning passwordHash.
 * @param {string} plain
 */
UserSchema.methods.setPassword = async function setPassword(plain) {
  const salt = await bcrypt.genSalt(12); // ~250ms per hash: slow for an attacker, invisible at login
  this.passwordHash = await bcrypt.hash(plain, salt);
};

/**
 * Compare a candidate password against the stored hash.
 * @param {string} candidate
 * @returns {Promise<boolean>}
 */
UserSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.passwordHash);
};

/**
 * A safe, client-facing view of the user (never leaks passwordHash).
 * @returns {{ id: string, name: string, email: string, role: string }}
 */
UserSchema.methods.toSafeObject = function toSafeObject() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    createdAt: this.createdAt,
  };
};

UserSchema.statics.ROLES = ROLES;

const User = model('User', UserSchema);
export default User;
