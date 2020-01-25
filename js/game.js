'use strict';
var MINE = '💣';
var FLAG = '🚩';
var RIGHT = '✅';
var WRONG = '❌';
var EXPLOSION = '💥';
var gEmojis = ['💀', '😱', '😫', '😦', '😃', '😨', '😎'];
var HINT = '💡';
var SAFEMOUSE = '🐀';
var gFlagSound = new Audio('audio/flag.wav');
var gFlickSound = new Audio('audio/flick.ogg');
var gWinSound = new Audio('audio/win.wav');
var gExplosionSound = new Audio('audio/explosion.wav');
var gBoard;
var gGame;
var gDifficulties = [
  { idx: 0, SIZE: 4, MINES: 2 },
  { idx: 1, SIZE: 8, MINES: 12 },
  { idx: 2, SIZE: 12, MINES: 30 },
];
var gSelectedDiff;
var gFixedRecords = ['--', '--', '--'];
var gGames;
var gBoards;


function init(diffIdx) {
  gSelectedDiff = gDifficulties[diffIdx];
  var elRecord = document.querySelector('.record');
  elRecord.innerText = gFixedRecords[diffIdx];
  gGame = {
    isOn: false,
    shownCount: 0,
    markedCount: 0,
    isFirstClick: true,
    flagsLeft: gSelectedDiff.MINES,
    hintOn: false,
    livesLeft: 3,
    secsPassed: 0,
    isRecord: false,
    safeClicks: 3,
    movesPlayed: 0,
  };
  gGames = [];
  gBoards = [];

  reset();//timer
  gBoard = buildBoard();
  renderBoard(gBoard);
  document.querySelector('.replay-btn').innerText = gEmojis[4];
  updateFlagsCounter();
  createHints();
  createLivsesCounter();
  createHelpFlags();
  updateSafeClicks();
}



function playAgain() {
  init(gSelectedDiff.idx);
}




function buildBoard() {
  var board = [];
  for (var i = 0; i < gSelectedDiff.SIZE; i++) {
    board[i] = [];
    for (var j = 0; j < gSelectedDiff.SIZE; j++) {
      board[i][j] = {
        minesAroundCount: 0,
        isShown: false,
        isMine: false,
        isMarked: false,
        isHinted: false,
      }
    }
  }
  return board;
}



function renderBoard(board) {
  var strHTML = '<table><tbody>';
  for (var i = 0; i < board.length; i++) {
    strHTML += '<tr>';
    for (var j = 0; j < board[0].length; j++) {
      var className = `cell cell${i}-${j}`;
      strHTML +=
        `<td class="${className}" onclick="cellClicked(this, event, gBoard, ${i}, ${j})"
       oncontextmenu="cellClicked(this, event, gBoard, ${i}, ${j})"></td>`;
    }
    strHTML += '</tr>';
  }
  strHTML += '</tbody></table>';
  var elContainer = document.querySelector('.board-container');
  elContainer.innerHTML = strHTML;
}



function getEmptyCells(board, safeCoordI, safeCoordJ) {
  var emptyCells = [];
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      if (i === safeCoordI && j === safeCoordJ) continue;
      if (!board[i][j].isMine) emptyCells.push({ i: i, j: j });
    }
  }
  return emptyCells;
}



function spreadMines(board, coordI, coordJ) {
  var emptyCells = getEmptyCells(board, coordI, coordJ);
  for (var i = 0; i < gSelectedDiff.MINES; i++) {
    var rndIdx = getRandomIntInclusive(0, emptyCells.length - 1);
    var emptyCell = emptyCells[rndIdx];
    board[emptyCell.i][emptyCell.j].isMine = true;
    emptyCells.splice(rndIdx, 1);
  }
}


function minesCounter(board, rowIdx, colIdx) {
  var minesCount = 0;
  for (var i = rowIdx - 1; i <= rowIdx + 1; i++) {
    if (i < 0 || i >= board.length) continue;
    for (var j = colIdx - 1; j <= colIdx + 1; j++) {
      if (j < 0 || j >= board[0].length) continue;
      if (i === rowIdx && j === colIdx) continue;
      if (board[i][j].isMine) minesCount++;
    }
  }
  return minesCount++;
}



function setMinesNegsCount(board) {
  for (var i = 0; i < board.length; i++) {
    for (var j = 0; j < board[0].length; j++) {
      var minesCount = minesCounter(board, i, j);
      board[i][j].minesAroundCount = minesCount;
    }
  }
}



function expandShown(elCell, board, i, j) {
  if (!board[i][j].isMine && board[i][j].minesAroundCount > 0) {    //has mines around
    elCell.classList.add('revealed');
    elCell.innerText = board[i][j].minesAroundCount;
    if (!board[i][j].isShown) {
      gGame.shownCount++;
      board[i][j].isShown = true;
    }
    return;
  }
  for (var cellI = i - 1; cellI <= i + 1; cellI++) {                // no mines around
    if (cellI < 0 || cellI >= board.length) continue;
    for (var cellJ = j - 1; cellJ <= j + 1; cellJ++) {
      if (cellJ < 0 || cellJ >= board[0].length) continue;
      var cell = board[cellI][cellJ];
      if (cell.isShown) continue;
      gGame.shownCount++;
      var elCell = document.querySelector(`.cell.cell${cellI}-${cellJ}`);
      if (board[cellI][cellJ].minesAroundCount > 0) {
        elCell.innerText = board[cellI][cellJ].minesAroundCount;
      }
      cell.isShown = true;
      elCell.classList.add('revealed');
      expandShown(elCell, board, cellI, cellJ);
    }
  }
}



function flagCell(elCell, board, i, j) {
  if (board[i][j].isMarked) {
    board[i][j].isMarked = false;
    elCell.innerText = '';
    gGame.markedCount--;
    gGame.flagsLeft++;
  } else {
    if (!gGame.flagsLeft) return;
    board[i][j].isMarked = true;
    elCell.innerText = FLAG;
    gGame.markedCount++;
    gGame.flagsLeft--;
  }
  gFlagSound.play();
  updateFlagsCounter();
}



function gameOver(elCell, board, coordI, coordJ) {
  stop();
  var elReplayBtn = document.querySelector('.replay-btn');
  elReplayBtn.innerText = gEmojis[5];
  gExplosionSound.play();
  renderCell({ i: coordI, j: coordJ }, MINE);
  setTimeout(function () {                                                                    //delaying for explosion effect
    for (var i = 0; i < board.length; i++) {
      for (var j = 0; j < board[0].length; j++) {
        if (board[i][j].isMine && !board[i][j].isMarked) renderCell({ i: i, j: j }, MINE);    //not marked
        if (!board[i][j].isMine && board[i][j].isMarked) renderCell({ i: i, j: j }, WRONG);   //wrong mark
        if (board[i][j].isMine && board[i][j].isMarked) renderCell({ i: i, j: j }, RIGHT);    //right mark
      }
    }
    elCell.innerText = EXPLOSION;
    elReplayBtn.innerText = gEmojis[0];
    gGame.isOn = false;
  }, 920)
}



function win() {
  document.querySelector('.replay-btn').innerText = gEmojis[6];
  gWinSound.play();
  stop();
  setRecord(gSelectedDiff.idx);
  gGame.isOn = false;
}



function updateFlagsCounter() {
  document.querySelector('.flags-counter span').innerText = gGame.flagsLeft;
}



function createLivsesCounter() {
  var strHTML = '';
  var elLivesModal = document.querySelector('.lives-modal');
  strHTML += `LIVES REMAIN:<span>${gGame.livesLeft}</span>`;
  elLivesModal.innerHTML = strHTML;
}



function showLiveLost() {
  document.querySelector('.replay-btn').innerText = gEmojis[5];
  document.querySelector('.lives-modal span').innerText = gGame.livesLeft;
  var elLivesModal = document.querySelector('.lives-modal');
  elLivesModal.classList.toggle('live-lost');
  var elCells = document.querySelectorAll('.cell');
  for (let i = 0; i < elCells.length; i++) {
    elCells[i].classList.toggle('live-lost');
  }
  gFlickSound.play();

  setTimeout(function () {                        //delaying to create mine stepped effect
    elLivesModal.classList.toggle('live-lost');
    document.querySelector('.replay-btn').innerText = gEmojis[gGame.livesLeft + 1];
    for (let i = 0; i < elCells.length; i++) {
      elCells[i].classList.toggle('live-lost');
    }
  }, 800)
}



function liveLost() {
  gGame.livesLeft--;
  showLiveLost();
}



function createHints() {
  var strHTML = '';
  for (var i = 0; i < 3; i++) {
    strHTML += `<span onclick="hintClicked(this)">${HINT}</span>`;
  }
  document.querySelector('.hints-bar').innerHTML = strHTML;
}



function hintClicked(elHint) {
  if (!gGame.isOn) return;
  gGame.hintOn = true;
  elHint.style.visibility = 'hidden';
}



function removeHint(board, i, j) {
  for (var coordI = i - 1; coordI <= i + 1; coordI++) {
    if (coordI < 0 || coordI >= board.length) continue;
    for (var coordJ = j - 1; coordJ <= j + 1; coordJ++) {
      if (coordJ < 0 || coordJ >= board[0].length) continue;
      var cell = board[coordI][coordJ];
      if (cell.isHinted) {
        cell.isHinted = false;
        renderCell({ i: coordI, j: coordJ }, '');
        var elCell = document.querySelector(`.cell.cell${coordI}-${coordJ}`);
        elCell.classList.remove('hinted');
      }
    }
  }
}



function giveHint(board, i, j) {
  for (var coordI = i - 1; coordI <= i + 1; coordI++) {
    if (coordI < 0 || coordI >= board.length) continue;
    for (var coordJ = j - 1; coordJ <= j + 1; coordJ++) {
      if (coordJ < 0 || coordJ >= board[0].length) continue;        //negs loop conditions
      var cell = board[coordI][coordJ];
      if (cell.isMarked || cell.isShown) continue;

      cell.isHinted = true;
      if (cell.isMine) renderCell({ i: coordI, j: coordJ }, MINE);
      else renderCell({ i: coordI, j: coordJ }, cell.minesAroundCount);
      var elCell = document.querySelector(`.cell.cell${coordI}-${coordJ}`);
      elCell.classList.add('hinted');

    }
  }
  setTimeout(function () { removeHint(board, i, j) }, 1000);
  gGame.hintOn = false;
}



function setRecord(diffIdx) {
  if (gGame.secsPassed < localStorage[diffIdx]) {
    var elRecord = document.querySelector('.record');
    gGame.isRecord = true;
    localStorage[diffIdx] = gGame.secsPassed;
    var fixedTime = fixTimeToShow(gGame.secsPassed);
    gFixedRecords[diffIdx] = fixedTime;
    elRecord.innerText = fixedTime;
  }
  return;
}



function createHelpFlags() {
  var strHTML = '';
  for (var i = 0; i < 3; i++) {
    strHTML += `<span onclick="helpFlagClicked(this, gBoard)">${FLAG}</span>`;
  }
  document.querySelector('.flags-bar').innerHTML = strHTML;
}



function helpFlagClicked(elFlag, board) {
  if (!gGame.flagsLeft || !gGame.isOn) return;
  elFlag.style.visibility = 'hidden';
  var mineCoords = [];
  for (var i = 0; i < board.length; i++) {
    for (var j = 1; j < board[0].length; j++) {
      if (board[i][j].isMine && !board[i][j].isMarked) mineCoords.push({ i: i, j: j });      //finding mine positions
    }
  }
  var rndIdx = getRandomIntInclusive(0, mineCoords.length - 1);
  var rndMineCoord = mineCoords[rndIdx];
  board[rndMineCoord.i][rndMineCoord.j].isMarked = true;
  gGame.markedCount++;
  gGame.flagsLeft--;
  renderCell(rndMineCoord, FLAG);
  gFlagSound.play();
  updateFlagsCounter();
  if (gSelectedDiff.SIZE ** 2 - gGame.shownCount === gGame.markedCount) win();
}



function updateSafeClicks() {
  document.querySelector('.safe-clicks span').innerText = gGame.safeClicks;
}



function safeClick(board) {
  if (!gGame.isOn || !gGame.safeClicks) return;
  gGame.safeClicks--;
  updateSafeClicks();
  var safeCoords = [];
  for (var i = 0; i < board.length; i++) {
    for (var j = 1; j < board[0].length; j++) {
      if (!board[i][j].isMine && !board[i][j].isMarked && !board[i][j].isShown) safeCoords.push({ i: i, j: j });
    }
  }
  var rndIdx = getRandomIntInclusive(0, safeCoords.length - 1);
  var rndSafeCoord = safeCoords[rndIdx];
  renderCell(rndSafeCoord, SAFEMOUSE)                                 //sending virtual mouse to take the shot :(
  setTimeout(function () { renderCell(rndSafeCoord, '') }, 1000);
}



function copyBoard(board) {
  var copyBoard = [];
  for (var i = 0; i < gSelectedDiff.SIZE; i++) {
    copyBoard[i] = [];
    for (var j = 0; j < gSelectedDiff.SIZE; j++) {
      copyBoard[i][j] = {
        minesAroundCount: board[i][j].minesAroundCount,
        isShown: board[i][j].isShown,
        isMine: board[i][j].isMine,
        isMarked: board[i][j].isMarked,
        isHinted: board[i][j].isHinted,
      }
    }
  }
  return copyBoard;
}



function saveLastMove(gameData, board) {
  var gGameCopy = {
    isOn: gameData.isOn,
    shownCount: gameData.shownCount,
    markedCount: gameData.markedCount,
    isFirstClick: gameData.isFirstClick,
    flagsLeft: gameData.flagsLeft,
    hintOn: gameData.flagsLeft,
    livesLeft: gameData.livesLeft,
    secsPassed: gameData.secsPassed,
    isRecord: gameData.isRecord,
    safeClicks: gameData.safeClick,
    movesPlayed: gameData.movesPlayed,
  };
  gGames.push(gGameCopy);
  var gBoardCopy = copyBoard(board);
  gBoards.push(gBoardCopy);
}



function undo() {
  gGame = gGames[gGame.movesPlayed - 2];
  gBoard = gBoards[gGame.movesPlayed - 2];
  var strHTML = '<table><tbody>';
  for (var i = 0; i < gBoard.length; i++) {
    strHTML += '<tr>';
    for (var j = 0; j < gBoard[0].length; j++) {
      var className = `cell cell${i}-${j}`;
      var cellContent = '';
      if (gBoard[i][j].isShown && gBoard[i][j].minesAroundCount > 0) cellContent = gBoard[i][j].minesAroundCount;
      if (gBoard[i][j].isShown && gBoard[i][j].minesAroundCount === 0) cellContent = '';
      if (gBoard[i][j].isMarked) cellContent = FLAG;
      if (gBoard[i][j].isShown) className += ' revealed';
      strHTML +=
        `<td class="${className}" onclick="cellClicked(this, event, gBoard, ${i}, ${j})"
       oncontextmenu="cellClicked(this, event, gBoard, ${i}, ${j})">${cellContent}</td>`;
    }
    strHTML += '</tr>';
  }
  strHTML += '</tbody></table>';
  var elContainer = document.querySelector('.board-container');
  elContainer.innerHTML = strHTML;
}



function cellClicked(elCell, eve, board, i, j) {
  eve.preventDefault();
  var cell = board[i][j];
  if (cell.isShown) return
  if (eve.type === 'click') {
    if (cell.isMarked) return
    if (gGame.isFirstClick) {
      spreadMines(board, i, j);
      setMinesNegsCount(board, i, j);
      start();
      gGame.isOn = true;
      gGame.isFirstClick = false;
    }
    if (!gGame.isOn) return;
    if (gGame.hintOn) {                      //give hint
      giveHint(board, i, j);
      return
    }
    if (!cell.isMine && !cell.isMarked) {       //clean cell clicked
      expandShown(elCell, board, i, j);
    }
    if (cell.isMine) {                       //mineClicked
      if (!gGame.livesLeft) {
        gameOver(elCell, board, i, j);
        return
      }
      liveLost();
    }
  }
  if (eve.type === 'contextmenu') {         //flag cell
    flagCell(elCell, board, i, j);
  }
  saveLastMove(gGame, board);
  gGame.movesPlayed++;
  if (gSelectedDiff.SIZE ** 2 - gGame.shownCount === gGame.markedCount) {      //win
    win();
  }
}