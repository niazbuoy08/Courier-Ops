/**
 * Runs once before the test files are imported. Provides the environment
 * variables that pure modules read at load time, so importing them in a test
 * doesn't throw. No real services are contacted — the MongoDB URI is never
 * connected to in unit tests.
 */
process.env.MONGODB_URI ??= "mongodb://127.0.0.1:27017/courier_ops_test";
process.env.AUTH_SECRET ??= "test-secret-not-used-in-production-0000000000000";
