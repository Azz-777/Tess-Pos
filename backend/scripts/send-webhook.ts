import crypto from 'crypto';

const secret = process.env.PAYMENT_WEBHOOK_SECRET ?? 'dev-webhook-secret-change-me';
const apiUrl = process.env.API_URL ?? 'http://localhost:4000';

const [orderId, tenantId, eventId] = process.argv.slice(2);

if (!orderId || !tenantId) {
  console.error('Usage: npm run send-webhook -- <orderId> <tenantId> [eventId]');
  process.exit(1);
}

const body = JSON.stringify({
  eventId: eventId ?? `evt-${orderId}`,
  type: 'payment.succeeded',
  orderId,
  tenantId,
});

const signature = crypto.createHmac('sha256', secret).update(Buffer.from(body)).digest('hex');

fetch(`${apiUrl}/api/webhooks/payment`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'x-signature': signature },
  body,
})
  .then(async (res) => {
    const json = await res.json();
    console.log('Status', res.status, json);
  })
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
