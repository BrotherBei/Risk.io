class Gun {
    constructor(textureURL,name, fireRate, bulletSpeed, reloadTime, magazineSize, recoilAmount, spread, bulletInSpread, damage, range) {
        this.sprite = PIXI.Sprite.from(textureURL);
        this.name=name;
        this.sprite.anchor.set(0.5);
        this.sprite.scale.set(0.1);
        this.fireRate = fireRate;
        this.reloadTime = reloadTime;
        this.magazineSize = magazineSize;
        this.bullets = [];
        this.bulletSpeed = bulletSpeed;
        this.lastFireTime = 0;
        this.isReloading = false;
        this.currentMagazine = 0;
        this.recoilAmount = recoilAmount;
        this.spread=spread;
        this.isRecoiling = false;
        this.bulletInSpread=bulletInSpread;
        this.damage=damage;
        this.pickedup=false;
        this.canShoot = true;
        this.range=range;
        this.ammoCount =0;
    }
    addAmmo() {
        // Add ammo to the gun based on the gun type
        // For simplicity, assume ammo count is added based on the gun type
        // You might need a more sophisticated logic based on your game's design
        switch (this.ammoType) {
            case 'gauge12':
                this.ammoCount += 5; // Add 5 shotgun shells
                break;
            case 'mm762':
                this.ammoCount += 30; // Add 30 AR bullets
                break;
            // Add cases for other gun types as needed
            default:
                break;
        }
        const ammoToAdd = 10; // You can adjust this based on your needs
        this.currentMagazine = Math.min(this.currentMagazine + ammoToAdd, this.magazineSize);

    }
    canShoot() {
        // Check if there is enough ammo in the magazine to shoot
        return this.currentMagazine > 0;
    }

    canReload() {
        // Check if there is enough collected ammo to reload
        return this.player && this.player.collectedAmmo[this.ammoType] > 0;
    }


// Inside the update method of Gun class
    update() {
        this.bullets.forEach(bullet => {
            bullet.x += Math.cos(bullet.rotation) * this.bulletSpeed;
            bullet.y += Math.sin(bullet.rotation) * this.bulletSpeed;

            // Check if the bullet is outside the screen boundaries or has reached its maximum range
            if (
                bullet.x < 0 || bullet.x > app.screen.width ||
                bullet.y < 0 || bullet.y > app.screen.height ||
                bullet.initialRange >= this.range
            ) {
                bullet.destroy();
                this.bullets.splice(this.bullets.indexOf(bullet), 1);
            } else {
                bullet.initialRange += this.bulletSpeed;
            }
        });

        if (this.isReloading) {
            this.reload();
        }

        if (this.isRecoiling) {
            this.applyRecoil();
        }
    }

    

    fireGun(player) {
        if (!this.isReloading && this.currentMagazine > 0 && this.canShoot) {
            let currentTime = Date.now();
    
            if (currentTime - this.lastFireTime > this.fireRate) {
                for (let i = 0; i < this.bulletInSpread; i++) {
                    let bullet = PIXI.Sprite.from('https://th.bing.com/th/id/R.a3fdbe13e947b4288c9d8d327f17e2bd?rik=87mmGJyZ46RSFg&pid=ImgRaw&r=0');
                    bullet.anchor.set(0.5);
                    bullet.scale.set(0.03);
                    bullet.x = player.sprite.x;
                    bullet.y = player.sprite.y;
    
                    // Introduce random angle within a certain range (spread)
                    let spreadAngle = (Math.random() - 0.5) * this.spread;
                    bullet.rotation = player.sprite.rotation + spreadAngle - Math.PI / 2; // Adjusted rotation
    
                    // Store initial position for range calculation
                    bullet.initialX = bullet.x;
                    bullet.initialY = bullet.y;
                    bullet.initialRange = 0;
    
                    app.stage.addChild(bullet);
                    this.bullets.push(bullet);
                }
    
                this.lastFireTime = currentTime;
                this.currentMagazine--;
    
                if (this.currentMagazine <= 0) {
                    this.reload();
                }
            }
        }
    }
    
    
    reload() {
        if (this.pickedup && !this.isReloading && this.canShoot) {
            this.isReloading = true;
            this.canShoot = false; // Set canShoot to false during reloading
            console.log("Reloading!");
            const reloadTimeout = setTimeout(() => {
                this.currentMagazine = this.magazineSize;
                this.ammoCount-=this.magazineSize;
                this.isReloading = false;
                this.canShoot = true; // Set canShoot to true after reloading
            }, this.reloadTime);
            this.reloadTimeout = reloadTimeout; // Store the timeout ID
            console.log("Finished Reloading!");
        }
    }
    cancelReload() {
        if (this.isReloading) {
            clearTimeout(this.reloadTimeout);
            this.isReloading = false;
            this.canShoot = true; // Allow shooting again
            console.log("Reload canceled!");
        }
    }
    


}