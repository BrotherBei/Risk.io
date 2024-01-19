app = new PIXI.Application({ width: innerWidth, height: innerHeight });
let obstacles = [];
let guns = [];
let ammoItems=[];
let background;
let cameraZoom = 1; // Initial camera zoom
const zoomIncrement = 0.1; // Increment for zooming
let isShooting = false;
let canShoot = true; // Add this line to declare the variable
let keys = {};

const ammoTypes = {
    gauge12: {
        url: 'https://img.officer.com/files/base/cygnus/ofcr/image/2017/09/12_G___DR.59b93c1d4a1a9.png?auto=format&w=1000&h=562&fit=clip&dpr=2',
        gunType: 'Shotgun',
    },
    mm762: {
        url: 'https://th.bing.com/th/id/R.28942e35cdba41ee69c1095f3016f032?rik=99w0kMLxmGF%2fqw&pid=ImgRaw&r=0',
        gunType: 'AR',
    },
    mm567: {
        url: 'https://th.bing.com/th/id/OIP.nx1TvYxRbSuWCDAR2DacewHaHa?rs=1&pid=ImgDetMain`',
        gunType: 'SMG',
    },
    mm9: {
        url: 'https://th.bing.com/th/id/OIP.nx1TvYxRbSuWCDAR2DacewHaHa?rs=1&pid=ImgDetMain',
        gunType: 'Sniper',
    },
};
let ammoToRemove = [];
window.onload = function () {
    document.body.appendChild(app.view);
    let keys = {};
    let player = new Player("ahhh");
    player.sprite.scale = 0.5;

    player.sprite.anchor.set(0.5);
    player.sprite.scale.set(0.05);
    player.sprite.y = innerHeight / 2;
    player.sprite.x = innerWidth / 2;
    app.stage.addChild(player.sprite);
    

    const circle = app.stage.addChild(new PIXI.Graphics()
        .beginFill(0xffffff)
        .lineStyle({ color: 0x111111, alpha: 0.87, width: 1 })
        .drawCircle(0, 0, 8)
        .endFill());
    document.body.style.cursor = 'none';
    circle.position.set(app.screen.width / 2, app.screen.height / 2);

    app.stage.eventMode = 'static';
    app.stage.hitArea = app.screen;

    app.stage.addEventListener('pointermove', (e) => {
        circle.position.copyFrom(e.global);
        let radian = Math.atan2(circle.y - player.sprite.y, circle.x - player.sprite.x);
        player.sprite.rotation += radian - player.sprite.rotation + Math.PI / 2;

        // Rotate the gun along with the sprite
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'c') {
            // Toggle zoom on 'C' key press
            toggleZoom();
        }
    });

    const reloadingText = new PIXI.Text('Reloading...', { fontSize: 24, fill: 0xff0000 });
    reloadingText.visible=false;
    app.stage.addChild(reloadingText);

    const magazineSizeText = new PIXI.Text(`Magazine: 0/0`, { fontSize: 24, fill: 0xffffff });
    magazineSizeText.visible=false;
    app.stage.addChild(magazineSizeText);
    const ammoDisplayText = new PIXI.Text('', { fontSize: 24, fill: 0xffffff });

    app.stage.addChild(ammoDisplayText);
    let gunNameText = new PIXI.Text('', { fontSize: 24, fill: 0xffffff });
    gunNameText.position.set(innerWidth / 2, 750);
    app.stage.addChild(gunNameText);

    let isMouseDown = false;

    // Shooting Logic
    window.addEventListener('mousedown', (e) => {
        if (e.button === 0 && player.currentGun && player.currentGun.canShoot) {
            isMouseDown = true;
            isShooting=true;
            startFiring();
            fireGun(); // Call fireGun function when the mouse is pressed
        }
    });

    window.addEventListener('mouseup', () => {
        isMouseDown = false;
        isShooting=false;
        stopFiring(); // Stop firing when the mouse is released
    });

    player.sprite.on('gunPickedUp', (gun) => {
        console.log('Gun picked up!', gun);
    });

    app.view.addEventListener('wheel', (e) => {
        const direction = e.deltaY > 0 ? 1 : -1; // Check scroll direction
        player.switchGun(direction);
        e.preventDefault();
    });

    window.addEventListener('keydown', (e) => {
        if (e.key === 'r' && player.currentGun && player.currentGun.pickedup && player.currentGun.canShoot) {
            // Reload the current gun manually only if it's picked up and canShoot is true
            player.currentGun.reload();
        }
    });
    window.addEventListener('keydown', (e) => {
        if (e.key === 'c') {
            // Toggle zoom on 'C' key press
            toggleZoom();
        }
    });

    spawnObstacle();

    app.ticker.add(() => {
        if (player.currentGun) {
            player.currentGun.update();
            updateUI();
            updateBullets(player);
        }
        app.stage.position.set(innerWidth / 2 - player.sprite.x * cameraZoom, innerHeight / 2 - player.sprite.y * cameraZoom);
        if(isShooting ){
            player.sprite.x -= player.currentGun.recoilAmount * Math.cos(player.sprite.rotation-Math.PI/2);
            player.sprite.y -= player.currentGun.recoilAmount * Math.sin(player.sprite.rotation-Math.PI/2);
        }

        if (keys["e"]) {
            if (guns.length > 0) {
                guns.forEach((gun, index) => {
                    if (collision(player.sprite, gun.sprite) && !gun.pickedup) {
                        player.pickUpGun(gun);
                        guns.splice(index, 1);
                        canShoot = true; // Remove the picked-up gun from the array
                    }
                });
            }
        }

        if (player.currentGun) {
            player.currentGun.bullets.forEach(bullet => {
                obstacles.forEach(obstacle => {
                    if (collision(bullet, obstacle.sprite)) {
                        obstacle.takeDamage(player.currentGun.damage);
                        bullet.destroy();
                        player.currentGun.bullets.splice(player.currentGun.bullets.indexOf(bullet), 1);
                    }
                });
            });

            player.currentGun.bullets.forEach(bullet => {
                if (bullet) {
                    bullet.x += Math.cos(bullet.rotation) * player.currentGun.bulletSpeed;
                    bullet.y += Math.sin(bullet.rotation) * player.currentGun.bulletSpeed;

                    if (bullet.x < 0 || bullet.x > app.screen.width || bullet.y < 0 || bullet.y > app.screen.height) {
                        bullet.destroy();
                        player.currentGun.bullets.splice(player.currentGun.bullets.indexOf(bullet), 1);
                    }
                }
            });
        }


        if (isMouseDown) {
            fireGun();
        }
        if(keys["c"]){
            toggleZoom();
        }

        if (keys["a"] ) {
            if(isShooting){
                player.sprite.x-=2;
            }
            else{
                player.sprite.x -= 5;
            }
            
        }
        if (keys["w"]) {
            if(isShooting){
                player.sprite.y-=2;
            }
            else{
                player.sprite.y -= 5;
            }
            
        }
        if (keys["d"]) {
            if(isShooting){
                player.sprite.x+=2;
            }
            else{
                player.sprite.x += 5;
            }
            
        }
        if (keys["s"]) {
            if(isShooting){
                player.sprite.y+=2;
            }
            else{
                player.sprite.y += 5;
            }
            
        }

        if (player.currentGun) {
            player.currentGun.bullets.forEach(bullet => {
                obstacles.forEach(obstacle => {
                    if (collision(bullet, obstacle.sprite)) {
                        obstacle.takeDamage(player.currentGun.damage);
                        bullet.destroy();
                        player.currentGun.bullets.splice(player.currentGun.bullets.indexOf(bullet), 1);
                    }
                });
            });
        }
        ammoItems.forEach((ammo, index) => {
            if (collision(player.sprite, ammo.sprite)) {
                console.log('Player picked up ammo:', ammo.type.gunType);
                    // Add ammo to the player's gun based on the gun type
                player.addAmmo();
                ammo.sprite.destroy();
                // Remove the picked-up ammo item from the array
                ammoItems.splice(index, 1);
                    // Destroy the PIXI sprite of the picked-up ammo
                    

            }
        });
        
        
        
        
    });

    window.addEventListener("keydown", keysDown);
    window.addEventListener("keyup", keysUp);

    app.view.tabIndex = 0;
    app.view.focus();

    

    function keysDown(event) {
        keys[event.key] = true;
    }

    function keysUp(event) {
        keys[event.key] = false;
    }

    function startFiring() {
        app.ticker.add(fireGun);
    }

    function stopFiring() {
        app.ticker.remove(fireGun);
    }

    function fireGun() {
        if (player.currentGun && player.currentGun.pickedup && player.currentGun.canShoot) {
            player.currentGun.fireGun(player);
        }
    }
    function toggleZoom() {
        // Toggle between zoomed-in and zoomed-out state
        if (cameraZoom === 1) {
            cameraZoom = 2; // You can adjust the zoom level as needed
        } else {
            cameraZoom = 1;
        }
        
        app.view.scale.set(cameraZoom);
        app.scale.position.set(innerWidth / 2 - player.sprite.x * cameraZoom, innerHeight / 2 - player.sprite.y * cameraZoom);
    }
    
    function spawnAmmo() {
        for (let i = 0; i < 5; i++) {
            const ammoTypeKeys = Object.keys(ammoTypes);
            const randomAmmoType = ammoTypes[ammoTypeKeys[Math.floor(Math.random() * ammoTypeKeys.length)]];
            const newAmmo = new Ammo(randomAmmoType, Math.random() * app.screen.width, Math.random() * app.screen.height);
    
            // Set the scale of the ammo sprite to 0.1
            newAmmo.sprite.scale.set(0.1);
    
            ammoItems.push(newAmmo);
        }
    }
    
    spawnAmmo();

    function updateUI() {
        reloadingText.visible = player.currentGun && player.currentGun.isReloading;
        reloadingText.position.set(player.sprite.x - reloadingText.width / 2, player.sprite.y + 100);
        magazineSizeText.visible=true;
        magazineSizeText.text = player.currentGun ? `Magazine: ${player.currentGun.currentMagazine}/${player.currentGun.magazineSize}` : '';
        magazineSizeText.position.set(player.sprite.x - magazineSizeText.width / 2, player.sprite.y + 150);
    
        // Update gun name text
        gunNameText.text = player.currentGun ? player.currentGun.name : '';
        gunNameText.position.set(player.sprite.x - gunNameText.width / 2, player.sprite.y + 250);
    }


    function collision(r1, r2) {
        if (!r1.transform || !r2.transform) return false;

        const hitbox1 = r1.getBounds();
        const hitbox2 = r2.getBounds();

        return hitbox1.x < hitbox2.x + hitbox2.width &&
               hitbox1.x + hitbox1.width > hitbox2.x &&
               hitbox1.y < hitbox2.y + hitbox2.height &&
               hitbox1.y + hitbox1.height > hitbox2.y;
    }

    function randGun() {
        const randNum = Math.floor(Math.random() * 100) + 1;

        if (randNum <= 10) {
            // Sniper with 10% spawn rate
            return new Gun('https://th.bing.com/th/id/R.7038623ae7bf5d5af36730435f5c3527?rik=uppyMRIieoiuqQ&pid=ImgRaw&r=0', 'Sniper', 1300, 40, 3500, 3, 0, 0.01, 1, 90, 1000);
        } else if (randNum <= 40) {
            // Shotgun with a 30% Spawn Rate
            return new Gun("https://th.bing.com/th/id/R.5a1c02bddeb4b399a126a4363f9ab2c3?rik=CaBbNuK6Sp55Ng&pid=ImgRaw&r=0", "Shotgun", 1000, 15, 2500, 9, 0, 0.3, 10, 7, 200);
        } else if (randNum <= 70) {
            //AR with a 30% spawn rate
            return new Gun("https://th.bing.com/th/id/R.24cd61e1ea07c9a28dc7c9a12ef782e4?rik=X6CaowUNyGKQmg&pid=ImgRaw&r=0", "AR", 100, 15, 2000, 25, 0.4, 0.1, 1, 5, 650);
        } else if (randNum <= 80) {
            // Pistols with 10% spawn rate
            return new Gun("https://th.bing.com/th/id/R.71d47e815337549b51464cd7e59bf83b?rik=pXF3EUUIMx%2bV3w&riu=http%3a%2f%2fclipart-library.com%2fimages_k%2fgun-png-transparent%2fgun-png-transparent-16.png&ehk=3VP9wvV6o70VPOPkzmhYM49klsQLAhuHMAevsGY0sos%3d&risl=&pid=ImgRaw&r=0", "Pistol", 100, 20, 1000, 15, 0.5, 0.2, 1, 4, 250);
        } else if (randNum <= 81) {
            // SMGs with 1% spawn rate
            return new Gun('https://th.bing.com/th/id/R.df3a47350775ef427ac6e0155c8a8450?rik=98vRxvG71BYwZg&riu=http%3a%2f%2fpluspng.com%2fimg-png%2fgun-png-transparent-background-classic-metal-handgun-png-image-purepng-free-transparent-cc0-png-image-library-1106.png&ehk=4LL19t7WcReKuhUj19n4dXRkO6ZRT%2bbZrcumze2OrNg%3d&risl=&pid=ImgRaw&r=0', "OG Dev Revolver", 1, 5, 0, 100, 0, 0, 1, 1, 1000);
        } else{
            // Default to SMG if none of the above conditions match
            return new Gun("https://th.bing.com/th/id/R.804b42a3776f9807d0b00b16526a170c?rik=LgCwwcgTgxwpcw&riu=http%3a%2f%2fvignette2.wikia.nocookie.net%2fzombieescape%2fimages%2f2%2f2a%2fZewikia_weapon_smg_tmp_css.png%2frevision%2flatest%3fcb%3d20120108204957&ehk=dW0gEpMOm91ooLrXagIjHC6a%2fzlkXQQL7RaaxEwLZio%3d&risl=&pid=ImgRaw&r=0", "SMG", 65, 20, 1500, 35, 0.5, 0.25, 1, 3, 450);
        }
    }

    function spawnGuns(numGuns) {
        for (let i = 0; i < numGuns; i++) {
            const gun = randGun();
            app.stage.addChild(gun.sprite);
            gun.sprite.position.set(Math.random() * app.screen.width, Math.random() * app.screen.height);
            guns.push(gun);
        }
    }
    spawnGuns(10);

    function spawnObstacle() {
        console.log("Obstacles spawned!")
        for (i = 0; i < 5; i++) {
            let obstacle = new Obstacle(
                Math.random() * app.screen.width,
                Math.random() * app.screen.height,
                100,  // Set initial health
                'https://vignette.wikia.nocookie.net/survivio/images/f/f2/DefaultSurvivr39.png/revision/latest?cb=20200415055602'
            );
            obstacles.push(obstacle);
        }

    }

    function updateBullets(player) {
        if (player.currentGun) {
            player.currentGun.bullets.forEach(bullet => {
                bullet.x += Math.cos(bullet.rotation) * player.currentGun.bulletSpeed;
                bullet.y += Math.sin(bullet.rotation) * player.currentGun.bulletSpeed;

                if (bullet.x < 0 || bullet.x > app.screen.width || bullet.y < 0 || bullet.y > app.screen.height) {
                    bullet.destroy();
                    player.currentGun.bullets.splice(player.currentGun.bullets.indexOf(bullet), 1);
                }
            });
        }
    }

};










