const express = require('express');
const router = express.Router();
const Badge = require('../models/Badge');
const StudentBadge = require('../models/StudentBadge');
const InternalAssessment = require('../models/InternalAssessment');
const ExamGoal = require('../models/ExamGoal');
const { authMiddleware, roleMiddleware } = require('../middleware/auth');

// --- BADGE DEFINITIONS (SEED DATA) ---
const BADGE_DEFINITIONS = [
    // BASIC
    { name: "Academic Explorer", level: "Basic", description: "Started exploring academic performance.", icon: "Compass" },
    { name: "Assessment Ready", level: "Basic", description: "Completed all internal assessments for the semester.", icon: "CheckSquare" },
    { name: "Progress Tracker", level: "Basic", description: "Regularly monitored progress.", icon: "BarChart2" },
    { name: "Goal Starter", level: "Basic", description: "Set at least one academic goal.", icon: "Target" },
    { name: "Planner Initiate", level: "Basic", description: "Used exam preparation suggestions.", icon: "BookOpen" },

    // INTERMEDIATE
    { name: "Consistent Performer", level: "Intermediate", description: "Maintained steady performance.", icon: "Activity" },
    { name: "Rising Scholar", level: "Intermediate", description: "Showed measurable improvement.", icon: "TrendingUp" },
    { name: "Balanced Learner", level: "Intermediate", description: "Performed reasonably well across all subjects.", icon: "Scale" },
    { name: "Target Achiever", level: "Intermediate", description: "Achieved a set academic target.", icon: "Award" },
    { name: "Strategic Improver", level: "Intermediate", description: "Improved after following suggestions.", icon: "Zap" },

    // ADVANCED
    { name: "Academic Star", level: "Advanced", description: "Strong overall semester performance.", icon: "Star" },
    { name: "Subject Excellence", level: "Advanced", description: "Exceptional performance in a specific subject.", icon: "Medal" },
    { name: "Comeback Champion", level: "Advanced", description: "Significantly improved after a weak start.", icon: "CornerRightUp" },
    { name: "Strategic Learner", level: "Advanced", description: "Consistently followed planner insights.", icon: "Brain" },
    { name: "Semester Achiever", level: "Advanced", description: "Completed semester with strong performance and planning.", icon: "Trophy" }
];

// Helper to seed badges if missing
const ensureBadgesExist = async () => {
    try {
        const count = await Badge.countDocuments();
        if (count < BADGE_DEFINITIONS.length) {
            for (const badgeDef of BADGE_DEFINITIONS) {
                await Badge.findOneAndUpdate(
                    { name: badgeDef.name },
                    { ...badgeDef, category: badgeDef.level },
                    { upsert: true, new: true }
                );
            }
            console.log("🏅 Badges Seeded/Updated");
        }
    } catch (err) {
        console.error("Badge Seeding Error:", err);
    }
};

// @route   GET /api/badges/my-badges
// @desc    Get all badges for the logged-in student (Checks and Awards new ones)
// @access  Private (Student)
router.get('/my-badges', authMiddleware, roleMiddleware('student'), async (req, res) => {
    try {
        await ensureBadgesExist();
        const studentId = req.user._id;

        // 1. Fetch Data for Evaluation
        const marks = await InternalAssessment.find({ student_id: studentId });
        const goals = await ExamGoal.find({ student_id: studentId });
        const existingBadges = await StudentBadge.find({ student_id: studentId }).populate('badge_id');
        const earnedBadgeNames = new Set(existingBadges.map(sb => sb.badge_id.name));

        const newBadgesToAward = [];
        const allBadges = await Badge.find();

        // 2. Evaluation Logic
        for (const badge of allBadges) {
            if (earnedBadgeNames.has(badge.name)) continue;

            let earned = false;

            // --- BASIC ---
            if (badge.name === "Academic Explorer") {
                earned = true; // Visiting this page grants it
            }
            else if (badge.name === "Assessment Ready") {
                // Logic: Has at least 3 marks entries (mock logic for 'all')
                if (marks.length >= 3) earned = true;
            }
            else if (badge.name === "Progress Tracker") {
                // Logic: Mock check (assume true if they have checked marks > 5 times - needing DB field, simplify to true for demo)
                // For demo: Award if they have > 1 mark record
                if (marks.length > 1) earned = true;
            }
            else if (badge.name === "Goal Starter") {
                if (goals.length > 0) earned = true;
            }
            else if (badge.name === "Planner Initiate") {
                // Logic: Mock - Award if they have a goal and a mark (used planner)
                if (goals.length > 0 && marks.length > 0) earned = true;
            }

            // --- INTERMEDIATE ---
            else if (badge.name === "Consistent Performer") {
                // Logic: Variance check. Simply: All marks > 60%
                const consistentlyGood = marks.every(m => (m.internal_marks_obtained / m.total_internal_marks) > 0.6);
                if (marks.length >= 3 && consistentlyGood) earned = true;
            }
            else if (badge.name === "Rising Scholar") {
                // Logic: Latest mark > Oldest mark
                if (marks.length >= 2) {
                    const sorted = [...marks].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
                    const first = sorted[0];
                    const last = sorted[sorted.length - 1];
                    const firstPct = first.internal_marks_obtained / first.total_internal_marks;
                    const lastPct = last.internal_marks_obtained / last.total_internal_marks;
                    if (lastPct > firstPct + 0.1) earned = true;
                }
            }
            else if (badge.name === "Balanced Learner") {
                // Logic: distinct subjects >= 4 and all passed
                const distinctSubs = new Set(marks.map(m => m.subject_name));
                const allPassed = marks.every(m => (m.internal_marks_obtained / m.total_internal_marks) >= 0.4);
                if (distinctSubs.size >= 3 && allPassed) earned = true;
            }
            else if (badge.name === "Target Achiever") {
                // Logic: Check if any marks >= target goal (simplification: any mark >= 70% if goal exists)
                if (goals.length > 0 && marks.some(m => (m.internal_marks_obtained / m.total_internal_marks) >= 0.75)) earned = true;
            }
            else if (badge.name === "Strategic Improver") {
                // Mock: Award if > 5 marks
                if (marks.length > 5) earned = true;
            }

            // --- ADVANCED ---
            else if (badge.name === "Academic Star") {
                // Avg > 85%
                const totalPct = marks.reduce((acc, m) => acc + (m.internal_marks_obtained / m.total_internal_marks), 0);
                if (marks.length >= 4 && (totalPct / marks.length) >= 0.85) earned = true;
            }
            else if (badge.name === "Subject Excellence") {
                // Any subject 100% (or >95%)
                if (marks.some(m => (m.internal_marks_obtained / m.total_internal_marks) >= 0.95)) earned = true;
            }
            else if (badge.name === "Comeback Champion") {
                // One bad mark (<40%) followed by good mark (>70%) later
                // Simplified: Just check existence
                const hasFail = marks.some(m => (m.internal_marks_obtained / m.total_internal_marks) < 0.4);
                const hasAce = marks.some(m => (m.internal_marks_obtained / m.total_internal_marks) > 0.8);
                if (hasFail && hasAce) earned = true;
            }
            else if (badge.name === "Strategic Learner") {
                // Mock: Award if many goals and marks
                if (goals.length >= 3 && marks.length >= 5) earned = true;
            }
            else if (badge.name === "Semester Achiever") {
                // Mock: End game
                if (marks.length >= 6 && goals.length >= 2) earned = true;
            }

            if (earned) {
                newBadgesToAward.push({
                    student_id: studentId,
                    badge_id: badge._id
                });
            }
        }

        // 3. Award New Badges
        if (newBadgesToAward.length > 0) {
            await StudentBadge.insertMany(newBadgesToAward);
        }

        // 4. Return Final List
        const updatedStudentBadges = await StudentBadge.find({ student_id: studentId }).populate('badge_id');
        const earnedMap = {};
        updatedStudentBadges.forEach(sb => {
            earnedMap[sb.badge_id._id.toString()] = sb.earned_at;
        });

        const response = allBadges.map(b => ({
            ...b.toJSON(),
            earned: !!earnedMap[b._id.toString()],
            earned_at: earnedMap[b._id.toString()] || null
        }));

        res.json(response);

    } catch (error) {
        console.error('Badge Error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
