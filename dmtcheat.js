var currentCell = -1;
var defaultLength = 5;
var wordLength = defaultLength;
var wordList = [];
var wordsFound = [];

var inputs = [];
var inputEvent = function(event) {
        var input = event.target;
        var val = input.value;
        val = val.replace(/[^a-zA-Z]/g, "").toUpperCase();
        val = val.charAt(val.length-1);
        input.value = val;
        findWords();
};

for (i = 1; i <= 11; i++) {
    inputs[i] = document.getElementById("input" + i);
    inputs[i].number = i;
    inputs[i].addEventListener("input", inputEvent);
    inputs[i].addEventListener("keydown", function(event) {
        if (event.keyCode == 37) {  // Left
           changeCurrentCell(-1);
        } else if (event.keyCode == 39) {  // Right
           changeCurrentCell(1);
        } else if (event.keyCode == 46 || event.keyCode == 8) {  // Delete / Backspace
            event.target.value = "";
            inputEvent(event);
        }
        return false;
    });
    inputs[i].addEventListener("focus", function(event) {
        currentCell = event.target.number;
    });
}

var lengthSlider = new Slider("#lengthSlider", {}).on("change", function(len) {
    changeLength(len.newValue);
});
var lengthIndicator = document.getElementById("lengthIndicator");

var showAllBtn = document.getElementById("showAllBtn");
showAllBtn.addEventListener("click", function(event) {
    document.getElementById("wordList").innerHTML = wordsFound.join("<br>");
    showAllBtn.style.display = "none";
})

function changeCurrentCell(dir) {
    currentCell += dir;
    if (currentCell === 0) currentCell = wordLength;
    if (currentCell === wordLength + 1) currentCell = 1;
    inputs[currentCell].focus();
}

function changeLength(len) {
    if (len < 12) lengthIndicator.innerHTML = len + " letters";
    else lengthIndicator.innerHTML = "Multiple words";

    // Show the correct amount of textboxes
    wordLength = len;
    if (wordLength == 12) wordLength = 0;  // Only word list will be displayed
    for (i = 1; i <= 11; i++) {
        inputs[i].disabled = !(i <= wordLength);
        inputs[i].value = "";
    }    

    if (wordLength === 0) wordLength = 12;
    findWords();  // Show all word with that length
}

function loadWords() {
    var file = "./wordlist.txt";
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", file, false);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status === 0) {
                var fileContent = rawFile.responseText;
                wordList = fileContent.split(",").sort();
            }
        }
    };
    rawFile.send(null);

    document.getElementById("listWordCount").innerHTML = "Complete known words list - <b>" + wordList.length + " words</b>"
    document.getElementById("listWordList").innerHTML = wordList.join("<br>");
}        

function findWords() {
    wordsFound = [];
    for (i = 0; i < wordList.length; i++) {
        if (wordList[i].length == wordLength || wordLength == 12) {
            if ((wordLength != 12 && wordList[i].search(" ") == -1) || (wordLength == 12 && wordList[i].search(" ") != -1)) {
                var ok = true;
                if (wordLength != 12) {
                    for (j = 0; j < wordLength; j++) {
                        var letter = document.getElementById("input" + (j+1)).value;
                        if (wordList[i].charAt(j).toUpperCase() != letter && letter !== "") {
                            ok = false;
                            break;
                        }
                    }
                }
                if (ok) wordsFound.push(wordList[i]);
            }
        }
    }

    var wordsPreview = wordsFound.slice(0, 15);
    if (wordsFound.length > 15) {
        showAllBtn.style.display = "inline-block";
        showAllBtn.innerHTML = "Show " + (wordsFound.length - 15) + " more"
    } else {
        showAllBtn.style.display = "none";
    }
    
    document.getElementById("wordList").innerHTML = wordsPreview.join("<br>");  // Print the words

    var count = wordsFound.length + " words were";
    if (wordsFound.length === 1) count = "1 word was";
    if (wordsFound.length === 0) count = "No words were";
    count += " found out of " + wordList.length;
    document.getElementById("wordCount").innerHTML = count;
}

changeLength(defaultLength);
loadWords();
findWords();