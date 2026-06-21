import { Schema, model, InferSchemaType } from 'mongoose';

const productSchema = new Schema(
  {
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    name: { type: String, required: true },
    sku: { type: String },
    price: { type: Number, required: true, min: 0 },
    costPrice: { type: Number, required: true, min: 0, select: false },
    stock: { type: Number, required: true, min: 0, default: 0 },
    categoryId: { type: Schema.Types.ObjectId, ref: 'Category' },
  },
  { timestamps: true }
);

productSchema.index({ tenantId: 1, name: 1 });

export type Product = InferSchemaType<typeof productSchema>;
export const ProductModel = model('Product', productSchema);
