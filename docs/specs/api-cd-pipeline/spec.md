# API CD Pipeline Specification

## Purpose

Automate deployment of the NestJS API to an AWS EC2 instance via GitHub Actions. The pipeline validates quality gates on every push to `main`, then deploys via SSH and verifies the health endpoint.

## Requirements

### Requirement: CD workflow trigger

The API SHALL have a GitHub Actions workflow at `.github/workflows/cd.yml` that triggers on push to the `main` branch.

#### Scenario: Push to main triggers workflow

- GIVEN a developer merges a PR or pushes directly to `main`
- WHEN the push event occurs
- THEN the CD workflow starts
- AND the workflow runs on `ubuntu-latest`

#### Scenario: Push to non-main branch does not trigger

- GIVEN a developer pushes to a feature branch
- WHEN the push event occurs
- THEN the CD workflow does NOT start

### Requirement: Quality gates

The CD workflow SHALL run quality gates (lint, typecheck, test, build) before deploying. These gates MUST pass before any deployment step executes.

#### Scenario: All quality gates pass

- GIVEN the CD workflow starts
- WHEN lint, typecheck, test, and build steps complete successfully
- THEN the deploy step executes

#### Scenario: Lint failure blocks deployment

- GIVEN the CD workflow starts
- WHEN the lint step fails (exit code non-zero)
- THEN subsequent steps (typecheck, test, build, deploy) do NOT execute
- AND the workflow reports failure

#### Scenario: Test failure blocks deployment

- GIVEN the CD workflow starts
- WHEN the test step fails
- THEN the build and deploy steps do NOT execute
- AND the workflow reports failure

#### Scenario: Quality gates skip E2E tests

- GIVEN the CD workflow runs quality gates
- WHEN the test step executes
- THEN only unit and integration tests run
- AND E2E tests (testcontainers) are skipped to avoid Docker-in-Docker complexity

### Requirement: SSH-based deployment to EC2

The CD workflow SHALL deploy to EC2 via SSH using GitHub Secrets `EC2_HOST` and `EC2_SSH_KEY`.

#### Scenario: Successful deployment

- GIVEN all quality gates pass
- WHEN the deploy step executes
- THEN the workflow SSHs into the EC2 host using the SSH key
- AND runs `git pull` on the repository
- AND runs `docker compose -f docker-compose.prod.yml down`
- AND runs `docker compose -f docker-compose.prod.yml up -d --build`

#### Scenario: SSH connection fails

- GIVEN all quality gates pass
- WHEN the SSH connection to EC2 fails (wrong host, key, or network)
- THEN the deploy step fails
- AND the workflow reports failure
- AND the previous API version remains running on EC2

#### Scenario: Missing secrets fail deployment

- GIVEN the workflow starts
- WHEN `EC2_HOST` or `EC2_SSH_KEY` GitHub Secrets are not configured
- THEN the deploy step fails with a clear error
- AND the workflow reports failure

### Requirement: Post-deploy health check verification

The CD workflow SHALL verify the API is healthy after deployment by calling the health endpoint.

#### Scenario: Health check passes after deploy

- GIVEN the deploy step completes
- WHEN the workflow sends `GET http://localhost:3001/health` to the EC2 instance
- THEN the response status is 200
- AND the response body contains `{ "status": "ok" }`
- AND the workflow reports success

#### Scenario: Health check fails after deploy

- GIVEN the deploy step completes
- WHEN the health check returns a non-200 status or times out
- THEN the workflow reports failure
- AND the deployment is flagged for manual investigation

#### Scenario: Health check retries on transient failure

- GIVEN the deploy step completes and the container is still starting
- WHEN the first health check attempt fails
- THEN the workflow retries the health check up to 3 times with a 10-second interval
- AND the workflow reports success if any retry returns 200

### Requirement: GitHub Secrets configuration

The CD workflow SHALL require two GitHub Secrets: `EC2_HOST` (EC2 public IP or hostname) and `EC2_SSH_KEY` (private SSH key for the EC2 instance).

#### Scenario: Secrets are referenced in workflow

- GIVEN the CD workflow is defined
- WHEN the deploy step runs
- THEN it accesses `${{ secrets.EC2_HOST }}` and `${{ secrets.EC2_SSH_KEY }}`
- AND neither secret value is logged or printed in workflow output

#### Scenario: SSH key is not logged

- GIVEN the CD workflow runs
- WHEN the SSH key secret is used
- THEN it MUST NOT appear in any workflow log or debug output
- AND GitHub Actions masks the secret value automatically
