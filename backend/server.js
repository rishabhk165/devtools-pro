/**
 * DevTools Pro Backend Server
 * 
 * Replaces Google Sheets with Supabase PostgreSQL.
 * Automatically attaches Google Meet links and setup notes.
 * 
 * Deploy to: Render.com (free), Railway, or any Node.js host
 */

require('dotenv').config();

// Polyfill fetch for Node 18 DNS issues on some Linux systems
globalThis.fetch = require('cross-fetch');

const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
const { initDB, addSubmission, getAllSubmissions, getSubmissionByUTR, getStats } = require('./db');
const { generateSetupMessage, generateQuickReply } = require('./meet-service');

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Middleware ───
app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type']
}));

// Initialize database on startup
initDB().catch(err => {
  console.error('Failed to connect to Supabase:', err.message);
  process.exit(1);
});

// ─── Health Check ───
app.get('/', (req, res) => {
  res.json({
    status: 'ok',
    service: 'DevTools Pro Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// ─── POST /api/submit ───
// Main endpoint: receives user form data, stores in DB, returns Meet link + message
app.post('/api/submit', async (req, res) => {
  try {
    const { firstName, lastName, email, selectedPlan, utrId, submissionTimestamp } = req.body;

    // Validate required fields
    const requiredFields = { firstName, lastName, email, selectedPlan, utrId };
    for (const [field, value] of Object.entries(requiredFields)) {
      if (!value || !value.toString().trim()) {
        return res.status(400).json({
          status: 'error',
          message: `Missing required field: ${field}`
        });
      }
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        status: 'error',
        message: 'Invalid email format'
      });
    }

    // Generate Meet link and setup message
    const userData = { firstName, lastName, email, selectedPlan, utrId };
    const setupInfo = generateSetupMessage(userData);

    // Prepare submission record
    const submission = {
      id: uuidv4(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      selectedPlan,
      utrId: utrId.trim(),
      submissionTimestamp: submissionTimestamp || new Date().toISOString(),
      meetLink: setupInfo.meetLink,
      notes: setupInfo.autoReplyNote
    };

    // Save to database
    const result = await addSubmission(submission);

    if (!result.success) {
      if (result.error === 'duplicate') {
        return res.status(409).json({
          status: 'duplicate',
          message: 'This UTR/Transaction ID has already been submitted'
        });
      }
      return res.status(500).json({
        status: 'error',
        message: result.message
      });
    }

    // Build the WhatsApp redirect URL with Meet link included
    const whatsappNumber = process.env.WHATSAPP_NUMBER || '919019879108';
    const quickReply = generateQuickReply(userData, setupInfo.meetLink);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${whatsappNumber}&text=${encodeURIComponent(setupInfo.whatsappMessage)}`;

    // Return success with Meet link and WhatsApp URL
    res.status(201).json({
      status: 'success',
      message: 'Submission saved successfully',
      data: {
        id: submission.id,
        meetLink: setupInfo.meetLink,
        setupNote: setupInfo.autoReplyNote,
        whatsappUrl,
        whatsappMessage: setupInfo.whatsappMessage,
        quickReply
      }
    });

    console.log(`✅ New submission: ${firstName} ${lastName} | Plan: ${selectedPlan} | Meet: ${setupInfo.meetLink}`);

  } catch (error) {
    console.error('❌ Submit error:', error);
    res.status(500).json({
      status: 'error',
      message: 'Internal server error'
    });
  }
});

// ─── GET /api/submissions ───
// Admin endpoint: get all submissions
app.get('/api/submissions', async (req, res) => {
  try {
    const submissions = await getAllSubmissions();
    res.json({
      status: 'success',
      count: submissions.length,
      data: submissions
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ─── GET /api/check-utr/:utrId ───
// Check if a UTR already exists
app.get('/api/check-utr/:utrId', async (req, res) => {
  try {
    const existing = await getSubmissionByUTR(req.params.utrId);
    res.json({
      exists: !!existing,
      status: existing ? existing.status : null
    });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ─── GET /api/stats ───
// Get submission statistics
app.get('/api/stats', async (req, res) => {
  try {
    const stats = await getStats();
    res.json({ status: 'success', data: stats });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ─── Start Server ───
app.listen(PORT, () => {
  console.log(`
╔══════════════════════════════════════════════╗
║   DevTools Pro Backend                       ║
║   Running on port ${PORT}                        ║
║   Database: Supabase PostgreSQL              ║
║   Meet links: Configured ✓                   ║
╚══════════════════════════════════════════════╝
  `);
});

module.exports = app;
