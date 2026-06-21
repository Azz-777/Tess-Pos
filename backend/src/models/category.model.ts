import { Schema, model, InferSchemaType } from 'mongoose';

const categorySchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true, index: true },
    name: { type: String, required: true },
  },
  { timestamps: true }
);

// One category name per tenant. Also closes the get-or-create race in
// product.service: a concurrent duplicate insert fails with E11000 instead of
// silently creating a second "Beverages" for the same business.
categorySchema.index({ tenantId: 1, name: 1 }, { unique: true });

export type Category = InferSchemaType<typeof categorySchema>;
export const CategoryModel = model('Category', categorySchema);
