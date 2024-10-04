// Initialize the PixiJS application
const app = new PIXI.Application({
  width: 640,
  height: 360,
  backgroundColor: 0x1099bb, // Set a background color for the canvas
});
document.getElementById('game-container').appendChild(app.view);

// Create a label showing the scene graph hierarchy
const label = new PIXI.Text(
  'Scene Graph:\n\napp.stage\n  ┗ A\n     ┗ B\n     ┗ C\n  ┗ D',
  { fill: '#ffffff' }
);
label.position.set(300, 100);
app.stage.addChild(label);

// Helper function to create a block of color with a letter
const letters = [];
function addLetter(letter, parent, color, pos) {
  const bg = new PIXI.Sprite(PIXI.Texture.WHITE);
  bg.width = 100;
  bg.height = 100;
  bg.tint = color;

  const text = new PIXI.Text(letter, { fill: "#ffffff" });
  text.anchor.set(0.5);
  text.position.set(50, 50);

  const container = new PIXI.Container();
  container.position.set(pos.x, pos.y);
  container.visible = false; // Initially hidden
  container.addChild(bg, text);
  parent.addChild(container);

  letters.push(container);
  return container;
}

// Define 4 letters
let a = addLetter('A', app.stage, 0xff0000, { x: 100, y: 100 });
let b = addLetter('B', a, 0x00ff00, { x: 20, y: 20 });
let c = addLetter('C', a, 0x0000ff, { x: 20, y: 40 });
let d = addLetter('D', app.stage, 0xff8800, { x: 140, y: 100 });

// Display them over time, in order
let elapsed = 0.0;
app.ticker.add((delta) => {
  elapsed += delta / 60.0; // Increment elapsed time
  if (elapsed >= letters.length) { elapsed = 0.0; }
  
  // Show letters based on elapsed time
  for (let i = 0; i < letters.length; i++) {
    letters[i].visible = elapsed >= i;
  }
});
