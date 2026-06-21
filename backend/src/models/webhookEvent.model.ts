import { Schema, model, InferSchemaType } from 'mongoose';

const webhookEventSchema = new Schema(
  {
    eventId: { type: String, required: true },
    orderId: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
    tenantId: { type: Schema.Types.ObjectId, ref: 'Tenant', required: true },
    type: { type: String, required: true },
  },
  { timestamps: true }
);

webhookEventSchema.index({ eventId: 1 }, { unique: true });

export type WebhookEvent = InferSchemaType<typeof webhookEventSchema>;
export const WebhookEventModel = model('WebhookEvent', webhookEventSchema);
