# GitHub Actions Setup for Salesforce Deployment

This repository uses GitHub Actions to automatically deploy Salesforce DX source to your Salesforce org.

## Prerequisites

1. Salesforce CLI installed locally
2. Access to your Salesforce org
3. GitHub repository with Actions enabled

## Setup Instructions

### Step 1: Generate SFDX Auth URL

Run this command locally to generate the SFDX Auth URL:

```bash
# Navigate to the volunteer-registration directory
cd volunteer-registration

# Display the SFDX Auth URL for your authenticated org
sf org display --verbose --json
```

Or use this command to get just the auth URL:

```bash
sf org display --verbose | grep "Sfdx Auth Url"
```

**Alternative method using force:org:display:**
```bash
sf force org display --targetusername YOUR_USERNAME --verbose
```

The SFDX Auth URL format looks like:
```
force://PlatformCLI::REFRESH_TOKEN@INSTANCE_URL
```

### Step 2: Add GitHub Secret

1. Go to your GitHub repository
2. Navigate to **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**
4. Name: `SFDX_AUTH_URL`
5. Value: Paste the SFDX Auth URL from Step 1
6. Click **Add secret**

### Step 3: Configure Multiple Environments (Optional)

For multiple orgs (dev, staging, production), create separate secrets:

- `SFDX_AUTH_URL_DEV` - Developer Edition/Sandbox
- `SFDX_AUTH_URL_STAGING` - Staging Sandbox
- `SFDX_AUTH_URL_PROD` - Production org

Update the workflow file to use environment-specific secrets:

```yaml
- name: Authenticate to Salesforce
  run: |
    if [ "${{ github.event.inputs.target_org }}" == "production" ]; then
      echo "${{ secrets.SFDX_AUTH_URL_PROD }}" > ./SFDX_AUTH_URL.txt
    elif [ "${{ github.event.inputs.target_org }}" == "staging" ]; then
      echo "${{ secrets.SFDX_AUTH_URL_STAGING }}" > ./SFDX_AUTH_URL.txt
    else
      echo "${{ secrets.SFDX_AUTH_URL_DEV }}" > ./SFDX_AUTH_URL.txt
    fi
    sf org login sfdx-url --sfdx-url-file ./SFDX_AUTH_URL.txt --alias target-org --set-default
```

## Workflows

### 1. Salesforce Deploy (`salesforce-deploy.yml`)

**Triggers:**
- Push to `main`, `master`, or `dev` branches
- Manual trigger via "Actions" tab (workflow_dispatch)

**What it does:**
- Installs Salesforce CLI
- Authenticates to Salesforce
- Runs Apex tests
- Deploys all source code from `force-app/default`
- Assigns permission sets (if configured)

**Manual Deployment:**
1. Go to **Actions** tab in GitHub
2. Select "Salesforce DX Deployment"
3. Click "Run workflow"
4. Choose target org (dev/staging/production)
5. Click "Run workflow"

### 2. PR Validation (`salesforce-pr-validation.yml`)

**Triggers:**
- Pull requests to `main`, `master`, or `dev` branches

**What it does:**
- Validates deployment without actually deploying (dry-run)
- Runs all Apex tests
- Reports results in the PR

## Deployment Strategy

### Development
```bash
git checkout dev
git add volunteer-registration/force-app/
git commit -m "feat: add new Apex class"
git push origin dev
```
→ Auto-deploys to Developer Edition

### Production
```bash
git checkout main
git merge dev
git push origin main
```
→ Auto-deploys to Production org

## Troubleshooting

### Issue: "sf: command not found"
**Solution:** The workflow automatically installs SF CLI. Check the installation step logs.

### Issue: "ERROR running force:org:display: No authorization information found"
**Solution:** 
1. Re-authenticate locally: `sf org login web --alias myorg`
2. Get new SFDX Auth URL: `sf org display --verbose`
3. Update GitHub secret

### Issue: "INVALID_OPERATION_WITH_EXPIRED_PASSWORD"
**Solution:** Log in to Salesforce and reset the integration user's password.

### Issue: Deployment fails with "Component Failures"
**Solution:** 
1. Check the workflow logs for specific errors
2. Test deployment locally first:
   ```bash
   cd volunteer-registration
   sf project deploy start --source-dir force-app/default --dry-run
   ```

## Current Deployment Status

| Org Type | Auth Status | Last Deploy | Status |
|----------|-------------|-------------|--------|
| Dev Edition | ❓ Not configured | - | - |
| Staging | ❓ Not configured | - | - |
| Production | ❓ Not configured | - | - |

## Next Steps

1. ✅ Generate SFDX Auth URL
2. ✅ Add GitHub secret
3. ✅ Push code to trigger deployment
4. ✅ Verify deployment in Salesforce
5. ✅ Configure public API endpoint
6. ✅ Test API authentication

## Resources

- [Salesforce DX with GitHub Actions](https://developer.salesforce.com/blogs/2020/01/using-salesforce-dx-with-github-actions)
- [SF CLI Command Reference](https://developer.salesforce.com/docs/atlas.en-us.sfdx_cli_reference.meta/sfdx_cli_reference/cli_reference.htm)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
