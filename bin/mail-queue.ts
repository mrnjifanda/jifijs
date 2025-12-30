#!/usr/bin/env node

/**
 * Mail Queue CLI Tool
 *
 * Commandes disponibles :
 * - npm run mail-queue:stats       # Voir les statistiques
 * - npm run mail-queue:failed      # Voir les jobs échoués
 * - npm run mail-queue:retry-all   # Retenter tous les jobs échoués
 * - npm run mail-queue:clean       # Nettoyer les anciens jobs
 * - npm run mail-queue:monitor     # Surveiller en temps réel
 */

import mailService from '../utils/bases/mail.service';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function showStats() {
  log('\n📊 Mail Queue Statistics\n', 'bright');

  const stats = await mailService.getQueueStats();

  if (!stats) {
    log('❌ Queue is not enabled', 'red');
    return;
  }

  console.log(`   Waiting:   ${stats.waiting}`);
  console.log(`   Active:    ${stats.active}`);
  console.log(`   Delayed:   ${stats.delayed}`);
  console.log(`   Completed: ${stats.completed}`);
  console.log(`   Failed:    ${stats.failed}`);

  const total = stats.completed + stats.failed;
  if (total > 0) {
    const successRate = ((stats.completed / total) * 100).toFixed(2);
    log(`\n   Success Rate: ${successRate}%`, 'green');
  }

  console.log('');
}

async function showFailedJobs() {
  log('\n❌ Failed Mail Jobs\n', 'bright');

  const failedJobs = await mailService.getFailedJobs();

  if (failedJobs.length === 0) {
    log('✅ No failed jobs!', 'green');
    return;
  }

  for (const job of failedJobs) {
    console.log(`\n   Job ID: ${job.id}`);
    console.log(`   To: ${job.data.data.receivers}`);
    console.log(`   Subject: ${job.data.data.subject}`);
    console.log(`   Attempts: ${job.attemptsMade}`);
    log(`   Reason: ${job.failedReason}`, 'yellow');
  }

  console.log('');
  log(`Total: ${failedJobs.length} failed jobs\n`, 'cyan');
}

async function retryAllJobs() {
  log('\n🔄 Retrying All Failed Jobs\n', 'bright');

  const retriedCount = await mailService.retryAllFailedJobs();

  if (retriedCount > 0) {
    log(`✅ Successfully queued ${retriedCount} jobs for retry\n`, 'green');
  } else {
    log('ℹ️  No failed jobs to retry\n', 'cyan');
  }
}

async function cleanJobs() {
  log('\n🧹 Cleaning Old Jobs\n', 'bright');

  const completedJobs = await mailService.cleanCompletedJobs();
  const failedJobs = await mailService.cleanFailedJobs();

  log(`✅ Cleaned ${completedJobs?.length || 0} completed jobs`, 'green');
  log(`✅ Cleaned ${failedJobs?.length || 0} failed jobs\n`, 'green');
}

async function monitor() {
  log('\n🔍 Mail Queue Monitor (Press Ctrl+C to stop)\n', 'bright');

  async function display() {
    console.clear();
    log('╔═══════════════════════════════════════════╗', 'cyan');
    log('║     📧 MAIL QUEUE MONITOR                 ║', 'cyan');
    log('╚═══════════════════════════════════════════╝', 'cyan');

    const stats = await mailService.getQueueStats();

    if (!stats) {
      log('\n❌ Queue is not enabled', 'red');
      return;
    }

    const timestamp = new Date().toLocaleTimeString();
    log(`\nLast Update: ${timestamp}\n`, 'cyan');

    console.log(`⏳ Waiting:   ${stats.waiting.toString().padStart(4)} jobs`);
    console.log(`🔄 Active:    ${stats.active.toString().padStart(4)} jobs`);
    console.log(`⏸️  Delayed:   ${stats.delayed.toString().padStart(4)} jobs`);
    console.log(`✅ Completed: ${stats.completed.toString().padStart(4)} jobs`);
    console.log(`❌ Failed:    ${stats.failed.toString().padStart(4)} jobs`);

    const total = stats.completed + stats.failed;
    if (total > 0) {
      const successRate = ((stats.completed / total) * 100).toFixed(2);
      log(`\n📈 Success Rate: ${successRate}%`, 'green');
    }

    if (stats.failed > 0) {
      log(`\n⚠️  ${stats.failed} failed jobs need attention`, 'yellow');
    }
  }

  await display();
  setInterval(display, 5000);
}

async function showHelp() {
  log('\n📧 Mail Queue CLI Tool\n', 'bright');
  console.log('Usage:');
  console.log('  npm run mail-queue:stats       Show queue statistics');
  console.log('  npm run mail-queue:failed      Show failed jobs');
  console.log('  npm run mail-queue:retry-all   Retry all failed jobs');
  console.log('  npm run mail-queue:clean       Clean old jobs');
  console.log('  npm run mail-queue:monitor     Monitor queue in real-time');
  console.log('  npm run mail-queue:help        Show this help message\n');
}

// Parse command line arguments
const command = process.argv[2];

(async () => {
  try {
    switch (command) {
      case 'stats':
        await showStats();
        break;
      case 'failed':
        await showFailedJobs();
        break;
      case 'retry-all':
        await retryAllJobs();
        break;
      case 'clean':
        await cleanJobs();
        break;
      case 'monitor':
        await monitor();
        return; // Don't exit for monitor
      case 'help':
      default:
        await showHelp();
        break;
    }

    process.exit(0);
  } catch (error: any) {
    log(`\n❌ Error: ${error.message}\n`, 'red');
    process.exit(1);
  }
})();
