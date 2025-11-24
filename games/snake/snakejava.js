const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

const box = 20; // size of one block
let snake = [{ x: 9 * box, y: 10 * box }];
let direction;
let food = randomFood();
let score = 0;
let gameOver = false;

document.addEventListener("keydown", setDirection);

function setDirection(event) {
  if (event.key === "ArrowLeft" && direction !== "RIGHT") direction = "LEFT";
  else if (event.key === "ArrowUp" && direction !== "DOWN") direction = "UP";
  else if (event.key === "ArrowRight" && direction !== "LEFT") direction = "RIGHT";
  else if (event.key === "ArrowDown" && direction !== "UP") direction = "DOWN";
}

function randomFood() {
  return {
    x: Math.floor(Math.random() * 20) * box,
    y: Math.floor(Math.random() * 20) * box
  };
}

function draw() {
  if (gameOver) return;

  // Glowing background effect
  ctx.fillStyle = "rgba(0, 0, 0, 0.3)";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw food (apple)
  ctx.beginPath();
  ctx.arc(food.x + box / 2, food.y + box / 2, box / 2 - 2, 0, Math.PI * 2);
  ctx.fillStyle = "#ff3333";
  ctx.shadowColor = "#ff0000";
  ctx.shadowBlur = 20;
  ctx.fill();
  ctx.closePath();

  // Draw snake
  for (let i = 0; i < snake.length; i++) {
    ctx.fillStyle = i === 0 ? "#00ffff" : "#39ff14";
    ctx.shadowColor = i === 0 ? "#00ffff" : "#39ff14";
    ctx.shadowBlur = 15;
    ctx.fillRect(snake[i].x, snake[i].y, box, box);
  }

  // old head position
  let snakeX = snake[0].x;
  let snakeY = snake[0].y;

  if (direction === "LEFT") snakeX -= box;
  if (direction === "UP") snakeY -= box;
  if (direction === "RIGHT") snakeX += box;
  if (direction === "DOWN") snakeY += box;

  // Check collision with walls
  if (snakeX < 0 || snakeY < 0 || snakeX >= canvas.width || snakeY >= canvas.height) {
    endGame();
    return;
  }

  // Check if snake eats the food
  if (snakeX === food.x && snakeY === food.y) {
    score++;
    food = randomFood();
  } else {
    snake.pop(); // remove tail
  }

  let newHead = { x: snakeX, y: snakeY };

  // Check if snake collides with itself
  for (let segment of snake) {
    if (newHead.x === segment.x && newHead.y === segment.y) {
      endGame();
      return;
    }
  }

  snake.unshift(newHead);

  // Draw Score
  ctx.shadowBlur = 0;
  ctx.fillStyle = "#fff";
  ctx.font = "20px monospace";
  ctx.fillText("Score: " + score, 10, 490);
}

function endGame() {
  gameOver = true;
  ctx.fillStyle = "#ff0000";
  ctx.font = "40px Impact";
  ctx.textAlign = "center";
  ctx.fillText("💀 GAME OVER 💀", canvas.width / 2, canvas.height / 2);
  ctx.font = "20px monospace";
  ctx.fillText("Your Score: " + score, canvas.width / 2, canvas.height / 2 + 40);
}

let game = setInterval(draw, 100);
