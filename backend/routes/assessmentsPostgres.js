const express = require('express');
const router = express.Router();
const { query } = require('../config/postgres');

const getUserId = (req) => req.user?.uid || req.user?.id || req.auth?.uid;

router.get('/', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const result = await query(`
      SELECT sa.id, sa.skill_id, sa.title, sa.description, sa.difficulty,
             sa.duration_minutes, sa.questions, sa.published,
             COALESCE(MAX(aa.submitted_at), NULL) AS last_submitted_at,
             COALESCE(MAX(aa.percentage), NULL) AS last_percentage
      FROM app.skill_assessments sa
      LEFT JOIN app.assessment_attempts aa
        ON aa.assessment_id = sa.id AND aa.user_id = $1
      WHERE sa.published = true
      GROUP BY sa.id
      ORDER BY sa.title ASC
    `, [userId]);
    res.json({ success: true, assessments: result.rows, data: result.rows });
  } catch (err) { next(err); }
});

router.get('/:assessmentId', async (req, res, next) => {
  try {
    const result = await query(`
      SELECT id, skill_id, title, description, difficulty,
             duration_minutes, questions, published
      FROM app.skill_assessments
      WHERE id = $1 AND published = true
      LIMIT 1
    `, [req.params.assessmentId]);
    if (!result.rows.length) return res.status(404).json({ success: false, message: 'Assessment not found' });
    res.json({ success: true, assessment: result.rows[0], data: result.rows[0] });
  } catch (err) { next(err); }
});

router.post('/:assessmentId/start', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const assessmentId = req.params.assessmentId;
    const assessment = await query(`
      SELECT id, title, duration_minutes, questions
      FROM app.skill_assessments
      WHERE id = $1 AND published = true
      LIMIT 1
    `, [assessmentId]);
    if (!assessment.rows.length) return res.status(404).json({ success: false, message: 'Assessment not found' });

    const result = await query(`
      INSERT INTO app.assessment_attempts
        (assessment_id, user_id, answers, started_at)
      VALUES ($1, $2, '{}'::jsonb, now())
      RETURNING id, assessment_id, user_id, started_at, created_at
    `, [assessmentId, userId]);

    res.status(201).json({
      success: true,
      attempt: result.rows[0],
      assessment: assessment.rows[0],
      data: result.rows[0]
    });
  } catch (err) { next(err); }
});

router.post('/:assessmentId/submit', async (req, res, next) => {
  const client = await require('../config/postgres').pool.connect();
  try {
    const userId = getUserId(req);
    const assessmentId = req.params.assessmentId;
    const answers = req.body?.answers || {};
    await client.query('BEGIN');

    const assessment = await client.query(`
      SELECT id, title, questions
      FROM app.skill_assessments
      WHERE id = $1 AND published = true
      LIMIT 1
    `, [assessmentId]);

    if (!assessment.rows.length) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Assessment not found' });
    }

    const questions = Array.isArray(assessment.rows[0].questions)
      ? assessment.rows[0].questions : [];

    let correct = 0;
    let total = questions.length;

    for (const q of questions) {
      const key = q.id ?? q.questionId ?? q.key ?? String(questions.indexOf(q));
      const submitted = answers[key];
      const expected = q.correctAnswer ?? q.correct_answer ?? q.answer;
      if (expected !== undefined && submitted !== undefined &&
          String(submitted).trim().toLowerCase() === String(expected).trim().toLowerCase()) {
        correct++;
      }
    }

    const score = correct;
    const percentage = total > 0 ? Number(((correct / total) * 100).toFixed(2)) : 0;

    const existing = await client.query(`
      SELECT id FROM app.assessment_attempts
      WHERE assessment_id = $1 AND user_id = $2 AND submitted_at IS NULL
      ORDER BY created_at DESC LIMIT 1
    `, [assessmentId, userId]);

    let attempt;
    if (existing.rows.length) {
      attempt = await client.query(`
        UPDATE app.assessment_attempts
        SET answers = $1::jsonb, score = $2, percentage = $3, submitted_at = now()
        WHERE id = $4
        RETURNING *
      `, [JSON.stringify(answers), score, percentage, existing.rows[0].id]);
    } else {
      attempt = await client.query(`
        INSERT INTO app.assessment_attempts
          (assessment_id, user_id, score, percentage, answers, started_at, submitted_at)
        VALUES ($1, $2, $3, $4, $5::jsonb, now(), now())
        RETURNING *
      `, [assessmentId, userId, score, percentage, JSON.stringify(answers)]);
    }

    const points = Math.max(0, Math.round(percentage));
    if (points > 0) {
      await client.query(`
        INSERT INTO app.point_ledger
          (user_id, points, reason, source_type, source_id)
        VALUES ($1, $2, $3, 'assessment', $4)
      `, [userId, points, `Completed assessment: ${assessment.rows[0].title}`, attempt.rows[0].id]);
    }

    await client.query('COMMIT');

    res.json({
      success: true,
      result: {
        attemptId: attempt.rows[0].id,
        score,
        total,
        percentage,
        pointsAwarded: points
      },
      data: attempt.rows[0]
    });
  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    next(err);
  } finally {
    client.release();
  }
});

router.get('/:assessmentId/results', async (req, res, next) => {
  try {
    const userId = getUserId(req);
    const result = await query(`
      SELECT id, assessment_id, score, percentage, answers,
             started_at, submitted_at, created_at
      FROM app.assessment_attempts
      WHERE assessment_id = $1 AND user_id = $2
      ORDER BY created_at DESC
    `, [req.params.assessmentId, userId]);
    res.json({ success: true, attempts: result.rows, data: result.rows });
  } catch (err) { next(err); }
});

module.exports = router;
