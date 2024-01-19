class Obstacle {
    constructor(x, y, health, textureURL) {
        this.sprite = PIXI.Sprite.from(textureURL);
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.05);
        this.sprite.x = x;
        this.sprite.y = y;
        this.health = health;
        app.stage.addChild(this.sprite);
    }

    takeDamage(damage) {
        this.health -= damage;
        if (this.health <= 0) {
            this.destroy();
        }
    }

    destroy() {
        app.stage.removeChild(this.sprite);
        obstacles.splice(obstacles.indexOf(this), 1);
    }
}