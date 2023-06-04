/*



If you want to know how this game was made, check out this video, that explains how it's made:

https://youtu.be/eue3UdFvwPo

Follow me on twitter for more: https://twitter.com/HunorBorbely

*/

// Extend the base functionality of JavaScript
Array.prototype.last = function () {
  return this[this.length - 1];
};

// A sinus function that acceps degrees instead of radians
Math.sinus = function (degree) {
  return Math.sin((degree / 180) * Math.PI);
};

// Game data
let phase = "waiting"; // waiting | stretching | turning | walking | transitioning | falling
let lastTimestamp; // The timestamp of the previous requestAnimationFrame cycle

let heroX; // Changes when moving forward
let heroY; // Only changes when falling
let sceneOffset; // Moves the whole game

let platforms = [];
let sticks = [];
let trees = [];

let score = 0;
const localStorageBestScoreKey = 'greffInDoorGameBestScore';
const localBestScore = localStorage.getItem(localStorageBestScoreKey);
let bestScore = localBestScore ? Number(localBestScore) : 0;

const localStorageHasSoundKey = 'greffInDoorGameHasSound';
const localHasSound = localStorage.getItem(localStorageHasSoundKey);
let hasSound = localHasSound ? localHasSound === 'true' : true;

const scale = window.devicePixelRatio;

// Configuration
const canvasWidth = 375;
const canvasHeight = 375;

const platformHeight = 100;
const firstPlatformWidth = 30 * scale;
const platformMinGap = 40 * scale;
const platformMaxGap = scale < 2 ? 200 : (window.innerWidth / 2) - 10;
const platformMinWidth = 20 * scale;
const platformMaxWidth = 100 * scale;
const stickWidth = 2 * scale;

const heroDistanceFromEdge = 10; // While waiting
const paddingX = -100; // The waiting position of the hero in from the original canvas size
const perfectAreaSize = 10 * scale;

// The background moves slower than the hero
const backgroundSpeedMultiplier = 0.2;

const hill1BaseHeight = 100 * scale;
const hill1Amplitude = 10;
const hill1Stretch = 1;
const hill2BaseHeight = 70 * scale;
const hill2Amplitude = 20;
const hill2Stretch = 0.5;
const treeSize = scale;

const stretchingSpeed = 4 / scale; // Milliseconds it takes to draw a pixel
const turningSpeed = 4 / scale; // Milliseconds it takes to turn a degree
const walkingSpeed = 4 / scale;
const transitioningSpeed = 2 / scale;
const fallingSpeed = 2 / scale;

const heroWidth = 32 * scale; // 24
const heroHeight = 32 * scale; // 40

const ronPhraseDuration = 3000;
const snakePhraseDuration = 3000;
let isRonTalking = false;
let isSnakeTalking = false;
let doesSnakeWantTalk = false;
const ronSound = new Audio("sound/ron.mp3");
const snakeSound = new Audio("sound/snake.mp3");

const canvas = document.getElementById("game");

canvas.width = window.innerWidth; // Make the Canvas full screen
canvas.height = window.innerHeight;

const ctx = canvas.getContext("2d");

const introductionElement = document.getElementById("introduction");
const perfectElement = document.getElementById("perfect");
const restartButton = document.getElementById("restart");
const soundButton = document.getElementById("sound");
const scoreElement = document.getElementById("score");
const bestScoreElement = document.getElementById("best-score-value");
const ronPhrase = document.getElementById("ron-phrase");
const snakePhrase = document.getElementById("snake-phrase");

soundButton.classList.add(hasSound ? 'no-sound-icon' : 'sound-icon');
bestScoreElement.innerText = bestScore

const heroImg = new Image();
heroImg.src = './images/Ron.png';
heroImg.onload = () => {
  // Initialize layout
  resetGame();
}

// Resets game variables and layouts but does not start the game (game starts on keypress)
function resetGame() {
  // Reset game progress
  phase = "waiting";
  lastTimestamp = undefined;
  sceneOffset = 0;
  score = 0;

  introductionElement.style.opacity = 1;
  perfectElement.style.opacity = 0;
  restartButton.style.display = "none";
  scoreElement.innerText = score;

  // The first platform is always the same
  // x + w has to match paddingX
  platforms = [{ x: 50, w: firstPlatformWidth }];
  generatePlatform();
  generatePlatform();
  generatePlatform();
  generatePlatform();

  sticks = [{ x: platforms[0].x + platforms[0].w, length: 0, rotation: 0 }];

  trees = [];
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();
  generateTree();

  heroX = platforms[0].x + platforms[0].w - heroDistanceFromEdge;
  heroY = 0;

  draw();
}

function generateTree() {
  const minimumGap = 30;
  const maximumGap = 150;

  // X coordinate of the right edge of the furthest tree
  const lastTree = trees[trees.length - 1];
  let furthestX = lastTree ? lastTree.x : 0;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));

  const treeColors = ["#6D8821", "#8FAC34", "#98B333"];
  const color = treeColors[Math.floor(Math.random() * 3)];

  trees.push({ x, color });
}

function generatePlatform() {
  const minimumGap = platformMinGap;
  const maximumGap = platformMaxGap;
  const minimumWidth = platformMinWidth;
  const maximumWidth = platformMaxWidth;

  // X coordinate of the right edge of the furthest platform
  const lastPlatform = platforms[platforms.length - 1];
  let furthestX = lastPlatform.x + lastPlatform.w;

  const x =
    furthestX +
    minimumGap +
    Math.floor(Math.random() * (maximumGap - minimumGap));
  const w =
    minimumWidth + Math.floor(Math.random() * (maximumWidth - minimumWidth));

  platforms.push({ x, w });
}

function showSnakePhrase() {
  doesSnakeWantTalk = true
  if (isRonTalking) {
    return;
  }
  isSnakeTalking = true;

  snakePhrase.style.opacity = '1';
  snakePhrase.querySelector('.typing').classList.add('typing-snake-phrase');

  if (hasSound) {
    snakeSound.play();
  }

  setTimeout(() => {
    snakePhrase.style.opacity = '0';
    snakePhrase.querySelector('.typing').classList.remove('typing-snake-phrase');
    doesSnakeWantTalk = false;
    isSnakeTalking = false;
  }, snakePhraseDuration);
}

function showRonPhrase() {
  if (score !== 0 || isSnakeTalking) {
    return;
  }

  isRonTalking = true;
  ronPhrase.style.opacity = '1';
  ronPhrase.querySelector('.typing').classList.add('typing-ron-phrase');

  if (hasSound) {
    ronSound.play();
  }

  setTimeout(() => {
    ronPhrase.style.opacity = '0';
    ronPhrase.querySelector('.typing').classList.remove('typing-ron-phrase');
    isRonTalking=false;

    if (doesSnakeWantTalk) {
      showSnakePhrase();
    }
  }, ronPhraseDuration);
}

// If space was pressed restart the game
window.addEventListener("keydown", function (event) {
  if (event.key === " ") {
    event.preventDefault();
    resetGame();
  }
});

window.addEventListener("mousedown", function () {
  if (phase === "waiting") {
    lastTimestamp = undefined;
    introductionElement.style.opacity = 0;
    phase = "stretching";
    showRonPhrase();
    window.requestAnimationFrame(animate);
  }
});

window.addEventListener("touchstart", function (e) {
  e.preventDefault()
  if (phase === "waiting") {
    lastTimestamp = undefined;
    introductionElement.style.opacity = 0;
    phase = "stretching";
    showRonPhrase();
    window.requestAnimationFrame(animate);
  }
},  { passive: false });

window.addEventListener("mouseup", function () {
  if (phase === "stretching") {
    phase = "turning";
  }
});

window.addEventListener("touchend", function (e) {
  e.preventDefault()
  if (phase === "stretching") {
    phase = "turning";
  }
},  { passive: false });

window.addEventListener("resize", function () {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  draw();
});

window.requestAnimationFrame(animate);

function setBestScore() {
  if (score > bestScore) {
    localStorage.setItem(localStorageBestScoreKey, score);
    bestScore = score;
    bestScoreElement.innerText = score;
  }
}

// The main game loop
function animate(timestamp) {
  if (!lastTimestamp) {
    lastTimestamp = timestamp;
    window.requestAnimationFrame(animate);
    return;
  }

  switch (phase) {
    case "waiting":
      return; // Stop the loop
    case "stretching": {
      sticks.last().length += (timestamp - lastTimestamp) / stretchingSpeed;
      break;
    }
    case "turning": {
      sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;

      if (sticks.last().rotation > 90) {
        sticks.last().rotation = 90;

        const [nextPlatform, perfectHit] = thePlatformTheStickHits();
        if (nextPlatform) {
          // Increase score
          score += perfectHit ? 2 : 1;
          scoreElement.innerText = score;

          if (perfectHit) {
            perfectElement.style.opacity = 1;
            setTimeout(() => (perfectElement.style.opacity = 0), 1000);
          }

          generatePlatform();
          generateTree();
          generateTree();
        }

        phase = "walking";
      }
      break;
    }
    case "walking": {
      heroX += (timestamp - lastTimestamp) / walkingSpeed;

      const [nextPlatform] = thePlatformTheStickHits();
      if (nextPlatform) {
        // If hero will reach another platform then limit it's position at it's edge
        const maxHeroX = nextPlatform.x + nextPlatform.w - heroDistanceFromEdge;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "transitioning";
        }
      } else {
        // If hero won't reach another platform then limit it's position at the end of the pole
        const maxHeroX = sticks.last().x + sticks.last().length + heroWidth;
        if (heroX > maxHeroX) {
          heroX = maxHeroX;
          phase = "falling";
        }
      }
      break;
    }
    case "transitioning": {
      sceneOffset += (timestamp - lastTimestamp) / transitioningSpeed;

      const [nextPlatform] = thePlatformTheStickHits();
      if (sceneOffset > nextPlatform.x + nextPlatform.w - paddingX) {
        // Add the next step
        sticks.push({
          x: nextPlatform.x + nextPlatform.w,
          length: 0,
          rotation: 0
        });
        phase = "waiting";
      }
      break;
    }
    case "falling": {
      if (sticks.last().rotation < 180) {
        sticks.last().rotation += (timestamp - lastTimestamp) / turningSpeed;
      }

      showSnakePhrase();

      heroY += (timestamp - lastTimestamp) / fallingSpeed;
      const maxHeroY =
        platformHeight + 100 + (window.innerHeight - canvasHeight) / 2;
      if (heroY > maxHeroY) {
        setBestScore()
        restartButton.style.display = "block";
        return;
      }
      break;
    }
    default:
      throw Error("Wrong phase");
  }

  draw();
  window.requestAnimationFrame(animate);

  lastTimestamp = timestamp;
}

// Returns the platform the stick hit (if it didn't hit any stick then return undefined)
function thePlatformTheStickHits() {
  if (sticks.last().rotation !== 90)
    throw Error(`Stick is ${sticks.last().rotation}°`);
  const stickFarX = sticks.last().x + sticks.last().length;

  const platformTheStickHits = platforms.find(
    (platform) => platform.x < stickFarX && stickFarX < platform.x + platform.w
  );

  // If the stick hits the perfect area
  if (
    platformTheStickHits &&
    platformTheStickHits.x + platformTheStickHits.w / 2 - perfectAreaSize / 2 <
    stickFarX &&
    stickFarX <
    platformTheStickHits.x + platformTheStickHits.w / 2 + perfectAreaSize / 2
  )
    return [platformTheStickHits, true];

  return [platformTheStickHits, false];
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, window.innerWidth, window.innerHeight);

  drawBackground();

  // Center main canvas area to the middle of the screen
  ctx.translate(
    (window.innerWidth - canvasWidth) / 2 - sceneOffset,
    (window.innerHeight - canvasHeight) / 2
  );

  // Draw scene
  drawPlatforms();
  drawHero();
  drawSticks();

  // Restore transformation
  ctx.restore();

  // ctx.scale(1.5, 1.5)
}

restartButton.addEventListener("click", function (event) {
  event.preventDefault();
  resetGame();
  restartButton.style.display = "none";
});
restartButton.addEventListener("touchend", function (event) {
  event.preventDefault();
  resetGame();
  restartButton.style.display = "none";
});

function drawPlatforms() {
  platforms.forEach(({ x, w }) => {
    // Draw platform
    ctx.fillStyle = "black";
    ctx.fillRect(
      x,
      canvasHeight - platformHeight,
      w,
      platformHeight + (window.innerHeight - canvasHeight) / 2
    );

    // Draw perfect area only if hero did not yet reach the platform
    if (sticks.last().x < x) {
      ctx.fillStyle = "#FF9844";
      ctx.fillRect(
        x + w / 2 - perfectAreaSize / 2,
        canvasHeight - platformHeight,
        perfectAreaSize,
        perfectAreaSize
      );
    }
  });
}

function drawHero() {
  ctx.save();

  ctx.drawImage(
    heroImg,
    heroX - heroWidth,
    heroY + canvasHeight - platformHeight - heroHeight,
    heroWidth,
    heroHeight,
  );

  ctx.restore();
}

function drawSticks() {
  sticks.forEach((stick) => {
    ctx.save();

    // Move the anchor point to the start of the stick and rotate
    ctx.translate(stick.x, canvasHeight - platformHeight);
    ctx.rotate((Math.PI / 180) * stick.rotation);

    // Draw stick
    ctx.beginPath();
    ctx.lineWidth = stickWidth;
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -stick.length);
    ctx.stroke();

    // Restore transformations
    ctx.restore();
  });
}

function drawBackground() {
  // Draw sky
  const gradient = ctx.createLinearGradient(0, 0, 0, window.innerHeight);
  gradient.addColorStop(0, "#BBD691");
  gradient.addColorStop(1, "#FEF1E1");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

  // Draw hills
  drawHill(hill1BaseHeight, hill1Amplitude, hill1Stretch, "#95C629");
  drawHill(hill2BaseHeight, hill2Amplitude, hill2Stretch, "#659F1C");

  // Draw trees
  trees.forEach((tree) => drawTree(tree.x, tree.color));
}

// A hill is a shape under a stretched out sinus wave
function drawHill(baseHeight, amplitude, stretch, color) {
  ctx.beginPath();
  ctx.moveTo(0, window.innerHeight);
  ctx.lineTo(0, getHillY(0, baseHeight, amplitude, stretch));
  for (let i = 0; i < window.innerWidth; i++) {
    ctx.lineTo(i, getHillY(i, baseHeight, amplitude, stretch));
  }
  ctx.lineTo(window.innerWidth, window.innerHeight);
  ctx.fillStyle = color;
  ctx.fill();
}

function drawTree(x, color) {
  ctx.save();
  ctx.translate(
    (-sceneOffset * backgroundSpeedMultiplier + x) * hill1Stretch,
    getTreeY(x, hill1BaseHeight, hill1Amplitude)
  );

  const treeTrunkHeight = 5 * treeSize;
  const treeTrunkWidth = 2 * treeSize;
  const treeCrownHeight = 25 * treeSize;
  const treeCrownWidth = 10 * treeSize;

  // Draw trunk
  ctx.fillStyle = "#7D833C";
  ctx.fillRect(
    -treeTrunkWidth / 2,
    -treeTrunkHeight,
    treeTrunkWidth,
    treeTrunkHeight
  );

  // Draw crown
  ctx.beginPath();
  ctx.moveTo(-treeCrownWidth / 2, -treeTrunkHeight);
  ctx.lineTo(0, -(treeTrunkHeight + treeCrownHeight));
  ctx.lineTo(treeCrownWidth / 2, -treeTrunkHeight);
  ctx.fillStyle = color;
  ctx.fill();

  ctx.restore();
}

function getHillY(windowX, baseHeight, amplitude, stretch) {
  const sineBaseY = window.innerHeight - baseHeight;
  return (
    Math.sinus((sceneOffset * backgroundSpeedMultiplier + windowX) * stretch) *
    amplitude +
    sineBaseY
  );
}

function getTreeY(x, baseHeight, amplitude) {
  const sineBaseY = window.innerHeight - baseHeight;
  return Math.sinus(x) * amplitude + sineBaseY;
}

function soundToggle(e) {
  e.preventDefault();
  e.stopPropagation();
  hasSound = !hasSound;
  soundButton.classList.toggle('sound-icon');
  soundButton.classList.toggle('no-sound-icon');
  localStorage.setItem(localStorageHasSoundKey, hasSound);
}

soundButton.addEventListener('click', soundToggle);
soundButton.addEventListener('touchstart', soundToggle);
soundButton.addEventListener('touchend', (e) => {
  e.preventDefault();
  e.stopPropagation();
})
