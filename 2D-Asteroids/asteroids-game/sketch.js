let spaceShip;
let redBalls = [];
let asteroids = [];
let isGameOver = false;
let score = 0;
let initial_lives = 2;
let lives = initial_lives; // Número inicial de vidas
let asteroidSpawnInterval = 800; // Intervalo de aparición de asteroides en milisegundos (8 segundos)
let lastAsteroidSpawnTime = 0;
const minDistanceFromShip = 100; // Distancia mínima desde la nave para generar un asteroide
const minAsteroidSize = 15; // Tamaño mínimo de los asteroides
let hit = false; // Indicador de que la nave fue golpeada
let hitStartTime = 0; // Tiempo en que la nave fue golpeada
const hitDuration = 1000; // Duración del indicador visual en milisegundos

let shootSound, explosionSound, hitSound, lossLiveSound, gameOverSound;

function preload() {
  // Carga los sonidos
  shootSound = loadSound('audio/shoot.wav');
  hitSound = loadSound('audio/hit.wav');
  lossLiveSound = loadSound('audio/loss_live.wav');
  gameOverSound = loadSound('audio/gameover.mp3');
}

function setup() {
  createCanvas(800, 800);
  startGame();
}

function draw() {
  background(0);

  if (!isGameOver) {
    spaceShip.lookAt(mouseX, mouseY);
    spaceShip.display();

    for (let i = redBalls.length - 1; i >= 0; i--) {
      redBalls[i].update();
      redBalls[i].display();

      for (let j = asteroids.length - 1; j >= 0; j--) {
        if (redBalls[i].hits(asteroids[j])) {
          if (asteroids[j].radius > minAsteroidSize * 2) {
            let newAsteroids = asteroids[j].breakup();
            asteroids = asteroids.concat(newAsteroids);
          }
          hitSound.play();
          asteroids.splice(j, 1);
          redBalls.splice(i, 1);
          score += 10; // Aumentar la puntuación cuando un asteroide es destruido
          break;
        }
      }
    }

    for (let i = asteroids.length - 1; i >= 0; i--) {
      asteroids[i].update();
      asteroids[i].display();

      if (spaceShip.hits(asteroids[i])) {
        lives--;
        hit = true;
        hitStartTime = millis();
        hitSound.play();
        if (lives > 0) {
          lossLiveSound.play();
        }
        asteroids.splice(i, 1);
        if (lives <= 0) {
          isGameOver = true;
          gameOverSound.play();
        }
      }
    }

    if (millis() - lastAsteroidSpawnTime > asteroidSpawnInterval) {
      asteroids.push(new Asteroid(true));
      lastAsteroidSpawnTime = millis();
    }

    displayScore();
    displayLives();
  } else {
    fill(255, 0, 0);
    textSize(32);
    textAlign(CENTER, CENTER);
    text("Game Over", width / 2, height / 2);
    textSize(16);
    text("Score: " + score, width / 2, height / 2 + 40);
    text("Click to Restart", width / 2, height / 2 + 70);
  }

  if (hit && millis() - hitStartTime < hitDuration) {
    drawHitEffect();
  } else {
    hit = false;
  }
}

function drawHitEffect() {
  push();
  noFill();
  stroke(255, 0, 0);
  strokeWeight(4);
  translate(spaceShip.position.x, spaceShip.position.y);
  rotate(spaceShip.angle + HALF_PI);
  beginShape();
  vertex(-spaceShip.size, spaceShip.size);
  vertex(spaceShip.size, spaceShip.size);
  vertex(0, -spaceShip.size * 1.5); // Hacer el triángulo un poco más alto
  endShape(CLOSE);
  pop();
}

function mousePressed() {
  if (isGameOver) {
    startGame();
  } else {
    redBalls.push(spaceShip.shoot());
    shootSound.play();
  }
}

function startGame() {
  isGameOver = false;
  score = 0;
  lives = initial_lives; // Reiniciar vidas
  spaceShip = new SpaceShip(width / 2, height / 2, 15); // positionX, positionY, size
  redBalls = [];
  asteroids = [];
  lastAsteroidSpawnTime = millis();
  
  // Crear asteroides iniciales
  for (let i = 0; i < 5; i++) {
    asteroids.push(new Asteroid(true));
  }
}

function displayScore() {
  fill(255);
  textSize(24);
  textAlign(LEFT, TOP);
  text("Score: " + score, 10, 10);
}

function displayLives() {
  fill(255);
  textSize(24);
  textAlign(RIGHT, TOP);
  text("Lives: " + lives, width - 10, 10);
}

class SpaceShip {
  constructor(x, y, size) {
    this.position = createVector(x, y);
    this.size = size;
    this.angle = 0;
  }

  lookAt(targetX, targetY) {
    this.angle = atan2(targetY - this.position.y, targetX - this.position.x);
  }

  display() {
    fill(0, 255, 0);
    push();
    translate(this.position.x, this.position.y);
    rotate(this.angle + HALF_PI);
    beginShape();
    vertex(-this.size, this.size);
    vertex(this.size, this.size);
    vertex(0, -this.size * 1.5); // Hacer el triángulo un poco más alto
    endShape(CLOSE);

    // Detalles adicionales
    line(0, -this.size * 1.5, 0, this.size); // Línea central
    line(-this.size / 2, this.size / 2, this.size / 2, this.size / 2); // Línea horizontal
    pop();
  }

  shoot() {
    return new RedBall(this.position.x, this.position.y, this.angle, 5);
  }

  hits(asteroid) {
    let d = dist(this.position.x, this.position.y, asteroid.position.x, asteroid.position.y);
    return d < this.size + asteroid.radius;
  }
}

class RedBall {
  constructor(x, y, angle, speed) {
    this.position = createVector(x, y);
    this.velocity = p5.Vector.fromAngle(angle).mult(speed);
    this.radius = 5;
  }

  update() {
    this.position.add(this.velocity);
    return this.isOffScreen();
  }

  display() {
    fill(255, 0, 0);
    ellipse(this.position.x, this.position.y, this.radius * 2);
  }

  isOffScreen() {
    return (
      this.position.x < -this.radius ||
      this.position.x > width + this.radius ||
      this.position.y < -this.radius ||
      this.position.y > height + this.radius
    );
  }

  hits(asteroid) {
    let d = dist(this.position.x, this.position.y, asteroid.position.x, asteroid.position.y);
    return d < this.radius + asteroid.radius;
  }
}

class Asteroid {
  constructor(initialSpawn = false, pos, r) {
    if (initialSpawn) {
      do {
        this.position = createVector(random(width), random(height));
      } while (dist(this.position.x, this.position.y, spaceShip.position.x, spaceShip.position.y) < minDistanceFromShip);
    } else if (pos) {
      this.position = pos.copy();
    } else {
      this.position = createVector(random(width), random(height));
    }

    if (r) {
      this.radius = r * 0.5;
    } else {
      this.radius = random(15, 50);
    }
    this.velocity = p5.Vector.random2D();
    this.total = floor(random(5, 15));
    this.offset = [];
    for (let i = 0; i < this.total; i++) {
      this.offset[i] = random(-this.radius * 0.5, this.radius * 0.5);
    }
  }

  update() {
    this.position.add(this.velocity);
    this.edges();
  }

  display() {
    push();
    stroke(255);
    noFill();
    translate(this.position.x, this.position.y);
    beginShape();
    for (let i = 0; i < this.total; i++) {
      let angle = map(i, 0, this.total, 0, TWO_PI);
      let r = this.radius + this.offset[i];
      let x = r * cos(angle);
      let y = r * sin(angle);
      vertex(x, y);
    }
    endShape(CLOSE);
    pop();
  }

  edges() {
    if (this.position.x > width + this.radius) {
      this.position.x = -this.radius;
    } else if (this.position.x < -this.radius) {
      this.position.x = width + this.radius;
    }
    if (this.position.y > height + this.radius) {
      this.position.y = -this.radius;
    } else if (this.position.y < -this.radius) {
      this.position.y = height + this.radius;
    }
  }

  breakup() {
    let newA = [];
    if (this.radius > minAsteroidSize * 2) {
      newA[0] = new Asteroid(false, this.position, this.radius);
      newA[1] = new Asteroid(false, this.position, this.radius);
    }
    return newA;
  }
}
