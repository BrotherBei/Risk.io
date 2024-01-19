class Ammo {
  constructor(type, x, y) {
    this.type = type; // Set the type directly
    this.sprite = new PIXI.Sprite(PIXI.Texture.from(type.url));
    this.sprite.position.set(x, y);
    this.sprite.anchor.set(0.5);
    app.stage.addChild(this.sprite);
  }
}
