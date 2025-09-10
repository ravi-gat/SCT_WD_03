// Sound elements
const moveSound = document.getElementById("moveSound");
const winSound = document.getElementById("winSound");
const drawSound = document.getElementById("drawSound");
const errorSound = document.getElementById("errorSound");
const boardElement = document.getElementById("board");
const statusElement = document.getElementById("status");
const matchScoreElement = document.getElementById("matchScore");
const gameModeSelect = document.getElementById("gameMode");
const difficultySelect = document.getElementById("difficulty");
const matchModeSelect = document.getElementById("matchMode");

const xScoreElement = document.getElementById("xScore");
const oScoreElement = document.getElementById("oScore");
const drawScoreElement = document.getElementById("drawScore");

const resetScoresButton = document.getElementById("resetScores");
const newMatchButton = document.getElementById("newMatch");

let board = ["", "", "", "", "", "", "", "", ""];
let currentPlayer = "X";
let gameActive = true;

// Permanent scores
let xWins = parseInt(localStorage.getItem("xWins")) || 0;
let oWins = parseInt(localStorage.getItem("oWins")) || 0;
let draws = parseInt(localStorage.getItem("draws")) || 0;

// Match scores
let matchXWins = 0;
let matchOWins = 0;
let matchRounds = 1;
let matchOver = false;

function updateScoreDisplay() {
  xScoreElement.textContent = xWins;
  oScoreElement.textContent = oWins;
  drawScoreElement.textContent = draws;
  matchScoreElement.textContent = `Match Score: X ${matchXWins} - ${matchOWins} O`;
}

function createBoard() {
  boardElement.innerHTML = "";
  board.forEach((cell, index) => {
    const cellElement = document.createElement("div");
    cellElement.classList.add("cell");
    cellElement.addEventListener("click", () => handleCellClick(index));
    boardElement.appendChild(cellElement);
  });
}

function handleCellClick(index) {
  if (!gameActive || board[index] !== "" || matchOver) {
    if (errorSound) { errorSound.currentTime = 0; errorSound.play(); }
    return;
  }

  board[index] = currentPlayer;
  updateBoard();
  if (moveSound) { moveSound.currentTime = 0; moveSound.play(); }

  if (checkWinner(board, currentPlayer)) {
    statusElement.textContent = `${currentPlayer} Wins this round! 🎉`;
    highlightWinner(board, currentPlayer);
    if (winSound) { winSound.currentTime = 0; winSound.play(); }
    finishRound(currentPlayer);
    return;
  }

  if (board.every(cell => cell !== "")) {
    if (drawSound) { drawSound.currentTime = 0; drawSound.play(); }
    statusElement.textContent = "Round Draw! 🤝";
    finishRound("draw");
    return;
  }

  if (gameModeSelect.value === "2p") {
    // Two players
    currentPlayer = currentPlayer === "X" ? "O" : "X";
    statusElement.textContent = `Player ${currentPlayer}'s Turn`;
  } else {
    // Vs Computer
    currentPlayer = "O";
    if (difficultySelect.value === "easy") {
      setTimeout(computerMoveEasy, 400);
    } else {
      setTimeout(computerMoveHard, 400);
    }
  }
}

function computerMoveEasy() {
  const available = board.map((val, i) => val === "" ? i : null).filter(v => v !== null);
  const move = available[Math.floor(Math.random() * available.length)];
  makeAIMove(move);
}

function computerMoveHard() {
  const bestMove = findBestMove(board);
  makeAIMove(bestMove);
}

function makeAIMove(index) {
  if (!gameActive || board[index] !== "" || matchOver) return;
  board[index] = "O";
  updateBoard();

  if (checkWinner(board, "O")) {
    statusElement.textContent = "Computer Wins this round! 🤖";
    highlightWinner(board, "O");
    finishRound("O");
    return;
  }

  if (board.every(cell => cell !== "")) {
    statusElement.textContent = "Round Draw! 🤝";
    finishRound("draw");
    return;
  }

  currentPlayer = "X";
  statusElement.textContent = "Your Turn (X)";
}

function updateBoard() {
  const cells = document.querySelectorAll(".cell");
  board.forEach((val, idx) => {
    cells[idx].textContent = val;
    if (val !== "") {
      cells[idx].classList.add("taken");
    }
  });
}

function checkWinner(board, player) {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  return winPatterns.some(([a,b,c]) => board[a]===player && board[b]===player && board[c]===player);
}

function highlightWinner(board, player) {
  const winPatterns = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6]
  ];
  const cells = document.querySelectorAll(".cell");
  winPatterns.forEach(([a,b,c])=>{
    if (board[a]===player && board[b]===player && board[c]===player) {
      cells[a].classList.add("win");
      cells[b].classList.add("win");
      cells[c].classList.add("win");
    }
  });
}

function finishRound(winner) {
  gameActive = false;
  if (winner === "X") {
    xWins++; matchXWins++;
  } else if (winner === "O") {
    oWins++; matchOWins++;
  } else {
    draws++;
  }
  localStorage.setItem("xWins", xWins);
  localStorage.setItem("oWins", oWins);
  localStorage.setItem("draws", draws);
  updateScoreDisplay();
  checkMatchWinner();
}

function checkMatchWinner() {
  matchRounds = parseInt(matchModeSelect.value);
  const needed = Math.ceil(matchRounds/2);
  if (matchXWins >= needed) {
    statusElement.textContent = `🏆 Player X wins the match!`;
    matchOver = true;
  } else if (matchOWins >= needed) {
    statusElement.textContent = `🏆 Player O wins the match!`;
    matchOver = true;
  }
}

function resetGame() {
  board = ["","","","","","","","",""];
  currentPlayer = "X";
  gameActive = true;
  createBoard();
  if (!matchOver) {
    statusElement.textContent = "Player X's Turn";
  }
}

newMatchButton.addEventListener("click", () => {
  matchXWins = 0; matchOWins = 0; matchOver = false;
  resetGame();
  statusElement.textContent = "New Match Started! Player X's Turn";
  updateScoreDisplay();
});

resetScoresButton.addEventListener("click", () => {
  xWins=0;oWins=0;draws=0;
  localStorage.removeItem("xWins");
  localStorage.removeItem("oWins");
  localStorage.removeItem("draws");
  updateScoreDisplay();
});

// Minimax AI for hard mode
function findBestMove(board) {
  let bestScore=-Infinity, move;
  board.forEach((cell,idx)=>{
    if(cell===""){
      board[idx]="O";
      let score=minimax(board,0,false);
      board[idx]="";
      if(score>bestScore){bestScore=score;move=idx;}
    }
  });
  return move;
}

function minimax(board,depth,isMaximizing){
  if(checkWinner(board,"O")) return 10-depth;
  if(checkWinner(board,"X")) return depth-10;
  if(board.every(c=>c!=="")) return 0;

  if(isMaximizing){
    let best=-Infinity;
    board.forEach((cell,i)=>{
      if(cell===""){board[i]="O";best=Math.max(best,minimax(board,depth+1,false));board[i]="";}
    });
    return best;
  }else{
    let best=Infinity;
    board.forEach((cell,i)=>{
      if(cell===""){board[i]="X";best=Math.min(best,minimax(board,depth+1,true));board[i]="";}
    });
    return best;
  }
}

// Init
createBoard();
updateScoreDisplay();
statusElement.textContent="Player X's Turn";

// Disable difficulty selector if 2 players
gameModeSelect.addEventListener("change", ()=>{
  if(gameModeSelect.value==="2p"){
    difficultySelect.disabled=true;
  } else {
    difficultySelect.disabled=false;
  }
});
