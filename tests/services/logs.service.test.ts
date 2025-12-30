import logsService from '../../src/services/admin/logs.service';
import Log from '../../src/models/log.model';
import { createActivatedUser } from '../helpers/test.helpers';
import { LogAction } from '../../src/types';

describe('LogsService', () => {

    beforeEach(async () => {
        await Log.deleteMany({});
    });

    describe('getStatistics()', () => {
        it('should return statistics about logs', async () => {
            const user = await createActivatedUser();
            await logsService.create({
                id: 'test-log-1',
                method: 'GET',
                url: '/test1',
                status_code: 200,
                action: LogAction.READ,
                user: user._id,
                execution_time: 100
            } as any);
            await logsService.create({
                id: 'test-log-2',
                method: 'POST',
                url: '/test2',
                status_code: 404,
                action: LogAction.CREATE,
                user: user._id,
                execution_time: 200
            } as any);

            const stats = await logsService.getStatistics();
            expect(stats.error).toBe(false);
            expect(stats.data.total_requests).toBe(2);
            expect(stats.data.total_errors).toBe(1);
            expect(stats.data.avg_response_time).toBe(150);
        });
    });

    describe('getTopEndpoints()', () => {
        it('should return top endpoints from logs', async () => {
            const user = await createActivatedUser();
            await logsService.create({ id: '1', method: 'GET', url: '/popular', status_code: 200, action: LogAction.READ, user: user._id, execution_time: 50 } as any);
            await logsService.create({ id: '2', method: 'GET', url: '/popular', status_code: 200, action: LogAction.READ, user: user._id, execution_time: 60 } as any);
            await logsService.create({ id: '3', method: 'POST', url: '/less-popular', status_code: 201, action: LogAction.CREATE, user: user._id, execution_time: 100 } as any);

            const topEndpoints = await logsService.getTopEndpoints();
            expect(topEndpoints.error).toBe(false);
            expect(topEndpoints.data.length).toBe(2);
            expect(topEndpoints.data[0].endpoint).toBe('GET /popular');
            expect(topEndpoints.data[0].count).toBe(2);
        });
    });

    describe('getErrorLogs()', () => {
        it('should return only error logs', async () => {
            const user = await createActivatedUser();
            await logsService.create({ id: '1', method: 'GET', url: '/success', status_code: 200, action: LogAction.READ, user: user._id } as any);
            await logsService.create({ id: '2', method: 'POST', url: '/fail', status_code: 500, action: LogAction.CREATE, user: user._id } as any);

            const errorLogs = await logsService.getErrorLogs();
            // This is tricky because base.service find returns a full object
            expect(errorLogs.error).toBe(false);
            expect(errorLogs.data.content.length).toBe(1);
            expect(errorLogs.data.content[0].status_code).toBe(500);
        });
    });

    describe('getUserActivity()', () => {
        it('should return logs for a specific user', async () => {
            const user1 = await createActivatedUser();
            const user2 = await createActivatedUser();
            await logsService.create({ id: '1', method: 'GET', url: '/test', status_code: 200, action: LogAction.READ, user: user1._id } as any);
            await logsService.create({ id: '2', method: 'POST', url: '/test', status_code: 201, action: LogAction.CREATE, user: user2._id } as any);

            const user1Activity = await logsService.getUserActivity(user1._id);
            expect(user1Activity.error).toBe(false);
            expect(user1Activity.data.length).toBe(1);
            expect(user1Activity.data[0].user.toString()).toBe(user1._id.toString());
        });
    });
});
