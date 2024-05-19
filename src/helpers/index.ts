import mongoose from "mongoose";

const counterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 1 },
});

const Counter = mongoose.model("Counter", counterSchema);

export async function getNextSequenceValue(
  sequenceName: string
): Promise<number> {
  const counter = await Counter.findOneAndUpdate(
    { _id: sequenceName },
    { $inc: { sequence_value: 1 } },
    { new: true, upsert: true }
  );

  return counter.sequence_value;
}
