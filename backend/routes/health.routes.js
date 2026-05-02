const express = require('express');
const mongoose = require('mongoose');
const { getMongoDiagnostics } = require('../config/db');

const router = express.Router();

function mapReadyState(state) {
  switch (state) {
    case 0: return 'disconnected';
    case 1: return 'connected';
    case 2: return 'connecting';
    case 3: return 'disconnecting';
    default: return 'unknown';
  }
}

router.get('/', (req, res) => {
  const uptime = process.uptime();
  const mem = process.memoryUsage();
  const diag = getMongoDiagnostics();

  res.json({
    status: 'ok',
    uptimeSeconds: Math.floor(uptime),
    pid: process.pid,
    env: process.env.NODE_ENV || 'development',
    memory: {
      rss: mem.rss,
      heapTotal: mem.heapTotal,
      heapUsed: mem.heapUsed
    },
    mongodb: {
      configured: diag.configured,
      uriMasked: diag.uriMasked,
      readyState: mongoose.connection ? mongoose.connection.readyState : null,
      state: mapReadyState(mongoose.connection ? mongoose.connection.readyState : -1),
      lastAttemptAt: diag.lastAttemptAt,
      lastConnectedAt: diag.lastConnectedAt,
      lastError: diag.lastError
    }
  });
});

// Dedicated endpoint to inspect MongoDB connection state and optional DB ping
router.get('/mongo', async (req, res) => {
  const state = mongoose.connection ? mongoose.connection.readyState : null;
  const diag = getMongoDiagnostics();
  const result = {
    configured: diag.configured,
    uriMasked: diag.uriMasked,
    readyState: state,
    state: mapReadyState(state),
    lastAttemptAt: diag.lastAttemptAt,
    lastConnectedAt: diag.lastConnectedAt,
    lastError: diag.lastError
  };

  if (state === 1 && mongoose.connection.db) {
    try {
      const admin = mongoose.connection.db.admin();
      const ping = await admin.ping();
      result.ping = ping;
    } catch (err) {
      result.pingError = err.message;
    }
  }

  res.json(result);
});

module.exports = router;
