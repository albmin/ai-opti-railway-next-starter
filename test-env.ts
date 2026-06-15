// Default environment for the test run. Real values are not needed: the postgres
// client is lazy (it never connects with these), and any test that touches the DB
// or auth mocks its dependencies. Loaded first via bunfig `preload`.
process.env["DATABASE_URL"] ??= "postgresql://test:test@localhost:5432/test";
process.env["BETTER_AUTH_SECRET"] ??= "test-secret-please-change";
process.env["BETTER_AUTH_URL"] ??= "http://localhost:3000";
