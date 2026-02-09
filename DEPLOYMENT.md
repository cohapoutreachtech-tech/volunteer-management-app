# Deployment Guide - CI/CD with GitHub Actions

This guide explains how to set up automated deployment of Salesforce Apex classes, custom objects, and site configuration using GitHub Actions.

## Overview

**Architecture:**
- **Source Control**: GitHub repository
- **CI/CD**: GitHub Actions workflows
- **Target**: Salesforce Developer Edition org
- **Authentication**: SFDX Auth URL (tokenless)
- **Deployment**: Salesforce CLI

**Benefits:**
- ✅ Automated deployment on push to dev/main branches
- ✅ Pull request validation before merge
- ✅ Apex test execution on every deployment
- ✅ No manual deployment steps required
- ✅ Consistent deployment process across team

---

## Prerequisites

1. **Salesforce Org**: Developer Edition with deployed metadata
2. **GitHub Repository**: Code pushed to GitHub
3. **Salesforce CLI**: Installed locally for initial setup
4. **Admin Access**: To Salesforce org and GitHub repository settings

---

## Setup Instructions

### Step 1: Generate SFDX Auth URL

The SFDX Auth URL allows GitHub Actions to authenticate to your Salesforce org without storing username/password.

**On your local machine:**

```bash
# Authenticate to your Salesforce org (if not already)
sf org login web --alias dev-org --set-default

# Get the SFDX Auth URL
sf org display --target-org dev-org --verbose
```

**Look for this line in the output:**
```
Sfdx Auth Url    sfdx://PlatformCLI::5Aep861...@orgfarm-abc123-dev-ed.develop.my.salesforce.com
```

**Copy the entire SFDX Auth URL** starting with `sfdx://` through the end of the domain.

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Add the following secrets:

#### SFDX_AUTH_URL
```
Name: SFDX_AUTH_URL
Value: sfdx://PlatformCLI::5Aep861...@orgfarm-abc123-dev-ed.develop.my.salesforce.com
```

#### SF_USERNAME
```
Name: SF_USERNAME
Value: your-admin@example.com
```
*This is the Salesforce admin username that will be set as the site admin in the site configuration.*

5. Click **Add secret** for each

**Security Note:** The SFDX Auth URL provides full admin access to your org. Keep it secure and never commit it to the repository.

### Step 3: Verify Workflows Exist

Check that these workflow files exist in your repository:

```
.github/workflows/
├── salesforce-deploy.yml          # Automatic deployment
└── salesforce-pr-validation.yml   # PR validation
```

These files are already included in this repository.

### Step 4: Enable GitHub Actions

1. Go to your GitHub repository
2. Click **Actions** tab
3. If prompted, click **I understand my workflows, go ahead and enable them**

---

## How It Works

### Automatic Deployment Workflow

**File**: `.github/workflows/salesforce-deploy.yml`

**Triggers:**
- Push to `dev` or `main` branches
- Changes in `volunteer-registration/force-app/**`
- Manual trigger via GitHub Actions UI

**Steps:**
1. ✅ Checkout code from repository
2. ✅ Install Salesforce CLI
3. ✅ Authenticate using SFDX Auth URL
4. ✅ Get org information (instance URL, username)
5. ✅ Replace [ADMIN] tags with SF_USERNAME in site configuration
6. ✅ Deploy custom objects (NoTestRun)
7. ✅ Deploy Apex classes (RunLocalTests)
8. ✅ Deploy Salesforce Site configuration
9. ✅ Setup site permissions
10. ✅ Deploy UI components (layouts, tabs, apps)
11. ✅ Run Apex tests
12. ✅ Verify site configuration
13. ✅ Seed database with initial data
14. ✅ Setup test environment (.env file)
15. ✅ Install test dependencies
16. ✅ Run comprehensive API test suite
17. ✅ Display deployment summary

**Deployment Order:**
1. **Custom Objects** → (fields, objects, relationships)
2. **Apex Classes** → (API classes, utilities, tests)
3. **Site Configuration** → (Volunteer_API site with admin user)
4. **Site Permissions** → (Enable Apex classes for guest user)
5. **UI Components** → (layouts, tabs, applications)
6. **Database Seeding** → (Create test volunteers, events, registrations)
7. **API Testing** → (Run 86 comprehensive tests)

### Pull Request Validation Workflow

**File**: `.github/workflows/salesforce-pr-validation.yml`

**Triggers:**
- Pull requests to `main`, `master`, or `dev` branches
- Changes in `volunteer-registration/force-app/**`

**Steps:**
1. ✅ Checkout code
2. ✅ Install Salesforce CLI
3. ✅ Authenticate to Salesforce
4. ✅ Validate deployment (dry run - no actual deployment)
5. ✅ Run Apex tests
6. ✅ Report validation results

**Important:** This workflow does NOT deploy anything. It only validates that the changes can be deployed successfully.

---

## Usage

### Deploying Changes

**Automatic deployment on push:**

```bash
# Make changes to Apex classes or metadata
git add volunteer-registration/force-app/
git commit -m "Add new validation to VolunteerAPI"
git push origin dev

# GitHub Actions automatically deploys to Salesforce
```

**View deployment progress:**
1. Go to GitHub repository → **Actions** tab
2. Click on the running workflow
3. Watch real-time deployment progress

### Validating Pull Requests

**Create a pull request:**

```bash
# Create feature branch
git checkout -b feature/new-validation
git add volunteer-registration/force-app/
git commit -m "Add duplicate email validation"
git push origin feature/new-validation

# Create PR on GitHub
# GitHub Actions automatically validates the changes
```

**Check validation results:**
1. Go to your pull request on GitHub
2. Scroll to **Checks** section at the bottom
3. See validation status (✅ or ❌)
4. Click **Details** to view full validation log

### Manual Deployment

You can also trigger deployment manually:

1. Go to GitHub → **Actions** tab
2. Select **Deploy to Salesforce** workflow
3. Click **Run workflow**
4. Choose branch and target org
5. Click **Run workflow**

---

## Monitoring Deployments

### View Deployment Logs

1. Go to GitHub → **Actions** tab
2. Click on any workflow run
3. Expand each step to see detailed logs
4. Look for:
   - ✅ Green checkmarks = success
   - ❌ Red X = failure
   - ⚠️ Yellow = warnings

### Check Deployed Metadata

**After deployment, verify in Salesforce:**

```bash
# Open Salesforce Setup
sf org open --path /lightning/setup/home

# Check Apex classes
sf org open --path /lightning/setup/ApexClasses/home

# Check custom objects
sf org open --path /lightning/setup/ObjectManager/home

# Check Sites
sf org open --path /lightning/setup/SetupNetworks/home
```

### Review Test Results

Test results are included in deployment logs:

```
=== Test Results
Pass: 15
Fail: 0
Total: 15
Code Coverage: 87%
```

---

## Troubleshooting

### Deployment Fails: "Invalid SFDX Auth URL"

**Cause:** SFDX_AUTH_URL secret is incorrect or expired.

**Fix:**
1. Generate new auth URL: `sf org display --target-org dev-org --verbose`
2. Update GitHub secret: Settings → Secrets → SFDX_AUTH_URL
3. Re-run workflow

### Deployment Fails: "Component failures"

**Cause:** Metadata has errors or conflicts with existing org metadata.

**Fix:**
1. Review deployment log for specific error
2. Test deployment locally:
   ```bash
   sf project deploy start --source-dir force-app/default --dry-run
   ```
3. Fix errors and commit changes
4. Push again to trigger new deployment

### Tests Fail During Deployment

**Cause:** Apex tests are failing.

**Fix:**
1. Review test failure details in deployment log
2. Run tests locally:
   ```bash
   sf apex run test --test-level RunLocalTests --result-format human
   ```
3. Fix failing tests
4. Commit and push

### Site Not Deployed

**Cause:** Site deployment may fail if site doesn't exist yet.

**Fix:**
1. Deployment continues with `continue-on-error: true`
2. Manually verify site exists: Setup → Sites
3. If needed, create site manually (see SALESFORCE_SITES_SETUP.md)
4. Re-run deployment

### Permission Errors

**Cause:** SFDX Auth URL doesn't have sufficient permissions.

**Fix:**
1. Ensure you authenticated as System Administrator
2. Check user permissions in Salesforce
3. Re-generate auth URL from admin user
4. Update GitHub secret

---

## Best Practices

### Branch Strategy

**Recommended workflow:**

```
main (production) ← merge from dev
  ↑
dev (staging) ← merge from feature branches
  ↑
feature/new-feature ← development work
```

**Deployment flow:**
1. Create feature branch from `dev`
2. Make changes and commit
3. Create pull request to `dev`
4. CI validates changes (no deployment)
5. Merge to `dev` → auto-deploy to staging org
6. Test in staging
7. Merge `dev` to `main` → auto-deploy to production

### Commit Messages

Use clear, descriptive commit messages:

```bash
# Good
git commit -m "Add duplicate email validation to VolunteerAPI"
git commit -m "Fix date format validation in EventAPI"
git commit -m "Update site configuration for guest user permissions"

# Bad
git commit -m "fix"
git commit -m "updates"
git commit -m "WIP"
```

### Testing Before Push

**Always test locally before pushing:**

```bash
# Validate deployment
cd volunteer-registration
sf project deploy start --source-dir force-app/default --dry-run --test-level RunLocalTests

# Run tests
sf apex run test --test-level RunLocalTests

# If both succeed, push to GitHub
git push origin feature/your-branch
```

### Handling Deployment Failures

**If deployment fails:**

1. **Don't panic** - The workflow prevents bad code from being deployed
2. **Review the logs** - GitHub Actions provides detailed error messages
3. **Fix locally** - Test the fix with `sf project deploy start --dry-run`
4. **Commit and push** - Trigger a new deployment
5. **Verify success** - Check that deployment completed successfully

---

## Advanced Configuration

### Multiple Environments

To deploy to multiple orgs (dev, staging, production):

**Add more secrets:**
```
SFDX_AUTH_URL_DEV
SFDX_AUTH_URL_STAGING
SFDX_AUTH_URL_PROD
```

**Update workflow to use environment-specific secrets:**
```yaml
- name: Authenticate to Salesforce
  run: |
    echo "${{ secrets[format('SFDX_AUTH_URL_{0}', github.event.inputs.target_org)] }}" > ./SFDX_AUTH_URL.txt
    sf org login sfdx-url --sfdx-url-file ./SFDX_AUTH_URL.txt --alias target-org
```

### Custom Deployment Steps

**Add custom steps to `.github/workflows/salesforce-deploy.yml`:**

```yaml
- name: Seed Test Data
  run: |
    cd database
    npm install
    npm run seed
  working-directory: ./

- name: Send Slack Notification
  run: |
    curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
      -d '{"text":"Deployment to Salesforce completed!"}'
```

### Deployment Notifications

**Add Slack notifications on deployment success/failure:**

1. Create Slack webhook URL
2. Add as GitHub secret: `SLACK_WEBHOOK_URL`
3. Add step to workflow:

```yaml
- name: Notify Slack
  if: always()
  run: |
    STATUS="${{ job.status }}"
    curl -X POST ${{ secrets.SLACK_WEBHOOK_URL }} \
      -H 'Content-Type: application/json' \
      -d "{\"text\":\"Deployment $STATUS\"}"
```

---

## Security Considerations

### Protecting Secrets

- ✅ **Never** commit SFDX Auth URL to repository
- ✅ **Never** commit .env files with credentials
- ✅ **Always** use GitHub Secrets for sensitive data
- ✅ **Rotate** auth URLs periodically
- ✅ **Limit** who can access GitHub repository settings

### Repository Settings

**Branch protection rules (recommended):**

1. Go to Settings → Branches → Add rule
2. Branch name pattern: `main`
3. Enable:
   - ☑ Require pull request reviews before merging
   - ☑ Require status checks to pass (select "Validate Metadata")
   - ☑ Require branches to be up to date before merging

This ensures all changes to `main` are:
- Reviewed by team members
- Validated by CI/CD
- Tested before deployment

### Audit Trail

GitHub Actions provides complete audit trail:
- Who triggered deployment
- What changes were deployed
- When deployment occurred
- Success/failure status
- Full deployment logs

**View deployment history:**
1. Go to GitHub → Actions tab
2. See all workflow runs with timestamps
3. Click any run to see full details

---

## Migration from Manual Deployment

**If you currently deploy manually:**

1. **Commit all local changes** to Git
2. **Set up GitHub Actions** (follow this guide)
3. **Test with a small change**:
   ```bash
   # Make minor change
   git commit -m "Test automated deployment"
   git push origin dev
   # Watch deployment in GitHub Actions
   ```
4. **Verify in Salesforce** that change was deployed
5. **Switch to automated workflow** for all future deployments

**Benefits over manual deployment:**
- No more forgetting to deploy changes
- Team members can deploy without SF CLI setup
- Automatic testing on every deployment
- Rollback capability (revert commit and push)
- Deployment history and audit trail

---

## Support and Resources

### Documentation
- [Main README](README.md) - Project overview
- [Salesforce Sites Setup](SALESFORCE_SITES_SETUP.md) - Site configuration
- [Apex Validations](APEX_VALIDATIONS.md) - Validation reference
- [volunteer-registration README](volunteer-registration/README.md) - API reference

### Salesforce Resources
- [SFDX CLI Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/)
- [GitHub Actions for Salesforce](https://developer.salesforce.com/blogs/2020/01/using-salesforce-dx-with-github-actions)
- [Salesforce DX Developer Guide](https://developer.salesforce.com/docs/atlas.en-us.sfdx_dev.meta/sfdx_dev/)

### Troubleshooting
- Check GitHub Actions logs for detailed error messages
- Review Salesforce debug logs: `sf apex log tail`
- Test deployments locally before pushing
- Open GitHub issue if you encounter problems

---

## Next Steps

✅ **CI/CD is now configured!**

**Recommended workflow:**

1. **Make changes** to Apex classes or metadata
2. **Test locally** with `sf project deploy start --dry-run`
3. **Commit and push** to feature branch
4. **Create pull request** (triggers validation)
5. **Merge to dev** after approval (triggers deployment)
6. **Verify in Salesforce** that changes deployed correctly
7. **Merge dev to main** for production release

**Enjoy automated, reliable deployments! 🚀**
