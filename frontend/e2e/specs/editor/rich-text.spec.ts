import { test, expect } from '../../fixtures';
import { EditorPage } from '../../page-objects/editor.page';

test.describe('Rich Text Editor', () => {
  test('bold formatting works', async ({ mockAuthenticatedApiPage }) => {
    const editorPage = new EditorPage(mockAuthenticatedApiPage);

    await editorPage.goto();
    await editorPage.waitForEditor();

    // Type some text
    await editorPage.richTextEditor.type('Hello');

    // Select all and make bold
    await editorPage.page.keyboard.press('Control+a');
    await editorPage.richTextEditor.toggleBold();

    // Check if bold tag is in content
    const html = await editorPage.richTextEditor.getHTML();
    expect(html).toContain('<strong>');
  });

  test('italic formatting works', async ({ mockAuthenticatedApiPage }) => {
    const editorPage = new EditorPage(mockAuthenticatedApiPage);

    await editorPage.goto();
    await editorPage.waitForEditor();

    await editorPage.richTextEditor.type('World');
    await editorPage.page.keyboard.press('Control+a');
    await editorPage.richTextEditor.toggleItalic();

    const html = await editorPage.richTextEditor.getHTML();
    expect(html).toContain('<em>');
  });

  test('h1 heading works', async ({ mockAuthenticatedApiPage }) => {
    const editorPage = new EditorPage(mockAuthenticatedApiPage);

    await editorPage.goto();
    await editorPage.waitForEditor();

    await editorPage.richTextEditor.type('Title');
    await editorPage.richTextEditor.toggleH1();

    const html = await editorPage.richTextEditor.getHTML();
    expect(html).toContain('<h1>');
  });

  test('h2 heading works', async ({ mockAuthenticatedApiPage }) => {
    const editorPage = new EditorPage(mockAuthenticatedApiPage);

    await editorPage.goto();
    await editorPage.waitForEditor();

    await editorPage.richTextEditor.type('Subtitle');
    await editorPage.richTextEditor.toggleH2();

    const html = await editorPage.richTextEditor.getHTML();
    expect(html).toContain('<h2>');
  });

  test('bullet list works', async ({ mockAuthenticatedApiPage }) => {
    const editorPage = new EditorPage(mockAuthenticatedApiPage);

    await editorPage.goto();
    await editorPage.waitForEditor();

    await editorPage.richTextEditor.type('Item 1');
    await editorPage.richTextEditor.toggleBulletList();

    const html = await editorPage.richTextEditor.getHTML();
    expect(html).toContain('<ul>');
    expect(html).toContain('<li>');
  });

  test('ordered list works', async ({ mockAuthenticatedApiPage }) => {
    const editorPage = new EditorPage(mockAuthenticatedApiPage);

    await editorPage.goto();
    await editorPage.waitForEditor();

    await editorPage.richTextEditor.type('Step 1');
    await editorPage.richTextEditor.toggleOrderedList();

    const html = await editorPage.richTextEditor.getHTML();
    expect(html).toContain('<ol>');
    expect(html).toContain('<li>');
  });

  test('blockquote works', async ({ mockAuthenticatedApiPage }) => {
    const editorPage = new EditorPage(mockAuthenticatedApiPage);

    await editorPage.goto();
    await editorPage.waitForEditor();

    await editorPage.richTextEditor.type('A famous quote');
    await editorPage.richTextEditor.toggleBlockquote();

    const html = await editorPage.richTextEditor.getHTML();
    expect(html).toContain('<blockquote>');
  });

  test('multiple formatting can be combined', async ({ mockAuthenticatedApiPage }) => {
    const editorPage = new EditorPage(mockAuthenticatedApiPage);

    await editorPage.goto();
    await editorPage.waitForEditor();

    await editorPage.richTextEditor.type('Bold and Italic');
    await editorPage.page.keyboard.press('Control+a');
    await editorPage.richTextEditor.toggleBold();
    await editorPage.richTextEditor.toggleItalic();

    const html = await editorPage.richTextEditor.getHTML();
    expect(html).toContain('<strong>');
    expect(html).toContain('<em>');
  });
});
