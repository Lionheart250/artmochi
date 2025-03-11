const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

// Set the directory where your full-sized images are stored
const examplesDir = './client/public/examples/loras';

console.log('Starting thumbnail generation...');

// Get all category folders
try {
  const categories = fs.readdirSync(examplesDir);
  console.log(`Found ${categories.length} categories`);

  // Process each category folder
  categories.forEach(category => {
    const categoryDir = path.join(examplesDir, category);
    
    // Make sure it's a directory
    if (fs.statSync(categoryDir).isDirectory()) {
      console.log(`Processing category: ${category}`);
      
      // Get all WEBP files that aren't already thumbnails
      const files = fs.readdirSync(categoryDir)
        .filter(file => file.endsWith('.webp') && !file.includes('-thumb'));
      
      console.log(`Found ${files.length} images to process in ${category}`);
      
      // Process each file
      files.forEach(file => {
        const filePath = path.join(categoryDir, file);
        const baseName = file.replace('.webp', '');
        
        // Create small thumbnail path
        const smallThumbPath = path.join(categoryDir, `${baseName}-thumb-sm.webp`);
        
        // Create medium thumbnail path
        const mediumThumbPath = path.join(categoryDir, `${baseName}-thumb.webp`);
        
        // Check if thumbnails already exist
        const smallExists = fs.existsSync(smallThumbPath);
        const mediumExists = fs.existsSync(mediumThumbPath);
        
        if (!smallExists) {
          // Create small thumbnail (~100px)
          sharp(filePath)
            .resize(100)
            .webp({ quality: 80 })
            .toFile(smallThumbPath)
            .then(() => console.log(`Created small thumbnail for ${file}`))
            .catch(err => console.error(`Error creating small thumbnail for ${file}:`, err));
        } else {
          console.log(`Small thumbnail for ${file} already exists, skipping`);
        }
        
        if (!mediumExists) {
          // Create medium thumbnail (~300px)
          sharp(filePath)
            .resize(300)
            .webp({ quality: 85 })
            .toFile(mediumThumbPath)
            .then(() => console.log(`Created medium thumbnail for ${file}`))
            .catch(err => console.error(`Error creating medium thumbnail for ${file}:`, err));
        } else {
          console.log(`Medium thumbnail for ${file} already exists, skipping`);
        }
      });
    }
  });
} catch (error) {
  console.error('Error processing thumbnails:', error);
}