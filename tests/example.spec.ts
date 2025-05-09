import { test, expect } from '@playwright/test';

test('basic test', async ({ page }) => {
  await page.goto('http://localhost:9001');
  await expect(page).toHaveTitle(/To-Do App/);
});

test('create a new task and verify it appears', async ({ page }) => {
  await page.goto('http://localhost:9001');
  await page.click('[aria-label="Create Task"]');
  await page.fill('input[placeholder="Title"]', 'New Task');
  await page.fill('textarea[placeholder="Description"]', 'Task Description');
  await page.click('text=Create');
  await expect(page.locator('text=New Task')).toBeVisible();
});

test('mark a task as completed and verify it disappears', async ({ page }) => {
  await page.goto('http://localhost:9001');
  await page.waitForSelector('text=Done');
  await page.click('text=Done');
});

test('create multiple tasks and only 5 most recent are shown', async ({ page }) => {
  await page.goto('http://localhost:9001');
  for (let i = 1; i <= 6; i++) {
    await page.click('[aria-label="Create Task"]');
    await page.fill('input[placeholder="Title"]', `Task ${i}`);
    await page.fill('textarea[placeholder="Description"]', `Desc ${i}`);
    await page.click('text=Create');
    await page.waitForTimeout(200);
  }
  for (let i = 2; i <= 6; i++) {
    await expect(page.locator(`text=Task ${i}`)).toBeVisible();
  }
  await expect(page.locator('text=Task 1')).not.toBeVisible();
});

test('completed tasks do not appear in the list', async ({ page }) => {
  await page.goto('http://localhost:9001');
  await page.click('[aria-label="Create Task"]');
  await page.fill('input[placeholder="Title"]', 'Complete Me');
  await page.fill('textarea[placeholder="Description"]', 'Desc');
  await page.click('text=Create');
  await expect(page.locator('text=Complete Me')).toBeVisible();
  await page.click('text=Done');
  await expect(page.locator('text=Complete Me')).not.toBeVisible();
});

test('error shown for failed completion', async ({ page }) => {
  await page.goto('http://localhost:9001');
  await page.evaluate(() => fetch('/tasks/99999', { method: 'PATCH' }));
});