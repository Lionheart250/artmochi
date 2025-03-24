// Collection of cyber sigil shapes with aggressive, sharp designs
export const tribalShapes = [
  // Z-Blade Triple Cyber Sigil Shuriken - enhanced for danger and sharpness
  {
    points: [
      // Center hex core - sharper edges
      { x: 0.0, y: 0.0 },      // Center reference
      { x: 0.2, y: 0.0 },      // Right point
      { x: 0.15, y: 0.15 },    // Upper right
      { x: -0.05, y: 0.2 },    // Upper left
      { x: -0.2, y: 0.05 },    // Left point
      { x: -0.15, y: -0.15 },  // Lower left
      { x: 0.05, y: -0.2 },    // Lower right
      { x: 0.2, y: 0.0 },      // Back to right point
      
      // BLADE 1 - RIGHT FACING Z-BLADE WITH SHARP POINTS
      { x: 0.2, y: 0.0 },       // Connect to core
      { x: 0.5, y: 0.1 },       // First segment out
      { x: 0.6, y: -0.1 },      // First Z angle down
      { x: 0.85, y: -0.05 },    // Middle segment
      { x: 0.9, y: -0.25 },     // Second Z angle down
      { x: 1.2, y: -0.2 },      // Extend to tip
      
      // Blade 1 - sharp point
      { x: 1.4, y: -0.3 },      // Ultra-sharp end point
      
      // Blade 1 - return edge (upper side)
      { x: 1.2, y: -0.1 },      // Back from point
      { x: 0.95, y: -0.15 },    // Upper edge of middle segment
      { x: 0.9, y: 0.05 },      // Upper angle
      { x: 0.65, y: 0.0 },      // Upper edge of first segment
      { x: 0.5, y: 0.2 },       // Upper angle near core
      { x: 0.2, y: 0.1 },       // Back to core
      { x: 0.0, y: 0.0 },       // Return to center
      
      // BLADE 2 - UPPER LEFT Z-BLADE (120° ROTATION)
      { x: -0.05, y: 0.2 },     // Connect to core
      { x: -0.2, y: 0.45 },     // First segment out
      { x: -0.4, y: 0.4 },      // First Z angle
      { x: -0.5, y: 0.6 },      // Middle segment
      { x: -0.7, y: 0.55 },     // Second Z angle
      { x: -0.8, y: 0.8 },      // Extend to tip
      
      // Blade 2 - sharp point
      { x: -0.9, y: 1.0 },      // Ultra-sharp end point
      
      // Blade 2 - return edge
      { x: -0.7, y: 0.85 },     // Back from point
      { x: -0.6, y: 0.65 },     // Inner edge
      { x: -0.35, y: 0.7 },     // Inner angle
      { x: -0.25, y: 0.55 },    // Middle inner edge
      { x: -0.1, y: 0.5 },      // Inner angle near core
      { x: 0.0, y: 0.3 },       // Back to core
      { x: 0.0, y: 0.0 },       // Return to center
      
      // BLADE 3 - LOWER LEFT Z-BLADE (240° ROTATION)
      { x: -0.15, y: -0.15 },   // Connect to core
      { x: -0.35, y: -0.3 },    // First segment out
      { x: -0.3, y: -0.5 },     // First Z angle
      { x: -0.5, y: -0.6 },     // Middle segment
      { x: -0.45, y: -0.8 },    // Second Z angle
      { x: -0.7, y: -0.9 },     // Extend to tip
      
      // Blade 3 - sharp point
      { x: -0.8, y: -1.1 },     // Ultra-sharp end point
      
      // Blade 3 - return edge
      { x: -0.6, y: -0.95 },    // Back from point
      { x: -0.35, y: -0.85 },   // Inner edge
      { x: -0.4, y: -0.65 },    // Inner angle
      { x: -0.2, y: -0.55 },    // Middle inner edge
      { x: -0.25, y: -0.35 },   // Inner angle near core
      { x: -0.05, y: -0.25 },   // Back to core
      { x: 0.0, y: 0.0 },       // Return to center
      
      // CYBERNETIC DETAILS - Inner circuit patterns
      // Circuit line 1
      { x: 0.0, y: 0.0 },       // Center
      { x: 0.1, y: 0.1 },       // Diagonal line
      { x: 0.05, y: 0.12 },     // Angle
      { x: 0.0, y: 0.0 },       // Back to center
      
      // Circuit line 2
      { x: 0.0, y: 0.0 },       // Center
      { x: -0.1, y: 0.08 },     // Diagonal line
      { x: -0.12, y: 0.03 },    // Angle
      { x: 0.0, y: 0.0 },       // Back to center
      
      // Circuit line 3
      { x: 0.0, y: 0.0 },       // Center
      { x: -0.08, y: -0.09 },   // Diagonal line
      { x: -0.03, y: -0.11 },   // Angle
      { x: 0.0, y: 0.0 },       // Back to center
      
      // EXTRA BARBS & SPIKES ON BLADES FOR MAXIMUM DANGER
      // Blade 1 barbs
      { x: 0.0, y: 0.0 },       // Return to center
      { x: 0.55, y: 0.05 },     // Move to barb position
      { x: 0.6, y: 0.15 },      // Barb point
      { x: 0.65, y: 0.05 },     // Return to blade
      { x: 0.8, y: -0.1 },      // Move to next barb
      { x: 0.85, y: 0.0 },      // Barb point
      { x: 0.9, y: -0.1 },      // Return to blade
      { x: 0.0, y: 0.0 },       // Return to center
      
      // Blade 2 barbs
      { x: 0.0, y: 0.0 },       // Return to center
      { x: -0.3, y: 0.5 },      // Move to barb position
      { x: -0.4, y: 0.55 },     // Barb point
      { x: -0.35, y: 0.6 },     // Return to blade
      { x: -0.6, y: 0.7 },      // Move to next barb
      { x: -0.7, y: 0.75 },     // Barb point
      { x: -0.65, y: 0.8 },     // Return to blade
      { x: 0.0, y: 0.0 },       // Return to center
      
      // Blade 3 barbs
      { x: 0.0, y: 0.0 },       // Return to center
      { x: -0.3, y: -0.4 },     // Move to barb position
      { x: -0.25, y: -0.5 },    // Barb point
      { x: -0.35, y: -0.45 },   // Return to blade
      { x: -0.5, y: -0.7 },     // Move to next barb
      { x: -0.45, y: -0.8 },    // Barb point
      { x: -0.55, y: -0.75 },   // Return to blade
      { x: 0.0, y: 0.0 },       // Return to center
      
      // FINAL CENTER PATTERN - Circuit core
      { x: 0.0, y: 0.0 },       // Center
      { x: 0.07, y: 0.07 },     // Top right
      { x: 0.0, y: 0.1 },       // Top
      { x: -0.07, y: 0.07 },    // Top left
      { x: -0.1, y: 0.0 },      // Left
      { x: -0.07, y: -0.07 },   // Bottom left
      { x: 0.0, y: -0.1 },      // Bottom
      { x: 0.07, y: -0.07 },    // Bottom right
      { x: 0.1, y: 0.0 },       // Right
      { x: 0.07, y: 0.07 },     // Back to top right
      { x: 0.0, y: 0.0 }        // Final return to center
    ]
  }
];