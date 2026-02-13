import { Router } from 'express';
import express from 'express';
import { handleStripeWebhook, handleENotasWebhook } from '../controllers/webhook.controller';

const router = Router();

// Webhook do Stripe precisa do body raw (não JSON parsed)
router.post('/stripe', express.raw({ type: 'application/json' }), handleStripeWebhook);

// Webhook da eNotas (JSON parsed normal)
router.post('/enotas', express.json(), handleENotasWebhook);

export default router;
