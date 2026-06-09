#!/bin/bash
# Build frontend and copy to backend/static
echo "Building frontend..."
cd frontend
npm install
npm run build
echo "Copying to backend/static..."
rm -rf ../backend/static
cp -r dist ../backend/static
echo "Build complete! backend/static is ready."
