const canvas = document.getElementById('fireworksCanvas');
const ctx = canvas.getContext('2d');

let width, height;
const fireworks = [];
const particles = [];
let isInteracting = false; 
let lastInteractionTime = 0; 
let lastHoldFireTime = 0; // 누르고 있을 때 폭죽 연사 간격 조절용
let currentPointerX = 0;
let currentPointerY = 0;

function resize() {
    width = canvas.width = window.innerWidth;
    height = canvas.height = window.innerHeight;
}

window.addEventListener('resize', resize);
window.addEventListener('orientationchange', () => setTimeout(resize, 100));
resize();

class Firework {
    constructor(startX, startY, targetX, targetY) {
        this.x = startX;
        this.y = startY;
        this.targetX = targetX;
        this.targetY = targetY;
        this.distanceToTarget = Math.hypot(targetX - startX, targetY - startY);
        this.distanceTraveled = 0;
        this.coordinates = [];
        this.coordinateCount = 3;
        while (this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
        this.angle = Math.atan2(targetY - startY, targetX - startX);
        this.speed = 3;
        this.acceleration = 1.05;
        this.brightness = Math.random() * 50 + 50;
    }

    update(index) {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);

        this.speed *= this.acceleration;
        const vx = Math.cos(this.angle) * this.speed;
        const vy = Math.sin(this.angle) * this.speed;

        if (Math.hypot(this.targetX - this.x, this.targetY - this.y) <= this.speed) {
            createParticles(this.targetX, this.targetY);
            fireworks.splice(index, 1);
        } else {
            this.x += vx;
            this.y += vy;
        }
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `hsl(${Math.random() * 360}, 100%, ${this.brightness}%)`;
        ctx.lineWidth = 2;
        ctx.stroke();
    }
}

class Particle {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.coordinates = [];
        this.coordinateCount = 5;
        while (this.coordinateCount--) {
            this.coordinates.push([this.x, this.y]);
        }
        this.angle = Math.random() * Math.PI * 2;
        this.speed = Math.random() * 8 + 1;
        this.friction = 0.95;
        this.gravity = 0.8;
        this.hue = Math.random() * 360;
        this.brightness = Math.random() * 50 + 50;
        this.alpha = 1;
        this.decay = Math.random() * 0.02 + 0.015;
    }

    update(index) {
        this.coordinates.pop();
        this.coordinates.unshift([this.x, this.y]);
        this.speed *= this.friction;
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed + this.gravity;
        this.alpha -= this.decay;

        if (this.alpha <= this.decay) {
            particles.splice(index, 1);
        }
    }

    draw() {
        ctx.beginPath();
        ctx.moveTo(this.coordinates[this.coordinates.length - 1][0], this.coordinates[this.coordinates.length - 1][1]);
        ctx.lineTo(this.x, this.y);
        ctx.strokeStyle = `hsla(${this.hue}, 100%, ${this.brightness}%, ${this.alpha})`;
        ctx.lineWidth = 1.5;
        ctx.stroke();
    }
}

function createParticles(x, y) {
    let particleCount = width < 768 ? 20 : 35; 
    while (particleCount--) {
        particles.push(new Particle(x, y));
    }
}

function loop() {
    requestAnimationFrame(loop);
    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
    ctx.fillRect(0, 0, width, height);
    ctx.globalCompositeOperation = 'lighter';

    const currentTime = Date.now();
    
    if (isInteracting) {
        if (currentTime - lastHoldFireTime > 350) { // 0.15초 간격으로 발사
            handleInput(currentPointerX, currentPointerY);
            lastHoldFireTime = currentTime;
        }
    }

    let i = fireworks.length;
    while (i--) {
        fireworks[i].draw();
        fireworks[i].update(i);
    }

    let j = particles.length;
    while (j--) {
        particles[j].draw();
        particles[j].update(j);
    }
    
    if (!isInteracting && (currentTime - lastInteractionTime > 2000) && Math.random() < 0.04) {
        const x = Math.random() * width;
        fireworks.push(new Firework(width / 2, height, x, Math.random() * (height / 2)));
    }
}

function handleInput(x, y) {
    fireworks.push(new Firework(width / 2, height, x, y));
}

function manualFirework() {
    lastInteractionTime = Date.now();
    for(let i=0; i<3; i++) {
        setTimeout(() => {
            const x = Math.random() * width;
            const y = Math.random() * (height / 2);
            fireworks.push(new Firework(width / 2, height, x, y));
        }, i * 250);
    }
}

window.addEventListener('mousedown', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    isInteracting = true;
    lastInteractionTime = Date.now();
    currentPointerX = e.clientX;
    currentPointerY = e.clientY;
    handleInput(currentPointerX, currentPointerY);
});

window.addEventListener('mousemove', (e) => {
    if (isInteracting) {
        currentPointerX = e.clientX;
        currentPointerY = e.clientY;
        lastInteractionTime = Date.now();
    }
});

window.addEventListener('mouseup', () => {
    isInteracting = false;
    lastInteractionTime = Date.now();
});

window.addEventListener('touchstart', (e) => {
    if (e.target.tagName === 'BUTTON') return;
    isInteracting = true;
    lastInteractionTime = Date.now();
    const touch = e.touches[0];
    currentPointerX = touch.clientX;
    currentPointerY = touch.clientY;
    handleInput(currentPointerX, currentPointerY);
}, { passive: true });

window.addEventListener('touchmove', (e) => {
    if (isInteracting) {
        const touch = e.touches[0];
        currentPointerX = touch.clientX;
        currentPointerY = touch.clientY;
        lastInteractionTime = Date.now();
    }
}, { passive: true });

window.addEventListener('touchend', () => {
    isInteracting = false;
    lastInteractionTime = Date.now();
});

window.onload = loop;