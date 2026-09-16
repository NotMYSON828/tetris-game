// Game constants
const COLS = 10;
const ROWS = 20;
const BLOCK_SIZE = 30;

// Tetris pieces (tetrominoes)
const PIECES = {
    I: {
        shape: [[1, 1, 1, 1]],
        color: '#00ffff'
    },
    O: {
        shape: [[1, 1], [1, 1]],
        color: '#ffff00'
    },
    T: {
        shape: [[0, 1, 0], [1, 1, 1]],
        color: '#ff00ff'
    },
    S: {
        shape: [[0, 1, 1], [1, 1, 0]],
        color: '#00ff00'
    },
    Z: {
        shape: [[1, 1, 0], [0, 1, 1]],
        color: '#ff0000'
    },
    J: {
        shape: [[1, 0, 0], [1, 1, 1]],
        color: '#0000ff'
    },
    L: {
        shape: [[0, 0, 1], [1, 1, 1]],
        color: '#ff8800'
    }
};

class TetrisGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.nextCanvas = document.getElementById('nextCanvas');
        this.nextCtx = this.nextCanvas.getContext('2d');
        
        this.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        
        this.currentPiece = null;
        this.nextPiece = null;
        this.dropCounter = 0;
        this.dropInterval = 1000;
        this.lastDropTime = Date.now();
        
        this.setupEventListeners();
        this.nextPiece = this.getRandomPiece();
        this.spawnNewPiece();
        this.draw();
    }

    setupEventListeners() {
        document.getElementById('startBtn').addEventListener('click', () => this.start());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.reset());
        
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    handleKeyPress(e) {
        if (!this.gameRunning || this.gamePaused) return;
        
        switch(e.key) {
            case 'ArrowLeft':
                e.preventDefault();
                this.movePiece(-1);
                break;
            case 'ArrowRight':
                e.preventDefault();
                this.movePiece(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                this.rotatePiece();
                break;
            case 'ArrowDown':
                e.preventDefault();
                this.softDrop();
                break;
            case ' ':
                e.preventDefault();
                this.hardDrop();
                break;
        }
    }

    getRandomPiece() {
        const pieces = Object.keys(PIECES);
        const randomType = pieces[Math.floor(Math.random() * pieces.length)];
        const piece = PIECES[randomType];
        return {
            type: randomType,
            shape: piece.shape.map(row => [...row]),
            color: piece.color,
            x: Math.floor(COLS / 2) - Math.ceil(piece.shape[0].length / 2),
            y: 0
        };
    }

    spawnNewPiece() {
        this.currentPiece = this.nextPiece;
        this.nextPiece = this.getRandomPiece();
        
        if (this.collides(this.currentPiece.x, this.currentPiece.y)) {
            this.gameOver();
        }
    }

    movePiece(direction) {
        const newX = this.currentPiece.x + direction;
        if (!this.collides(newX, this.currentPiece.y)) {
            this.currentPiece.x = newX;
        }
    }

    rotatePiece() {
        const rotated = this.rotatePieceClockwise(this.currentPiece.shape);
        const originalShape = this.currentPiece.shape;
        this.currentPiece.shape = rotated;
        
        // Wall kick: try to adjust position if rotation collides
        for (let offset = 0; offset <= 2; offset++) {
            if (!this.collides(this.currentPiece.x - offset, this.currentPiece.y)) {
                this.currentPiece.x -= offset;
                return;
            }
            if (!this.collides(this.currentPiece.x + offset, this.currentPiece.y)) {
                this.currentPiece.x += offset;
                return;
            }
        }
        
        this.currentPiece.shape = originalShape;
    }

    rotatePieceClockwise(shape) {
        const rows = shape.length;
        const cols = shape[0].length;
        const rotated = Array(cols).fill(null).map(() => Array(rows).fill(0));
        
        for (let y = 0; y < rows; y++) {
            for (let x = 0; x < cols; x++) {
                rotated[x][rows - 1 - y] = shape[y][x];
            }
        }
        
        return rotated;
    }

    softDrop() {
        if (!this.collides(this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
            this.score += 1;
        } else {
            this.placePiece();
        }
    }

    hardDrop() {
        while (!this.collides(this.currentPiece.x, this.currentPiece.y + 1)) {
            this.currentPiece.y++;
            this.score += 2;
        }
        this.placePiece();
    }

    collides(x, y) {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const newX = x + col;
                    const newY = y + row;
                    
                    if (newX < 0 || newX >= COLS || newY >= ROWS) {
                        return true;
                    }
                    
                    if (newY >= 0 && this.grid[newY][newX]) {
                        return true;
                    }
                }
            }
        }
        return false;
    }

    placePiece() {
        for (let row = 0; row < this.currentPiece.shape.length; row++) {
            for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                if (this.currentPiece.shape[row][col]) {
                    const newX = this.currentPiece.x + col;
                    const newY = this.currentPiece.y + row;
                    
                    if (newY >= 0) {
                        this.grid[newY][newX] = this.currentPiece.color;
                    }
                }
            }
        }
        
        this.clearLines();
        this.spawnNewPiece();
    }

    clearLines() {
        let linesCleared = 0;
        
        for (let row = ROWS - 1; row >= 0; row--) {
            if (this.grid[row].every(cell => cell !== 0)) {
                this.grid.splice(row, 1);
                this.grid.unshift(Array(COLS).fill(0));
                linesCleared++;
                row++;
            }
        }
        
        if (linesCleared > 0) {
            this.lines += linesCleared;
            
            // Scoring: standard Tetris scoring
            const scoreMap = {1: 100, 2: 300, 3: 500, 4: 800};
            this.score += (scoreMap[linesCleared] || 0) * this.level;
            
            // Level up every 10 lines
            const newLevel = Math.floor(this.lines / 10) + 1;
            if (newLevel > this.level) {
                this.level = newLevel;
                this.dropInterval = Math.max(100, 1000 - (this.level - 1) * 100);
            }
            
            this.updateStats();
        }
    }

    update() {
        if (!this.gameRunning || this.gamePaused) return;
        
        const now = Date.now();
        const elapsed = now - this.lastDropTime;
        
        if (elapsed > this.dropInterval) {
            if (!this.collides(this.currentPiece.x, this.currentPiece.y + 1)) {
                this.currentPiece.y++;
            } else {
                this.placePiece();
            }
            this.lastDropTime = now;
        }
    }

    draw() {
        // Clear canvas
        this.ctx.fillStyle = '#0a0a0a';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw grid
        this.ctx.strokeStyle = '#333';
        this.ctx.lineWidth = 0.5;
        for (let row = 0; row <= ROWS; row++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, row * BLOCK_SIZE);
            this.ctx.lineTo(COLS * BLOCK_SIZE, row * BLOCK_SIZE);
            this.ctx.stroke();
        }
        for (let col = 0; col <= COLS; col++) {
            this.ctx.beginPath();
            this.ctx.moveTo(col * BLOCK_SIZE, 0);
            this.ctx.lineTo(col * BLOCK_SIZE, ROWS * BLOCK_SIZE);
            this.ctx.stroke();
        }
        
        // Draw placed blocks
        for (let row = 0; row < ROWS; row++) {
            for (let col = 0; col < COLS; col++) {
                if (this.grid[row][col]) {
                    this.drawBlock(col, row, this.grid[row][col]);
                }
            }
        }
        
        // Draw current piece
        if (this.currentPiece) {
            for (let row = 0; row < this.currentPiece.shape.length; row++) {
                for (let col = 0; col < this.currentPiece.shape[row].length; col++) {
                    if (this.currentPiece.shape[row][col]) {
                        this.drawBlock(
                            this.currentPiece.x + col,
                            this.currentPiece.y + row,
                            this.currentPiece.color
                        );
                    }
                }
            }
        }
        
        this.drawNextPiece();
    }

    drawBlock(x, y, color) {
        this.ctx.fillStyle = color;
        this.ctx.fillRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 1;
        this.ctx.strokeRect(x * BLOCK_SIZE, y * BLOCK_SIZE, BLOCK_SIZE, BLOCK_SIZE);
    }

    drawNextPiece() {
        this.nextCtx.fillStyle = '#0a0a0a';
        this.nextCtx.fillRect(0, 0, this.nextCanvas.width, this.nextCanvas.height);
        
        const nextBlockSize = 25;
        const offsetX = (this.nextCanvas.width - this.nextPiece.shape[0].length * nextBlockSize) / 2;
        const offsetY = (this.nextCanvas.height - this.nextPiece.shape.length * nextBlockSize) / 2;
        
        for (let row = 0; row < this.nextPiece.shape.length; row++) {
            for (let col = 0; col < this.nextPiece.shape[row].length; col++) {
                if (this.nextPiece.shape[row][col]) {
                    this.nextCtx.fillStyle = this.nextPiece.color;
                    this.nextCtx.fillRect(
                        offsetX + col * nextBlockSize,
                        offsetY + row * nextBlockSize,
                        nextBlockSize,
                        nextBlockSize
                    );
                    
                    this.nextCtx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                    this.nextCtx.lineWidth = 0.5;
                    this.nextCtx.strokeRect(
                        offsetX + col * nextBlockSize,
                        offsetY + row * nextBlockSize,
                        nextBlockSize,
                        nextBlockSize
                    );
                }
            }
        }
    }

    updateStats() {
        document.getElementById('score').textContent = this.score;
        document.getElementById('lines').textContent = this.lines;
        document.getElementById('level').textContent = this.level;
    }

    start() {
        this.gameRunning = true;
        this.gamePaused = false;
        document.getElementById('startBtn').disabled = true;
        document.getElementById('pauseBtn').disabled = false;
        this.lastDropTime = Date.now();
    }

    togglePause() {
        if (!this.gameRunning) return;
        
        this.gamePaused = !this.gamePaused;
        document.getElementById('pauseBtn').textContent = this.gamePaused ? 'RESUME' : 'PAUSE';
    }

    reset() {
        this.grid = Array(ROWS).fill(null).map(() => Array(COLS).fill(0));
        this.score = 0;
        this.lines = 0;
        this.level = 1;
        this.gameRunning = false;
        this.gamePaused = false;
        this.dropInterval = 1000;
        
        document.getElementById('startBtn').disabled = false;
        document.getElementById('pauseBtn').disabled = true;
        document.getElementById('pauseBtn').textContent = 'PAUSE';
        
        this.nextPiece = this.getRandomPiece();
        this.spawnNewPiece();
        this.updateStats();
        this.draw();
    }

    gameOver() {
        this.gameRunning = false;
        alert(`Game Over!\nFinal Score: ${this.score}\nLines: ${this.lines}\nLevel: ${this.level}`);
        this.reset();
    }

    gameLoop() {
        this.update();
        this.draw();
        requestAnimationFrame(() => this.gameLoop());
    }
}

// Initialize game
const game = new TetrisGame();
game.gameLoop();
