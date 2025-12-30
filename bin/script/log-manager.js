const { logsInterceptor } = require('../../utils/interceptors/logs.interceptor');
const logsService = require('../../src/services/admin/logs.service');
const logger = require('../../utils/helpers/logger.helper');

class LogManager {
    
    async showStats() {
        try {
            const stats = await logsInterceptor.getStats();
            const dbStats = await logsService.getStatistics();
            
            console.table({
                'Queue Size': stats.queue.queue_size,
                'Files Count': stats.file.files_count,
                'Total Size (MB)': stats.file.total_size_mb,
                'DB Records': stats.database,
                'System Load': (stats.queue.system_load * 100).toFixed(2) + '%',
                'Memory Usage': (stats.queue.memory_usage * 100).toFixed(2) + '%'
            });
            
            if (dbStats.data.total_requests) {
                console.log('\n--- Database Statistics ---');
                console.table({
                    'Total Requests': dbStats.data.total_requests,
                    'Average Response Time': dbStats.data.avg_response_time + 'ms',
                    'Error Rate': dbStats.data.error_rate + '%',
                    'Total Errors': dbStats.data.total_errors
                });
            }
            
        } catch (error) {
            logger.error('Error getting stats:', error.message);
        }
    }
    
    async cleanup(days = 30) {
        try {
            logger.info(`Starting cleanup of logs older than ${days} days...`);
            const deletedCount = await logsInterceptor.cleanup(days);
            logger.info(`Cleanup completed: ${deletedCount} files removed`);
        } catch (error) {
            logger.error('Cleanup error:', error.message);
        }
    }
    
    async exportLogs(startDate, endDate, format = 'json') {
        try {
            const filters = {};
            if (startDate) filters.timestamp = { $gte: new Date(startDate) };
            if (endDate) filters.timestamp = { ...filters.timestamp, $lte: new Date(endDate) };
            
            const logs = await logsService.find(filters);
            
            if (logs.error) {
                throw new Error(logs.message);
            }
            
            const filename = `logs_export_${Date.now()}.${format}`;
            const fs = require('fs');
            
            if (format === 'json') {
                fs.writeFileSync(filename, JSON.stringify(logs.data, null, 2));
            } else if (format === 'csv') {
                // Conversion simple en CSV
                const csv = logs.data.map(log => 
                    [log.timestamp, log.method, log.url, log.status_code, log.execution_time].join(',')
                ).join('\n');
                fs.writeFileSync(filename, 'timestamp,method,url,status_code,execution_time\n' + csv);
            }
            
            logger.info(`Logs exported to ${filename}`);
            
        } catch (error) {
            logger.error('Export error:', error.message);
        }
    }
}

// Usage via CLI
const command = process.argv[2];
const manager = new LogManager();

switch (command) {
    case 'stats':
        manager.showStats();
        break;
    case 'cleanup':
        const days = process.argv[3] || 30;
        manager.cleanup(parseInt(days));
        break;
    case 'export':
        const start = process.argv[3];
        const end = process.argv[4];
        const format = process.argv[5] || 'json';
        manager.exportLogs(start, end, format);
        break;
    default:
        console.log('Usage:');
        console.log('  node scripts/log-manager.js stats');
        console.log('  node scripts/log-manager.js cleanup [days]');
        console.log('  node scripts/log-manager.js export [start_date] [end_date] [format]');
}

module.exports = LogManager;