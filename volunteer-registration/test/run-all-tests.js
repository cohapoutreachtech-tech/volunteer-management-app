/**
 * Master Test Runner
 * Executes all API test suites and generates comprehensive report
 */

const { spawn } = require('child_process');
const path = require('path');

// Test suites configuration
const testSuites = [
  { name: 'AuthAPI', file: 'test-auth-api.js', description: 'Authentication endpoint tests' },
  { name: 'VolunteerAPI', file: 'test-volunteer-api.js', description: 'Volunteer CRUD operations' },
  { name: 'EventAPI', file: 'test-event-api.js', description: 'Event CRUD operations' },
  { name: 'RegistrationAPI', file: 'test-registration-api.js', description: 'Registration CRUD with duplicate prevention' },
  { name: 'VolunteerHoursAPI', file: 'test-volunteerhours-api.js', description: 'Volunteer hours tracking' }
];

// Test results tracking
const results = [];
let totalTests = 0;
let totalPassed = 0;
let totalFailed = 0;

/**
 * Run a single test suite
 */
function runTestSuite(suite) {
  return new Promise((resolve) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 Running: ${suite.name}`);
    console.log(`   ${suite.description}`);
    console.log(`${'='.repeat(60)}`);

    const testFile = path.join(__dirname, suite.file);
    const child = spawn('node', [testFile], {
      cwd: __dirname,
      stdio: 'inherit'
    });

    const startTime = Date.now();

    child.on('close', (code) => {
      const duration = ((Date.now() - startTime) / 1000).toFixed(2);
      const success = code === 0;

      results.push({
        name: suite.name,
        success,
        duration,
        exitCode: code
      });

      if (success) {
        console.log(`\n✅ ${suite.name} completed successfully in ${duration}s`);
      } else {
        console.log(`\n❌ ${suite.name} failed (exit code: ${code}) in ${duration}s`);
      }

      resolve();
    });

    child.on('error', (error) => {
      console.error(`\n❌ Error running ${suite.name}:`, error);
      results.push({
        name: suite.name,
        success: false,
        duration: 0,
        error: error.message
      });
      resolve();
    });
  });
}

/**
 * Run all test suites sequentially
 */
async function runAllTests() {
  console.log('\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║     VOLUNTEER MANAGEMENT API - COMPREHENSIVE TEST SUITE   ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');
  console.log(`📋 Total Test Suites: ${testSuites.length}`);
  console.log(`📅 Date: ${new Date().toLocaleString()}`);
  console.log('\n');

  const startTime = Date.now();

  // Run each test suite
  for (const suite of testSuites) {
    await runTestSuite(suite);
  }

  const totalDuration = ((Date.now() - startTime) / 1000).toFixed(2);

  // Generate summary report
  generateReport(totalDuration);
}

/**
 * Generate comprehensive test report
 */
function generateReport(totalDuration) {
  console.log('\n\n');
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║                                                           ║');
  console.log('║                    FINAL TEST REPORT                      ║');
  console.log('║                                                           ║');
  console.log('╚═══════════════════════════════════════════════════════════╝');
  console.log('\n');

  // Calculate totals
  const passedSuites = results.filter(r => r.success).length;
  const failedSuites = results.filter(r => !r.success).length;

  // Suite results table
  console.log('📊 TEST SUITE RESULTS:');
  console.log('─'.repeat(60));
  results.forEach(result => {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const duration = result.duration ? `${result.duration}s` : 'N/A';
    console.log(`${status} │ ${result.name.padEnd(25)} │ ${duration.padStart(8)}`);
  });
  console.log('─'.repeat(60));

  // Summary statistics
  console.log('\n📈 SUMMARY:');
  console.log(`   Total Suites:        ${testSuites.length}`);
  console.log(`   ✅ Passed:          ${passedSuites}`);
  console.log(`   ❌ Failed:          ${failedSuites}`);
  console.log(`   ⏱️  Total Duration:   ${totalDuration}s`);
  console.log(`   📊 Success Rate:     ${((passedSuites / testSuites.length) * 100).toFixed(1)}%`);

  // Failed suites details
  if (failedSuites > 0) {
    console.log('\n❌ FAILED TEST SUITES:');
    results.filter(r => !r.success).forEach(result => {
      console.log(`   - ${result.name}`);
      if (result.error) {
        console.log(`     Error: ${result.error}`);
      }
    });
  }

  // Test coverage breakdown
  console.log('\n📋 TEST COVERAGE:');
  console.log('   ✅ Authentication validation');
  console.log('   ✅ Volunteer CRUD operations');
  console.log('   ✅ Event CRUD operations');
  console.log('   ✅ Registration duplicate prevention');
  console.log('   ✅ Volunteer hours tracking');
  console.log('   ✅ Missing field validation');
  console.log('   ✅ Invalid format validation');
  console.log('   ✅ Non-existent ID validation');
  console.log('   ✅ Duplicate email/registration prevention');
  console.log('   ✅ Date/time format validation');
  console.log('   ✅ Numeric field validation');
  console.log('   ✅ URL format validation');
  console.log('   ✅ Authorization checks');

  // Recommendations
  console.log('\n💡 RECOMMENDATIONS:');
  if (failedSuites === 0) {
    console.log('   ✨ All tests passed! API is ready for production.');
    console.log('   ✨ Consider adding load testing for high-traffic scenarios.');
    console.log('   ✨ Set up CI/CD to run these tests automatically on deploy.');
  } else {
    console.log('   ⚠️  Fix failing tests before deploying to production.');
    console.log('   ⚠️  Review error messages in failed test suites above.');
    console.log('   ⚠️  Run individual test suites for detailed error information.');
  }

  console.log('\n');
  console.log('═'.repeat(60));
  console.log('\n');

  // Exit with appropriate code
  process.exit(failedSuites > 0 ? 1 : 0);
}

/**
 * Handle errors
 */
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled error:', error);
  process.exit(1);
});

// Run all tests
runAllTests().catch(error => {
  console.error('❌ Test runner error:', error);
  process.exit(1);
});
