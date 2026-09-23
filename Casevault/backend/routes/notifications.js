const express = require('express');
const router = express.Router();
const db = require('../services/db');

// List notifications
router.get('/', (req, res) => {
  const notifs = db.all(`
    SELECT * FROM notifications
    ORDER BY created_at DESC
    LIMIT 20
  `);
  res.json({ success: true, data: notifs });
});

// Mark notification as read
router.patch('/:id/read', (req, res) => {
  db.run('UPDATE notifications SET is_read = 1 WHERE id = ?', [req.params.id]);
  res.json({ success: true, message: 'Notification marked as read' });
});

module.exports = router;
