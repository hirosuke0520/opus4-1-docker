import { test, expect } from '@playwright/test';

test.describe('CRM End-to-End Flow', () => {
  test('complete CRM workflow', async ({ page }) => {
    // 1. Login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@minicrm.local');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to dashboard
    await page.waitForURL('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard');
    
    // 2. Create a new lead
    await page.click('text=Leads');
    await page.waitForURL('/leads');
    await page.click('text=Add Lead');
    
    // Wait for new lead form
    await page.waitForURL('/leads/new');
    await expect(page.locator('h1')).toContainText('New Lead');
    
    // Fill lead form - wait for companies to load first
    const companySelect = page.locator('select[name="companyId"]');
    // Wait for select to have options (companies loaded)
    await expect(companySelect.locator('option')).toHaveCount(6, { timeout: 5000 }); // 1 placeholder + 5 companies
    
    // Select first real company (skip "Select a company" option)
    const firstCompanyValue = await companySelect.locator('option:nth-child(2)').getAttribute('value');
    if (firstCompanyValue) {
      await companySelect.selectOption(firstCompanyValue);
    }
    
    await page.fill('input[name="contactName"]', 'Test Lead E2E');
    await page.fill('input[name="email"]', 'test.e2e@example.com');
    await page.fill('input[name="phone"]', '+1-555-0123');
    await page.selectOption('select[name="source"]', 'WEB');
    await page.selectOption('select[name="status"]', 'NEW');
    await page.fill('input[name="score"]', '75');
    
    // Submit the form
    await page.click('button:has-text("Create Lead")');
    
    // Should redirect to lead detail page
    await page.waitForURL(/\/leads\/[a-f0-9-]+/);
    await expect(page.locator('h2')).toContainText('Test Lead E2E');
    
    // 3. Create a deal
    await page.click('text=Deals');
    await page.waitForURL('/deals');
    await expect(page.locator('h1')).toContainText('Deals Pipeline');
    
    await page.click('text=Add Deal');
    await page.waitForURL('/deals/new');
    
    // Wait for leads to load (at least 2 options: placeholder + 1 lead)
    const leadSelect = page.locator('select[name="leadId"]');
    await page.waitForTimeout(1000); // Give time for data to load
    const leadOptionCount = await leadSelect.locator('option').count();
    expect(leadOptionCount).toBeGreaterThan(1);
    
    // Find and select the lead we just created
    const leadOptions = await leadSelect.locator('option').all();
    for (const option of leadOptions) {
      const text = await option.textContent();
      if (text?.includes('Test Lead E2E')) {
        const value = await option.getAttribute('value');
        if (value) {
          await leadSelect.selectOption(value);
          break;
        }
      }
    }
    
    await page.fill('input[name="title"]', 'Test Deal E2E');
    await page.fill('input[name="amount"]', '50000');
    await page.selectOption('select[name="stage"]', 'PROSPECTING');
    
    // Submit the form
    await page.click('button:has-text("Create Deal")');
    
    // Should redirect to deals page
    await page.waitForURL('/deals');
    
    // 4. Change deal stage using dropdown
    // Wait for the deal card to appear
    await page.waitForTimeout(2000); // Give time for deal to load
    await expect(page.locator('.bg-white').filter({ hasText: 'Test Deal E2E' }).first()).toBeVisible();
    
    const dealCard = page.locator('.bg-white').filter({ hasText: 'Test Deal E2E' }).first();
    const selectElement = dealCard.locator('select');
    
    // Change stage
    await selectElement.selectOption('PROPOSAL');
    
    // Wait for update and verify
    await page.waitForTimeout(1000);
    await expect(selectElement).toHaveValue('PROPOSAL');
    
    // 5. Add and complete an activity
    // Navigate back to our test lead
    await page.click('text=Leads');
    await page.waitForURL('/leads');
    
    // Search for our test lead
    await page.fill('input[name="search"]', 'Test Lead E2E');
    await page.click('button:has-text("Search")');
    await page.waitForTimeout(500);
    
    // Click on the test lead
    const leadRow = page.locator('table tbody tr').filter({ hasText: 'Test Lead E2E' }).first();
    await leadRow.locator('text=View').click();
    
    // Wait for lead detail page
    await page.waitForURL(/\/leads\/[a-f0-9-]+/);
    
    // Activities should be the default tab
    await expect(page.locator('button:has-text("Activities")')).toBeVisible();
    
    // Add new activity
    await page.click('button:has-text("Add Activity")');
    await page.waitForTimeout(500);
    
    // Fill activity form
    await page.selectOption('select[name="type"]', 'TASK');
    await page.fill('textarea[name="content"]', 'E2E Test Activity');
    
    // Set a due date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dateString = tomorrow.toISOString().slice(0, 16);
    await page.fill('input[name="dueDate"]', dateString);
    
    await page.click('button:has-text("Save")');
    
    // Wait for activity to be created
    await page.waitForTimeout(1000);
    
    // Complete the activity
    const activityCard = page.locator('.bg-white').filter({ hasText: 'E2E Test Activity' }).first();
    await activityCard.locator('button:has-text("Complete")').click();
    await page.waitForTimeout(500);
    
    // Verify activity is marked as completed
    await expect(activityCard).toContainText('Completed');
    
    // Verify we completed the workflow by checking we're still on a valid page
    await expect(page.locator('h2')).toBeVisible();
  });
});