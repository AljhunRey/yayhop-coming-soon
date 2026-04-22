#!/bin/sh
# Build the frontend, deploy to docs/, and always copy index.html to 404.html for GitHub Pages SPA routing

cd frontend || exit 1
npm run build || exit 1
cd ..
rm -rf docs/*
cp -a frontend/build/. docs/
cp docs/index.html docs/404.html

echo "Build and deploy complete. 404.html updated for SPA routing."
