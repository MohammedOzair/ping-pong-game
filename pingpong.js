
        const canvas = document.getElementById("table");
        const ctx = canvas.getContext("2d");

        // Background image (stays the same)
        const backgroundImg = new Image();
        backgroundImg.src = "assets/ceriien-arts-sleeper-suicunelayoutpng-wmrk.jpg";
        let backgroundLoaded = false;
        
        backgroundImg.onload = function() {
            backgroundLoaded = true;
        };
        
        backgroundImg.onerror = function() {
            console.log("Background image failed to load, using default background");
            backgroundLoaded = false;
        };

        // Table image (new separate image for the ping pong table)
        const tableImg = new Image();
        tableImg.src = "assets/pingpongtable.png"; // Replace with your table image path
        let tableLoaded = false;
        
        tableImg.onload = function() {
            tableLoaded = true;
            console.log("Table image loaded successfully");
        };
        
        tableImg.onerror = function() {
            console.log("Table image failed to load, using default table background");
            tableLoaded = false;
        };

        // Game objects
        const paddleWidth = 10;
        const paddleHeight = 100;
        let playerY = canvas.height / 2 - paddleHeight / 2;
        let computerY = canvas.height / 2 - paddleHeight / 2;

        const ballSize = 10;
        let ballX = canvas.width / 2;
        let ballY = canvas.height / 2;
        let ballSpeedX = 5;
        let ballSpeedY = 5;

        // Scores
        let playerScore = 0;
        let computerScore = 0;

        // Game state
        let isPaused = false;
        let difficulty = 'medium';
        let difficultySettings = {
            easy: { computerSpeed: 2.5, ballSpeed: 4 },
            medium: { computerSpeed: 4, ballSpeed: 5 },
            hard: { computerSpeed: 5.5, ballSpeed: 6.5 },
            expert: { computerSpeed: 7, ballSpeed: 8 }
        };

        // Player movement
        let upPressed = false;
        let downPressed = false;

        // Event listeners
        document.addEventListener("keydown", (e) => {
            if (e.key === "ArrowUp") upPressed = true;
            if (e.key === "ArrowDown") downPressed = true;
            if (e.key === " " || e.key === "Spacebar") {
                e.preventDefault();
                togglePause();
            }
            if (e.key === "Escape") {
                if (isPaused) {
                    togglePause();
                } else {
                    openModal();
                }
            }
        });
        
        document.addEventListener("keyup", (e) => {
            if (e.key === "ArrowUp") upPressed = false;
            if (e.key === "ArrowDown") downPressed = false;
        });

        function drawRect(x, y, w, h, color) {
            ctx.fillStyle = color;
            ctx.fillRect(x, y, w, h);
        }

        function drawCircle(x, y, r, color) {
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, r, 0, Math.PI * 2);
            ctx.closePath();
            ctx.fill();
        }

        function drawNet() {
            for (let i = 0; i < canvas.height; i += 20) {
                drawRect(canvas.width / 2 - 1, i, 2, 10, "#fff");
            }
        }

        function updateScore() {
            document.getElementById("playerScore").textContent = playerScore;
            document.getElementById("computerScore").textContent = computerScore;
        }

        function resetBall() {
            ballX = canvas.width / 2;
            ballY = canvas.height / 2;
            ballSpeedX = -ballSpeedX * (ballSpeedX > 0 ? 1 : -1) * (difficultySettings[difficulty].ballSpeed / 5);
            ballSpeedY = difficultySettings[difficulty].ballSpeed * (Math.random() > 0.5 ? 1 : -1);
        }

        function togglePause() {
            isPaused = !isPaused;
            if (isPaused) {
                document.getElementById("pauseOverlay").style.display = "flex";
            } else {
                document.getElementById("pauseOverlay").style.display = "none";
            }
        }

        function setDifficulty(newDifficulty) {
            difficulty = newDifficulty;
            // Update difficulty indicators
            document.querySelectorAll('.difficulty-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            document.getElementById(`diff-${newDifficulty}`).classList.add('active');
            
            // Update difficulty display
            updateDifficultyDisplay();
            
            // Reset ball speed to new difficulty
            const currentSpeed = Math.sqrt(ballSpeedX * ballSpeedX + ballSpeedY * ballSpeedY);
            const speedRatio = difficultySettings[difficulty].ballSpeed / currentSpeed;
            ballSpeedX *= speedRatio;
            ballSpeedY *= speedRatio;
        }
        
        function updateDifficultyDisplay() {
            document.getElementById('currentDifficulty').textContent = 
                difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        }

        function resetGame() {
            playerScore = 0;
            computerScore = 0;
            updateScore();
            resetBall();
            closeModal();
        }

        function update() {
            if (isPaused) return; // Don't update if paused
            
            // Move player paddle
            if (upPressed && playerY > 0) playerY -= 7;
            if (downPressed && playerY < canvas.height - paddleHeight) playerY += 7;

            // Move computer paddle (AI with difficulty-based speed)
            const computerCenter = computerY + paddleHeight / 2;
            const computerSpeed = difficultySettings[difficulty].computerSpeed;
            
            if (computerCenter < ballY - 10) computerY += computerSpeed;
            else if (computerCenter > ballY + 10) computerY -= computerSpeed;

            // Keep computer paddle in bounds
            if (computerY < 0) computerY = 0;
            if (computerY > canvas.height - paddleHeight) computerY = canvas.height - paddleHeight;

            // Ball movement
            ballX += ballSpeedX;
            ballY += ballSpeedY;

            // Wall collision (top and bottom)
            if (ballY <= ballSize || ballY >= canvas.height - ballSize) {
                ballSpeedY = -ballSpeedY;
            }

            // Player paddle collision
            if (ballX <= 10 + paddleWidth && 
                ballX >= 10 &&
                ballY >= playerY && 
                ballY <= playerY + paddleHeight) {
                ballSpeedX = Math.abs(ballSpeedX); // Ensure ball goes right
                
                // Add some angle based on where it hits the paddle
                const hitPos = (ballY - playerY) / paddleHeight;
                ballSpeedY = (hitPos - 0.5) * 10;
            }

            // Computer paddle collision
            if (ballX >= canvas.width - paddleWidth - 10 && 
                ballX <= canvas.width - 10 &&
                ballY >= computerY && 
                ballY <= computerY + paddleHeight) {
                ballSpeedX = -Math.abs(ballSpeedX); // Ensure ball goes left
                
                // Add some angle based on where it hits the paddle
                const hitPos = (ballY - computerY) / paddleHeight;
                ballSpeedY = (hitPos - 0.5) * 10;
            }

            // Score and reset if ball goes off screen
            if (ballX < 0) {
                computerScore++;
                updateScore();
                resetBall();
            } else if (ballX > canvas.width) {
                playerScore++;
                updateScore();
                resetBall();
            }

            // Check for game win
            if (playerScore >= 5) {
                alert("You win! 🎉");
                resetGame();
            } else if (computerScore >= 5) {
                alert("Computer wins! 🤖");
                resetGame();
            }
        }

        function draw() {
            // Draw the ping pong table surface (now using separate table image)
            if (tableLoaded) {
                // Draw the table image to fill the entire canvas
                ctx.drawImage(tableImg, 0, 0, canvas.width, canvas.height);
            } else {
                // Fallback to green table background if table image doesn't load
                drawRect(0, 0, canvas.width, canvas.height, "#0d5016");
            }
            
            // Draw net (the white dashed line in the middle of the table)
            drawNet();
            
            // Draw paddles 
            drawRect(10, playerY, paddleWidth, paddleHeight, "#0f0"); // Player (green)
            drawRect(canvas.width - paddleWidth - 10, computerY, paddleWidth, paddleHeight, "#f00"); // Computer (red)
            
            // Draw ball
            drawCircle(ballX, ballY, ballSize, "#fff");
            
            // Add glow effect to ball for better visibility on the table
            ctx.shadowColor = "#fff";
            ctx.shadowBlur = 8;
            drawCircle(ballX, ballY, ballSize, "#fff");
            ctx.shadowBlur = 0; // Reset shadow
            
            // Draw pause overlay if paused
            if (isPaused) {
                ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                
                ctx.fillStyle = "#fff";
                ctx.font = "48px Arial";
                ctx.textAlign = "center";
                ctx.shadowColor = "#000";
                ctx.shadowBlur = 5;
                ctx.fillText("PAUSED", canvas.width / 2, canvas.height / 2);
                
                ctx.font = "20px Arial";
                ctx.fillText("Press SPACE to resume", canvas.width / 2, canvas.height / 2 + 50);
                ctx.shadowBlur = 0; // Reset shadow
            }
        }

        function gameLoop() {
            update();
            draw();
            requestAnimationFrame(gameLoop);
        }

        function openModal() {
            isPaused = true;
            document.getElementById("myModal").style.display = "flex";
        }

        function closeModal() {
            document.getElementById("myModal").style.display = "none";
            isPaused = false;
        }

        // Initialize game
        updateScore();
        setDifficulty('medium'); // Set default difficulty
        
        // Update difficulty display
        function updateDifficultyDisplay() {
            document.getElementById('currentDifficulty').textContent = 
                difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
        }
        updateDifficultyDisplay();
        
        // Start the game
        gameLoop();