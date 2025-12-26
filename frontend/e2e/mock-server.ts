import express, { Request, Response, NextFunction } from 'express';

const app = express();

// Enable CORS for all origins (needed for Next.js SSR)
app.use((req: Request, res: Response, next: NextFunction) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    res.sendStatus(200);
    return;
  }
  next();
});

app.use(express.json());

// Request logging
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[Mock API] ${req.method} ${req.path}`);
  next();
});

// Sample stories matching our test fixtures
const stories = [
  {
    id: 'story-1',
    title: 'My Published Story',
    content: '<p>This is a published story with rich content.</p>',
    slug: 'my-published-story',
    is_published: true,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
  },
  {
    id: 'story-2',
    title: 'My Draft Story',
    content: '<p>This draft is still in progress.</p>',
    slug: 'my-draft-story',
    is_published: false,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
  },
  {
    id: 'story-3',
    title: 'Story With Images',
    content: '<p>Story with an image:</p><img src="/test-image.jpg" alt="Test" width="800" height="600" />',
    slug: 'story-with-images',
    is_published: true,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
  },
];

// GET /stories - List stories with pagination
app.get('/stories', (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const size = parseInt(req.query.size as string) || 10;
  const start = (page - 1) * size;
  const pageStories = stories.slice(start, start + size);

  res.json({
    items: pageStories,
    total: stories.length,
    page,
    size,
    pages: Math.ceil(stories.length / size),
  });
});

// GET /stories/slug/:slug - Get story by slug
app.get('/stories/slug/:slug', (req: Request, res: Response) => {
  const story = stories.find((s) => s.slug === req.params.slug);
  if (story) {
    res.json(story);
  } else {
    res.status(404).json({ detail: 'Story not found' });
  }
});

// GET /stories/:id - Get story by ID
app.get('/stories/:id', (req: Request, res: Response) => {
  const story = stories.find((s) => s.id === req.params.id);
  if (story) {
    res.json(story);
  } else {
    res.status(404).json({ detail: 'Story not found' });
  }
});

// POST /stories - Create story
app.post('/stories', (req: Request, res: Response) => {
  const newStory = {
    id: `story-${Date.now()}`,
    ...req.body,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
  };
  res.status(201).json(newStory);
});

// PUT /stories/:id - Update story
app.put('/stories/:id', (req: Request, res: Response) => {
  const story = stories.find((s) => s.id === req.params.id);
  if (story) {
    res.json({ ...story, ...req.body, updatedDate: new Date().toISOString() });
  } else {
    res.status(404).json({ detail: 'Story not found' });
  }
});

// DELETE /stories/:id - Delete story
app.delete('/stories/:id', (req: Request, res: Response) => {
  res.status(204).send();
});

// POST /upload/:type - Mock file uploads
app.post('/upload/:type', (req: Request, res: Response) => {
  res.json({ url: '/mock-uploaded-file.jpg' });
});

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.MOCK_SERVER_PORT || 5555;

app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
});
