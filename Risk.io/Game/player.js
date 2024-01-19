class Player {
    constructor(name) {
        this.name = name;
        this.sprite = PIXI.Sprite.from('https://vignette.wikia.nocookie.net/survivio/images/f/f2/DefaultSurvivr39.png/revision/latest?cb=20200415055602');
        this.health = 100;
        this.speed = 5;
        this.stats = 0;
        this.effect = null;
        this.inventory=[]
        this.inventorySize=3;
        this.canShoot=false;
        this.currentGunIndex = 0; // Index of the current gun in the inventory
        this.currentGun = null; // Reference to the current gun
        this.collectedAmmo = {};
        this.collectedAmmo = {
            "12 Gauge": 0,
            "7.62mm": 0,
            "5.67mm": 0,
            "9mm": 0,
            // Add more ammo types as needed
        };
        this.scope=0
    }
    addAmmo(ammoType, count = 1) {
        // Increment the collected ammo count for the specified type
        if (!this.collectedAmmo[ammoType]) {
            this.collectedAmmo[ammoType] = 0;
        }
        this.collectedAmmo[ammoType] += count;
    }
    pickUpGun(gun) {
        if (!gun.pickedup) {
            if (this.inventory.length < this.inventorySize) {
                this.inventory.push(gun);
                app.stage.removeChild(gun.sprite); // Remove the gun from the stage
                console.log(`Picked up a gun! Inventory: ${this.inventory.length}/${this.inventorySize}`);
    
                this.currentGunIndex = this.inventory.length - 1; // Set the current gun to the last picked-up gun
                this.currentGun = gun;
    
                this.inventory.forEach((invGun) => {
                    invGun.sprite.visible = invGun === this.currentGun;
                });
    
                // Adjust the position and rotation of the gun sprite relative to the player
                this.sprite.addChild(gun.sprite);
                gun.sprite.anchor.set(0.5);
                gun.sprite.scale.set(2); // Adjust the scale if needed
    
                // Set the gun's position and rotation relative to the player
                gun.sprite.position.set(0, 0); // Adjust position if needed
                gun.sprite.rotation = -Math.PI/2; // Adjust rotation if needed
    
                // Dispatch a custom event indicating that a gun was picked up
                this.sprite.emit('gunPickedUp', gun);
    
                gun.pickedup = true; // Mark the gun as picked up
                gun.reload();
            } else {
                console.log('Inventory is full!');
            }
        }
    }
    switchGun(direction) {
        if (this.inventory.length > 1) {
            // Check if the current gun is reloading, and stop the reloading process
            if (this.currentGun && this.currentGun.isReloading) {
                this.currentGun.cancelReload();
            }
    
            this.currentGunIndex += direction;
            if (this.currentGunIndex < 0) {
                this.currentGunIndex = this.inventory.length - 1;
            } else if (this.currentGunIndex >= this.inventory.length) {
                this.currentGunIndex = 0;
            }
    
            this.currentGun = this.inventory[this.currentGunIndex];
            this.inventory.forEach((invGun) => {
                invGun.sprite.visible = invGun === this.currentGun;
            });
    
            // If the current gun exists and has an empty magazine, initiate the reload
            if (this.currentGun && this.currentGun.currentMagazine === 0) {
                this.currentGun.reload();
            }
        }
    }

    

}