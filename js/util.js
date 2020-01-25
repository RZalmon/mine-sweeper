nullifyLocalStorage();

var time = 0;
var status = 0;

function start() {         
    status = 1;
    timer();
}

function reset() {
    status = 0;
    time = 0;
    document.querySelector('.timer').innerHTML = "00:00";
}

function stop() {
    status = 0;
}

function timer() {

    if (status == 1) {
        setTimeout(function () {
            time++;
            if (time % 100 === 0) gGame.secsPassed++;              
            var min = Math.floor(time / 100 / 60);
            var sec = Math.floor(time / 100);

            if (min < 10) {
                min = "0" + min;
            }
            if (sec >= 60) {
                sec = sec % 60;
            }
            if (sec < 10) {
                sec = "0" + sec;
            }
            document.querySelector(".timer").innerHTML = min + ":" + sec;
            timer();

        }, 10)
    }
}


function fixTimeToShow(secs){
    var min = Math.floor(secs / 60);
    var sec = Math.floor(secs);

    if (min < 10) {
        min = "0" + min;
    }
    if (sec >= 60) {
        sec = sec % 60;
    }
    if (sec < 10) {
        sec = "0" + sec;
    }
    var fixedTime = min + ":" + sec;
    return fixedTime;
}

function shuffle(a) {
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
}


function getRandomColor() {
    var letters = '0123456789ABCDEF'.split('');
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function getRandomIntInclusive(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

function renderCell(location, value) {
    // Select the elCell and set the value
    var elCell = document.querySelector(`.cell${location.i}-${location.j}`);
    elCell.innerHTML = value;
}

function nullifyLocalStorage(){
    localStorage.setItem(0, 99999);
    localStorage.setItem(1, 99999);
    localStorage.setItem(2, 99999);
    localStorage.removeItem('easy');
    localStorage.removeItem('medium');
    localStorage.removeItem('hard');
  }