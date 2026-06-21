import { Schema, model, InferSchemaType } from 'mongoose';

const tenantSchema = new Schema(
  {
    name: { type: String, required: true },
    businessType: { type: String, required: true, default: 'Retail' },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export type Tenant = InferSchemaType<typeof tenantSchema>;
export const TenantModel = model('Tenant', tenantSchema);
