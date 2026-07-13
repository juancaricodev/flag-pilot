# API Health Endpoint Specification

## Purpose

Provide an unauthenticated liveness/readiness endpoint (`GET /health`) for Docker healthchecks, nginx probes, and load balancer checks. The endpoint MUST be accessible without JWT authentication since infrastructure probes cannot carry tokens.

## Requirements

### Requirement: GET /health endpoint

The API SHALL expose a `GET /health` endpoint on the `AppController` that returns a JSON object with `status: 'ok'` and HTTP status 200. The endpoint MUST NOT require authentication.

#### Scenario: Health check returns ok

- GIVEN the API is running
- WHEN a client sends `GET /health` without any authentication
- THEN the response status is 200
- AND the response body is `{ "status": "ok" }`

#### Scenario: Health check ignores Bearer token

- GIVEN the API is running
- WHEN a client sends `GET /health` with an `Authorization: Bearer <token>` header
- THEN the response status is 200
- AND the response body is `{ "status": "ok" }`

#### Scenario: Health check ignores expired token

- GIVEN the API is running
- WHEN a client sends `GET /health` with an expired JWT in the Authorization header
- THEN the response status is 200
- AND the response body is `{ "status": "ok" }`

### Requirement: AppService.getHealth()

`AppService` SHALL provide a `getHealth()` method that returns the string `'ok'`. This method MUST be unit-testable independently of the controller.

#### Scenario: getHealth returns ok

- GIVEN an AppService instance
- WHEN `getHealth()` is called
- THEN it returns the string `'ok'`

### Requirement: AppController health unit test

The `AppController` spec file SHALL include a test case for the health endpoint that verifies the controller delegates to `AppService.getHealth()` and returns the expected result.

#### Scenario: Controller delegates to service

- GIVEN the AppController is instantiated with a mocked AppService
- WHEN `getHealth()` is called on the controller
- THEN it returns the result from `appService.getHealth()`
- AND the test passes without real HTTP calls
