// Atomic counters for gapless sequences (INVARIANT 8: orderNumber is never
// count()+1). findOneAndUpdate $inc is atomic even under concurrency.

import mongoose from 'mongoose';

const { Schema, model } = mongoose;

const CounterSchema = new Schema({
  _id: { type: String }, // sequence name, e.g. 'orderNumber'
  seq: { type: Number, default: 0 },
});

const Counter = model('Counter', CounterSchema);

/**
 * Atomically increment and return the next value of a named sequence.
 * @param {string} name
 * @returns {Promise<number>}
 */
export async function getNextSequence(name) {
  const doc = await Counter.findByIdAndUpdate(
    name,
    { $inc: { seq: 1 } },
    { new: true, upsert: true }
  );
  return doc.seq;
}

export default Counter;
