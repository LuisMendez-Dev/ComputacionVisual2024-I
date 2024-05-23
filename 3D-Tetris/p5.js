let blockWidth = 30;
let shapes = [];
let currentShapeIndex = 0;
let fallInterval = 500; // Velocidad de caída
let lastFallTime = 0;
let lastShapeIndex = -1;
let score = 0;
let level = 1;

let gameSpace = [];
const spaceWidth = 10;
const spaceHeight = 20;
const spaceDepth = 10;

let overlay;
let gameOver = false;

function setup() {
    createCanvas(600, 600, WEBGL);
    frameRate(30);
    initGameSpace();
    initializeTetrominos();
    generateNewTetromino();
    
    overlay = createGraphics(600, 600);
}

function initializeTetrominos() {
    shapes.push(new TetrominoI());
    shapes.push(new TetrominoJ());
    shapes.push(new TetrominoL());
    shapes.push(new TetrominoO());
    shapes.push(new TetrominoS());
    shapes.push(new TetrominoT());
    shapes.push(new TetrominoZ());
}

function generateNewTetromino() {
    let newIndex;
    do {
        newIndex = floor(random(shapes.length));
    } while (newIndex === lastShapeIndex);

    currentShapeIndex = newIndex;
    lastShapeIndex = newIndex;

    if (shapes[currentShapeIndex]) {
        shapes[currentShapeIndex].resetPosition();
        // Posicionar la pieza en la parte superior del perímetro
        shapes[currentShapeIndex].blocks.forEach(block => {
            block.y -= (spaceHeight/2) * blockWidth; // Restar la altura del espacio menos 3 para estar en la parte superior
        });
    } else {
        console.error('Tetromino no definido en el índice: ', currentShapeIndex);
    }
}

function draw() {
    if (gameOver) {
        background(0);
        overlay.clear();
        overlay.fill(255, 0, 0);
        overlay.textSize(40);
        overlay.textAlign(CENTER, CENTER);
        overlay.text('Game Over', width / 2, height / 2);
        image(overlay, -width / 2, -height / 2);
        return;
    }

    background(0); // Fondo negro
    orbitControl();
    displayGameSpace();
    shapes[currentShapeIndex].display();

    if (millis() - lastFallTime > fallInterval) {
        if (canMove(currentShapeIndex, 0, 1, 0)) {
            moveShape(currentShapeIndex, 0, 1, 0);
        } else {
            fixShapeInPlace();
            generateNewTetromino();
        }
        lastFallTime = millis();
    }

    // Draw the 2D overlay
    drawOverlay();
    image(overlay, -width / 2, -height / 2);
}

function initGameSpace() {
    for (let i = 0; i < spaceWidth; i++) {
        gameSpace[i] = [];
        for (let j = 0; j < spaceHeight; j++) {
            gameSpace[i][j] = [];
            for (let k = 0; k < spaceDepth; k++) {
                gameSpace[i][j][k] = 0;
            }
        }
    }
}

function displayGameSpace() {
    for (let i = 0; i < spaceWidth; i++) {
        for (let j = 1; j < spaceHeight; j++) {
            for (let k = 0; k < spaceDepth; k++) {
                if (i === 0 || i === spaceWidth - 1 || j === 0 || j === spaceHeight - 1 || k === 0 || k === spaceDepth - 1) {
                    push();
                    translate(i * blockWidth - (spaceWidth / 2) * blockWidth, 
                              j * blockWidth - (spaceHeight / 2) * blockWidth, 
                              k * blockWidth - (spaceDepth / 2) * blockWidth);
                    noFill();
                    stroke(255); // Color blanco para el perímetro
                    // Draw square planes instead of boxes
                    if (i === 0 || i === spaceWidth - 1) {
                        rotateY(HALF_PI);
                        plane(blockWidth, blockWidth);
                    } else if (j === 0 || j === spaceHeight - 1) {
                        rotateX(HALF_PI);
                        plane(blockWidth, blockWidth);
                    } else if (k === 0 || k === spaceDepth - 1) {
                        plane(blockWidth, blockWidth);
                    }
                    pop();
                } else if (gameSpace[i][j][k] === 1) {
                    push();
                    translate(i * blockWidth - (spaceWidth / 2) * blockWidth, 
                              j * blockWidth - (spaceHeight / 2) * blockWidth, 
                              k * blockWidth - (spaceDepth / 2) * blockWidth);
                    fill(0, 0, 255); // Color azul para piezas bloqueadas
                    noStroke();
                    box(blockWidth);
                    pop();
                }
            }
        }
    }
}

function fixShapeInPlace() {
    const shape = shapes[currentShapeIndex];
    for (let block of shape.blocks) {
        let x = Math.floor(block.x / blockWidth + spaceWidth / 2);
        let y = Math.floor(block.y / blockWidth + spaceHeight / 2);
        let z = Math.floor(block.z / blockWidth + spaceDepth / 2);
        if (x >= 0 && x < spaceWidth && y >= 0 && y < spaceHeight && z >= 0 && z < spaceDepth) {
            gameSpace[x][y][z] = 1; // Marcar el espacio como ocupado
        }
    }
    if (isGameOver()) {
        gameOver = true;
        return;
    }
    checkForCompleteRows(); // Verificar filas completas
    score += 10; // Incrementar la puntuación por cada tetromino fijado
    generateNewTetromino(); // Generar una nueva pieza
    updateLevelAndSpeed(); // Actualizar el nivel y la velocidad
}

function checkForCompleteRows() {
    for (let y = 0; y < spaceHeight; y++) {
        let complete = true;
        for (let x = 0; x < spaceWidth; x++) {
            for (let z = 0; z < spaceDepth; z++) {
                if (gameSpace[x][y][z] === 0) {
                    complete = false;
                    break;
                }
            }
            if (!complete) break;
        }
        if (complete) {
            removeRow(y);
            score += 100; // Incrementar la puntuación por fila eliminada
        }
    }
}

function removeRow(row) {
    for (let y = row; y > 0; y--) {
        for (let x = 0; x < spaceWidth; x++) {
            for (let z = 0; z < spaceDepth; z++) {
                gameSpace[x][y][z] = gameSpace[x][y - 1][z];
            }
        }
    }
    for (let x = 0; x < spaceWidth; x++) {
        for (let z = 0; z < spaceDepth; z++) {
            gameSpace[x][0][z] = 0;
        }
    }
}

function updateLevelAndSpeed() {
    level = Math.floor(score / 1000) + 1;
    fallInterval = 500 - (level - 1) * 50;
    if (fallInterval < 100) fallInterval = 100; // Límite de velocidad
}

function drawOverlay() {
    overlay.clear();
    overlay.fill(255);
    overlay.textSize(20);
    overlay.text('Score: ' + score, 20, 40);
    overlay.text('Level: ' + level, 20, 70);
}

function keyPressed() {
    if (gameOver) return;

    if (keyCode === LEFT_ARROW) {
        if (canMove(currentShapeIndex, -1, 0, 0)) {
            moveShape(currentShapeIndex, -1, 0, 0);
        }
    } else if (keyCode === RIGHT_ARROW) {
        if (canMove(currentShapeIndex, 1, 0, 0)) {
            moveShape(currentShapeIndex, 1, 0, 0);
        }
    } else if (keyCode === DOWN_ARROW) {
        if (canMove(currentShapeIndex, 0, 0, 1)) {
            moveShape(currentShapeIndex, 0, 0, 1);
        }
    } else if (keyCode === UP_ARROW) {
        if (canMove(currentShapeIndex, 0, 0, -1)) {
            moveShape(currentShapeIndex, 0, 0, -1);
        }
    } else if (key === 'z' || key === 'Z') {
        rotateShape(currentShapeIndex, 'Z');
    } else if (key === 'x' || key === 'X') {
        rotateShape(currentShapeIndex, 'X');
    } else if (key === 'c' || key === 'C') {
        rotateShape(currentShapeIndex, 'Y');
    } else if (keyCode === 32) { // Barra espaciadora
        dropShapeFast(currentShapeIndex);
    }
}

function rotateShape(shapeIndex, axis) {
    const shape = shapes[shapeIndex];
    shape.rotate(axis);

    if (!canMove(shapeIndex, 0, 0, 0)) {
        shape.rotate(axis, false); // Deshacer la rotación si no es válida
    }
}

function canMove(shapeIndex, offsetX, offsetY, offsetZ) {
    const shape = shapes[shapeIndex];
    for (let block of shape.blocks) {
        let x = Math.floor((block.x + offsetX * blockWidth) / blockWidth + spaceWidth / 2);
        let y = Math.floor((block.y + offsetY * blockWidth) / blockWidth + spaceHeight / 2);
        let z = Math.floor((block.z + offsetZ * blockWidth) / blockWidth + spaceDepth / 2);
        if (x < 0 || x >= spaceWidth || y < 0 || y >= spaceHeight || z < 0 || z >= spaceDepth) {
            return false;
        }
        if (gameSpace[x][y][z] === 1) {
            return false;
        }
    }
    return true;
}

function moveShape(shapeIndex, offsetX, offsetY, offsetZ) {
    shapes[shapeIndex].blocks.forEach(block => {
        block.x += offsetX * blockWidth;
        block.y += offsetY * blockWidth;
        block.z += offsetZ * blockWidth;
    });
}

function dropShapeFast(shapeIndex) {
    while (canMove(shapeIndex, 0, 1, 0)) {
        moveShape(shapeIndex, 0, 1, 0);
    }
    fixShapeInPlace();
}

function isGameOver() {
    const shape = shapes[currentShapeIndex];
    for (let block of shape.blocks) {
        let y = Math.floor(block.y / blockWidth + spaceHeight / 2);
        if (y <= 0) {
            return true;
        }
    }
    return false;
}

class Tetromino {
    constructor() {
        this.blocks = [];
    }
    display() {
        for (let block of this.blocks) {
            push();
            translate(block.x, block.y, block.z);
            fill(255, 0, 0);
            noStroke();
            box(blockWidth);
            pop();
        }
    }
    resetPosition() {
        // Para ser implementado en subclases
    }
    rotate(axis) {
        // Para ser implementado en subclases
    }
}

// Clases específicas para cada Tetromino...

function createBlock(x, y, z) {
    return { x: x * blockWidth, y: y * blockWidth, z: z * blockWidth };
}

class TetrominoI extends Tetromino {
    constructor() {
        super();
        this.blocks = [createBlock(0, 0, 0), createBlock(0, 1, 0), createBlock(0, 2, 0), createBlock(0, 3, 0)];
    }
    resetPosition() {
        this.blocks = [createBlock(0, 0, 0), createBlock(0, 1, 0), createBlock(0, 2, 0), createBlock(0, 3, 0)];
    }
    rotate(axis) {
        if (axis === 'X') {
            this.blocks = this.blocks.map(block => {
                return createBlock(block.x / blockWidth, block.z / blockWidth, -block.y / blockWidth);
            });
        } else if (axis === 'Y') {
            this.blocks = this.blocks.map(block => {
                return createBlock(-block.z / blockWidth, block.y / blockWidth, block.x / blockWidth);
            });
        } else if (axis === 'Z') {
            this.blocks = this.blocks.map(block => {
                return createBlock(-block.y / blockWidth, block.x / blockWidth, block.z / blockWidth);
            });
        }
    }
}

class TetrominoJ extends Tetromino {
    constructor() {
        super();
        this.blocks = [createBlock(0, 0, 0), createBlock(0, 1, 0), createBlock(0, 2, 0), createBlock(-1, 2, 0)];
    }
    resetPosition() {
        this.blocks = [createBlock(0, 0, 0), createBlock(0, 1, 0), createBlock(0, 2, 0), createBlock(-1, 2, 0)];
    }
    rotate(axis) {
        if (axis === 'X') {
            this.blocks = this.blocks.map(block => createBlock(block.x / blockWidth, block.z / blockWidth, -block.y / blockWidth));
        } else if (axis === 'Y') {
            this.blocks = this.blocks.map(block => createBlock(-block.z / blockWidth, block.y / blockWidth, block.x / blockWidth));
        } else if (axis === 'Z') {
            this.blocks = this.blocks.map(block => createBlock(-block.y / blockWidth, block.x / blockWidth, block.z / blockWidth));
        }
    }
}

class TetrominoL extends Tetromino {
    constructor() {
        super();
        this.blocks = [createBlock(0, 0, 0), createBlock(0, 1, 0), createBlock(0, 2, 0), createBlock(1, 2, 0)];
    }
    resetPosition() {
        this.blocks = [createBlock(0, 0, 0), createBlock(0, 1, 0), createBlock(0, 2, 0), createBlock(1, 2, 0)];
    }
    rotate(axis) {
        if (axis === 'X') {
            this.blocks = this.blocks.map(block => createBlock(block.x / blockWidth, block.z / blockWidth, -block.y / blockWidth));
        } else if (axis === 'Y') {
            this.blocks = this.blocks.map(block => createBlock(-block.z / blockWidth, block.y / blockWidth, block.x / blockWidth));
        } else if (axis === 'Z') {
            this.blocks = this.blocks.map(block => createBlock(-block.y / blockWidth, block.x / blockWidth, block.z / blockWidth));
        }
    }
}

class TetrominoO extends Tetromino {
    constructor() {
        super();
        this.blocks = [createBlock(0, 0, 0), createBlock(1, 0, 0), createBlock(0, 1, 0), createBlock(1, 1, 0)];
    }
    resetPosition() {
        this.blocks = [createBlock(0, 0, 0), createBlock(1, 0, 0), createBlock(0, 1, 0), createBlock(1, 1, 0)];
    }
    rotate(axis) {
        // Tetromino O no necesita rotar
    }
}

class TetrominoS extends Tetromino {
    constructor() {
        super();
        this.blocks = [createBlock(0, 0, 0), createBlock(1, 0, 0), createBlock(-1, 1, 0), createBlock(0, 1, 0)];
    }
    resetPosition() {
        this.blocks = [createBlock(0, 0, 0), createBlock(1, 0, 0), createBlock(-1, 1, 0), createBlock(0, 1, 0)];
    }
    rotate(axis) {
        if (axis === 'X') {
            this.blocks = this.blocks.map(block => createBlock(block.x / blockWidth, block.z / blockWidth, -block.y / blockWidth));
        } else if (axis === 'Y') {
            this.blocks = this.blocks.map(block => createBlock(-block.z / blockWidth, block.y / blockWidth, block.x / blockWidth));
        } else if (axis === 'Z') {
            this.blocks = this.blocks.map(block => createBlock(-block.y / blockWidth, block.x / blockWidth, block.z / blockWidth));
        }
    }
}

class TetrominoT extends Tetromino {
    constructor() {
        super();
        this.blocks = [createBlock(0, 0, 0), createBlock(-1, 1, 0), createBlock(0, 1, 0), createBlock(1, 1, 0)];
    }
    resetPosition() {
        this.blocks = [createBlock(0, 0, 0), createBlock(-1, 1, 0), createBlock(0, 1, 0), createBlock(1, 1, 0)];
    }
    rotate(axis) {
        if (axis === 'X') {
            this.blocks = this.blocks.map(block => createBlock(block.x / blockWidth, block.z / blockWidth, -block.y / blockWidth));
        } else if (axis === 'Y') {
            this.blocks = this.blocks.map(block => createBlock(-block.z / blockWidth, block.y / blockWidth, block.x / blockWidth));
        } else if (axis === 'Z') {
            this.blocks = this.blocks.map(block => createBlock(-block.y / blockWidth, block.x / blockWidth, block.z / blockWidth));
        }
    }
}

class TetrominoZ extends Tetromino {
    constructor() {
        super();
        this.blocks = [createBlock(0, 0, 0), createBlock(-1, 0, 0), createBlock(0, 1, 0), createBlock(1, 1, 0)];
    }
    resetPosition() {
        this.blocks = [createBlock(0, 0, 0), createBlock(-1, 0, 0), createBlock(0, 1, 0), createBlock(1, 1, 0)];
    }
    rotate(axis) {
        if (axis === 'X') {
            this.blocks = this.blocks.map(block => createBlock(block.x / blockWidth, block.z / blockWidth, -block.y / blockWidth));
        } else if (axis === 'Y') {
            this.blocks = this.blocks.map(block => createBlock(-block.z / blockWidth, block.y / blockWidth, block.x / blockWidth));
        } else if (axis === 'Z') {
            this.blocks = this.blocks.map(block => createBlock(-block.y / blockWidth, block.x / blockWidth, block.z / blockWidth));
        }
    }
}

setup();
