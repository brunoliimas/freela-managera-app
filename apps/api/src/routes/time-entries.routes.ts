import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
    getTimeEntries,
    getTimeEntry,
    createTimeEntry,
    updateTimeEntry,
    deleteTimeEntry,
    startTimer,
    stopTimer,
    getActiveTimer,
    getResumoHoras,
} from '../controllers/time-entries.controller';

const router = Router();

router.use(authMiddleware);

router.get('/', getTimeEntries);
router.get('/resumo', getResumoHoras);
router.get('/active', getActiveTimer);
router.get('/:id', getTimeEntry);
router.post('/', createTimeEntry);
router.post('/start', startTimer);
router.post('/:id/stop', stopTimer);
router.put('/:id', updateTimeEntry);
router.delete('/:id', deleteTimeEntry);

export default router;
