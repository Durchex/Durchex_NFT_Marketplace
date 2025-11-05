# Frontend Directory

## ⚠️ IMPORTANT: All Frontend Code Goes Here

All frontend source code should be in this `frontend/` folder, specifically in `frontend/src/`.

### Directory Structure

```
frontend/
├── src/              # All source code goes here
│   ├── components/   # React components
│   ├── pages/        # Page components
│   ├── Context/      # React contexts
│   ├── services/     # API and service files
│   ├── assets/       # Images and static assets
│   └── ...
├── public/           # Public static files
├── dist/             # Build output (generated)
├── package.json      # Frontend dependencies
├── vite.config.js    # Vite configuration
└── tailwind.config.js # Tailwind CSS configuration
```

### Development

```bash
cd frontend
npm install
npm run dev
```

### Building for Production

```bash
cd frontend
npm run build
```

The build output will be in `frontend/dist/`

### Deployment

The deployment configuration (`render.yaml`) is set to:
- Build from: `frontend/` directory
- Build command: `cd frontend && npm install && npm run build`
- Output: `frontend/dist/`

**Note:** Do NOT edit files in the root `src/` folder. All frontend work should be done in `frontend/src/`.
