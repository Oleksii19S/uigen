import { test, expect } from '@playwright/test';

test.describe('UIGen App', () => {

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  // ─── Layout ────────────────────────────────────────────────────────────────

  test('loads with correct layout', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'React Component Generator' })).toBeVisible();
    await expect(page.getByRole('textbox')).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Preview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Code' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Sign Up' })).toBeVisible();
  });

  // ─── Chat input ────────────────────────────────────────────────────────────

  test('send button is disabled when input is empty', async ({ page }) => {
    const input = page.getByRole('textbox');
    await expect(input).toBeEmpty();
    // The send button has no label — find it by its disabled state
    const form = page.locator('form');
    const sendBtn = form.locator('button[type="submit"], button:not([type])').last();
    await expect(sendBtn).toBeDisabled();
  });

  test('send button enables after typing', async ({ page }) => {
    const input = page.getByRole('textbox');
    await input.fill('create a counter');
    // Button should now be enabled
    const form = page.locator('form');
    const sendBtn = form.locator('button').last();
    await expect(sendBtn).toBeEnabled();
  });

  test('input clears after submission', async ({ page }) => {
    const input = page.getByRole('textbox');
    await input.fill('create a counter');
    await input.press('Enter');
    await expect(input).toBeEmpty();
  });

  // ─── Component generation ──────────────────────────────────────────────────

  test('generates a counter component and renders preview', async ({ page }) => {
    await page.getByRole('textbox').fill('create a counter');
    await page.getByRole('textbox').press('Enter');

    // AI response appears in chat
    await expect(page.getByText("Perfect! I've created:")).toBeVisible({ timeout: 40_000 });

    // Preview iframe renders the counter
    const iframe = page.locator('iframe[title="Preview"]');
    await expect(iframe).toBeVisible();
    const counter = iframe.contentFrame().getByText('Count');
    await expect(counter).toBeVisible();
  });

  test('generates a card component and renders preview', async ({ page }) => {
    await page.getByRole('textbox').fill('create a card');
    await page.getByRole('textbox').press('Enter');

    await expect(page.getByText("Perfect! I've created:")).toBeVisible({ timeout: 40_000 });

    const iframe = page.locator('iframe[title="Preview"]');
    const card = iframe.contentFrame().getByRole('heading', { name: 'Aurora Pro' });
    await expect(card).toBeVisible();
  });

  test('generates a form component and renders preview', async ({ page }) => {
    await page.getByRole('textbox').fill('create a form');
    await page.getByRole('textbox').press('Enter');

    await expect(page.getByText("Perfect! I've created:")).toBeVisible({ timeout: 40_000 });

    const iframe = page.locator('iframe[title="Preview"]');
    const heading = iframe.contentFrame().getByRole('heading', { name: 'Get in touch' });
    await expect(heading).toBeVisible();
  });

  // ─── Preview interactions ──────────────────────────────────────────────────

  test('counter buttons increment and decrement the count', async ({ page }) => {
    await page.getByRole('textbox').fill('create a counter');
    await page.getByRole('textbox').press('Enter');
    await expect(page.getByText("Perfect! I've created:")).toBeVisible({ timeout: 40_000 });

    const frame = page.locator('iframe[title="Preview"]').contentFrame();
    const count = frame.locator('[class*="text-7xl"]');

    await expect(count).toHaveText('0');
    await frame.getByRole('button', { name: '+' }).click();
    await frame.getByRole('button', { name: '+' }).click();
    await frame.getByRole('button', { name: '+' }).click();
    await expect(count).toHaveText('3');

    await frame.getByRole('button', { name: '−' }).click();
    await expect(count).toHaveText('2');

    await frame.getByRole('button', { name: 'Reset' }).click();
    await expect(count).toHaveText('0');
  });

  test('card like and save buttons toggle state', async ({ page }) => {
    await page.getByRole('textbox').fill('create a card');
    await page.getByRole('textbox').press('Enter');
    await expect(page.getByText("Perfect! I've created:")).toBeVisible({ timeout: 40_000 });

    const frame = page.locator('iframe[title="Preview"]').contentFrame();

    const likeBtn = frame.getByRole('button', { name: /like/i });
    const saveBtn = frame.getByRole('button', { name: /save/i });

    await expect(likeBtn).toContainText('♡ Like');
    await likeBtn.click();
    await expect(likeBtn).toContainText('♥ Liked');

    await expect(saveBtn).toContainText('+ Save');
    await saveBtn.click();
    await expect(saveBtn).toContainText('✓ Saved');
  });

  // ─── Code tab ─────────────────────────────────────────────────────────────

  test('code tab shows generated files in file tree', async ({ page }) => {
    await page.getByRole('textbox').fill('create a counter');
    await page.getByRole('textbox').press('Enter');
    await expect(page.getByText("Perfect! I've created:")).toBeVisible({ timeout: 40_000 });

    await page.getByRole('tab', { name: 'Code' }).click();

    // Scope to the file tree panel to avoid matching chat message text
    const fileTree = page.locator('[data-slot="resizable-panel"]').filter({ hasText: 'App.jsx' }).first();
    await expect(fileTree.getByText('App.jsx', { exact: true })).toBeVisible();
    await expect(fileTree.getByText('Counter.jsx', { exact: true })).toBeVisible();
  });

  test('clicking a file in the tree loads it in the editor', async ({ page }) => {
    await page.getByRole('textbox').fill('create a counter');
    await page.getByRole('textbox').press('Enter');
    await expect(page.getByText("Perfect! I've created:")).toBeVisible({ timeout: 40_000 });

    await page.getByRole('tab', { name: 'Code' }).click();

    // Click the file tree entry (has class truncate, not the chat badge)
    const fileTree = page.locator('[data-slot="resizable-panel"]').filter({ hasText: 'Counter.jsx' }).first();
    await fileTree.getByText('Counter.jsx', { exact: true }).click();

    // Monaco editor should contain the component source
    await expect(page.locator('.monaco-editor')).toBeVisible();
    await expect(page.locator('.view-lines')).toContainText('Counter');
  });

});
