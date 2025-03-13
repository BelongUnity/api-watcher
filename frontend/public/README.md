# API Watcher Public Assets

This directory contains the public assets for the API Watcher application.

## Logo Files

The logo files (`logo192.png` and `logo512.png`) have been removed from the manifest.json to prevent 404 errors. If you want to add custom logo files for your application, you can:

1. Create logo files with the following dimensions:
   - `logo192.png`: 192x192 pixels
   - `logo512.png`: 512x512 pixels

2. Place them in this directory

3. Update the `manifest.json` file to include references to these files:

```json
"icons": [
  {
    "src": "favicon.ico",
    "sizes": "64x64 32x32 24x24 16x16",
    "type": "image/x-icon"
  },
  {
    "src": "logo192.png",
    "type": "image/png",
    "sizes": "192x192"
  },
  {
    "src": "logo512.png",
    "type": "image/png",
    "sizes": "512x512"
  }
]
```

## Other Assets

- `favicon.ico`: The favicon for the application
- `index.html`: The main HTML file
- `robots.txt`: Instructions for web crawlers 