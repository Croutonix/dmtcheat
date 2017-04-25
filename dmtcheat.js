var MAX_SHOWN = 15;
var DEFAULT_LENGTH = 5;

var LIST_FILE = "wordlist.txt";

var currentCell = -1;
var wordLength;
var wordList = [];
var wordsFound;
var allShown = false;

// FIND ALL INPUTS
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

// LENGTH SLIDER
var lengthSlider = new Slider("#lengthSlider", {}).on("change", function(len) {
    changeLength(len.newValue);
});
var lengthIndicator = document.getElementById("lengthIndicator");

// SHOW ALL BUTTON
var showAllBtn = document.getElementById("showAllBtn");
showAllBtn.addEventListener("click", function(event) {
	if (allShown) return;
	allShown = true;
	for (i = MAX_SHOWN; i < wordsFound.length; i++) {
    	document.getElementById("wordList").innerHTML += '<p class="foundWord" title="Click to copy to clipboard" onclick="copyWord(this, ' + i.toString() + ')">' + wordsFound[i] + '</p>';
    }
    showAllBtn.style.display = "none";
})

// RESET COPIED WORDS BUTTON
var resetBtn = document.getElementById("resetBtn");
resetBtn.addEventListener("click", function(event) {
	var len = allShown ? wordsFound.length : Math.min(wordsFound.length, MAX_SHOWN);
	var words = "";
    for (i = 0; i < len; i++) {
    	words += '<p class="foundWord" title="Click to copy to clipboard" onclick="copyWord(this, ' + i.toString() + ')">' + wordsFound[i] + '</p>';
    }
    document.getElementById("wordList").innerHTML = words;
    resetBtn.style.display = "none";
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
    var rawFile = new XMLHttpRequest();
    rawFile.open("GET", LIST_FILE, false);
    rawFile.onreadystatechange = function() {
        if (rawFile.readyState === 4) {
            if (rawFile.status === 200 || rawFile.status === 0) {
                var fileContent = rawFile.responseText;
                wordList = fileContent.split(",").sort();
            }
        }
    };
    rawFile.send(null);
    wordList.splice(-1, 1);  // Remove last empty item because there's a comma at the end

    document.getElementById("listWordCount").innerHTML = "Complete known words list - <b>" + wordList.length + " words</b>"
    document.getElementById("listWordList").innerHTML = wordList.join("<br>");
}        


function findWords() {
	// Find the matching words
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

    allShown = false;
    if (wordsFound.length > MAX_SHOWN) {
        showAllBtn.style.display = "inline-block";
        showAllBtn.innerHTML = "Show " + (wordsFound.length - MAX_SHOWN) + " more"
    } else {
        showAllBtn.style.display = "none";
    }
    resetBtn.style.display = "none";
    
    var words = "";
    for (i = 0; i < Math.min(wordsFound.length, MAX_SHOWN); i++) {
    	words += '<p class="foundWord" title="Click to copy to clipboard" onclick="copyWord(this, ' + i + ')">' + wordsFound[i] + '</p>';
    }
    document.getElementById("wordList").innerHTML = words;

    var count = wordsFound.length + " words were";
    if (wordsFound.length === 1) count = "1 word was";
    if (wordsFound.length === 0) count = "No words were";
    count += " found out of " + wordList.length;
    document.getElementById("wordCount").innerHTML = count;
}


function copyWord(element, index) {
	element.className += " foundWordCopied";
	copyToClipboard(wordsFound[index]);
	resetBtn.style.display = "inline-block";
}


function copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
        // IE specific code path to prevent textarea being shown while dialog is visible.
        return clipboardData.setData("Text", text); 

    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");  // Security exception may be thrown by some browsers.
        } catch (ex) {
            console.warn("Copy to clipboard failed", ex);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}


changeLength(DEFAULT_LENGTH);
loadWords();
findWords();
