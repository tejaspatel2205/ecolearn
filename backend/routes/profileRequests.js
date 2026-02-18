const express = require('express');
const User = require('../models/User');
const ProfileUpdateRequest = require('../models/ProfileUpdateRequest');
const Notification = require('../models/Notification');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

const router = express.Router();

// Get my pending request (User)
router.get('/my-request', authMiddleware, async (req, res) => {
    try {
        const request = await ProfileUpdateRequest.findOne({
            user_id: req.user._id,
            status: 'pending'
        });
        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Create/Update request (User)
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { changes } = req.body;

        // Check if pending request exists
        let request = await ProfileUpdateRequest.findOne({
            user_id: req.user._id,
            status: 'pending'
        });

        if (request) {
            // Update existing request
            request.requested_changes = changes;
            request.updated_at = Date.now();
            // IMPORTANT: Reset status to pending so admin sees it again
            request.status = 'pending';
            request.admin_feedback = ''; // Clear previous rejection feedback
            await request.save();
        } else {
            // Create new request
            request = new ProfileUpdateRequest({
                user_id: req.user._id,
                requested_changes: changes
            });
            await request.save();
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Get all pending requests (Admin)
router.get('/admin', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        console.log('[ProfileRequest] Admin fetching pending requests...');
        const requests = await ProfileUpdateRequest.find({ status: 'pending' })
            .populate('user_id', 'full_name email role')
            .sort({ created_at: 1 });

        console.log(`[ProfileRequest] Found ${requests.length} pending requests.`);
        if (requests.length > 0) {
            console.log('[ProfileRequest] Sample request:', JSON.stringify(requests[0], null, 2));
        }

        res.json(requests);
    } catch (error) {
        console.error('[ProfileRequest] Admin fetch error:', error);
        res.status(500).json({ error: error.message });
    }
});

// Approve/Reject request (Admin)
router.put('/:id/status', authMiddleware, roleMiddleware('admin'), async (req, res) => {
    try {
        const { status, feedback } = req.body;
        const request = await ProfileUpdateRequest.findById(req.params.id);

        if (!request) {
            return res.status(404).json({ error: 'Request not found' });
        }

        request.status = status;
        request.admin_feedback = feedback || '';
        request.reviewed_at = Date.now();
        request.reviewed_by = req.user._id;

        if (status === 'approved') {
            console.log(`[ProfileRequest] Approving request ${req.params.id} for user ${request.user_id}`);

            // Apply changes to user profile
            const user = await User.findById(request.user_id);
            if (user) {
                const changes = request.requested_changes;
                console.log('[ProfileRequest] Changes to apply:', changes);

                // Allowed fields to update
                const allowedFields = [
                    'full_name', 'mobile', 'institution_id', 'semester',
                    'standard', 'university_details', 'college_name', 'ngo_details'
                ];

                let updated = false;
                Object.keys(changes).forEach(key => {
                    if (allowedFields.includes(key)) {
                        let value = changes[key];

                        // Handle ObjectId fields
                        if (key === 'institution_id') {
                            if (value === '' || value === 'null') value = null;
                        }

                        // Handle Number fields
                        if (['semester', 'standard'].includes(key)) {
                            if (value === '' || value === null) {
                                value = null;
                            } else {
                                value = Number(value);
                            }
                        }

                        console.log(`[ProfileRequest] Updating ${key}: ${user[key]} -> ${value}`);
                        user[key] = value;
                        updated = true;
                    } else {
                        console.log(`[ProfileRequest] Skipped field: ${key}`);
                    }
                });

                if (updated) {
                    try {
                        await user.save();
                        console.log('[ProfileRequest] User profile saved successfully.');
                    } catch (saveError) {
                        console.error('[ProfileRequest] Error saving user profile:', saveError);
                        // Return error to client so they know it failed
                        return res.status(500).json({ error: 'Failed to apply profile changes to user.' });
                    }
                } else {
                    console.log('[ProfileRequest] No valid fields found to update.');
                }
            } else {
                console.error('[ProfileRequest] User not found during approval.');
            }
        }

        await request.save();

        // Create Notification
        try {
            const notification = new Notification({
                user_id: request.user_id,
                title: `Profile Update Request ${status.charAt(0).toUpperCase() + status.slice(1)}`,
                message: status === 'approved'
                    ? 'Your profile update request has been approved and changes have been applied.'
                    : `Your profile update request was rejected. Feedback: ${request.admin_feedback || 'No feedback provided.'}`,
                type: status === 'approved' ? 'success' : 'error'
            });
            await notification.save();
        } catch (notifError) {
            console.error('Failed to create notification:', notifError);
            // Don't fail the request if notification fails
        }

        res.json(request);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;
