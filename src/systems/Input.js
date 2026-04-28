export class Input {
  constructor(canvas) {
    this.keys = new Set();
    this.justPressed = new Set();
    this.mouse = { x: 480, y: 270, left: false, right: false, leftTap: false, rightTap: false };

    window.addEventListener("keydown", (event) => {
      const key = event.key.toLowerCase();
      if (!this.keys.has(key)) this.justPressed.add(key);
      this.keys.add(key);
      if ([" ", "shift"].includes(key)) event.preventDefault();
    });

    window.addEventListener("keyup", (event) => {
      this.keys.delete(event.key.toLowerCase());
    });

    canvas.addEventListener("mousemove", (event) => {
      const rect = canvas.getBoundingClientRect();
      this.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
      this.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    });

    canvas.addEventListener("mousedown", (event) => {
      if (event.button === 0) {
        this.mouse.left = true;
        this.mouse.leftTap = true;
      }
      if (event.button === 2) {
        this.mouse.right = true;
        this.mouse.rightTap = true;
      }
    });

    window.addEventListener("mouseup", (event) => {
      if (event.button === 0) this.mouse.left = false;
      if (event.button === 2) this.mouse.right = false;
    });

    canvas.addEventListener("contextmenu", (event) => event.preventDefault());
  }

  down(key) {
    return this.keys.has(key.toLowerCase());
  }

  pressed(key) {
    return this.justPressed.has(key.toLowerCase());
  }

  endFrame() {
    this.justPressed.clear();
    this.mouse.leftTap = false;
    this.mouse.rightTap = false;
  }
}
