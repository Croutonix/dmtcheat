var servers = [
	{
		name: "Mineplex",
		game: "Draw My Thing",
		wordListFile: "./wordlist-mineplex.txt",
		defaultWordCount: 1,
		defaultWordLength: [[5], [5, 4], [3, 2, 4]],
	},
	{
		name: "Hive",
		game: "Draw It",
		wordListFile: "./wordlist-hive.txt",
		defaultWordCount: 1,
		defaultWordLength: [[5], [5, 5], [3, 3, 5]],
	},
	{
		name: "Hypixel",
		game: "Guess The Build",
		wordListFile: "./wordlist-hypixel.txt",
		defaultWordCount: 1,
		defaultWordLength: [[5], [5, 4], [3, 2, 4]],
	},
	// You can add more servers if you want, they will appear in the list automatically
]

const DEFAULT_SERVER_INDEX = 0;
const MAXIMUM_POSSIBLE_LENGTH = 20; // Excluding spaces, no word must be bigger than this (maximum number of hint inputs)
const HINT_SPACE_WIDTH = "40px";

const MAX_WORDS_SHOWN = 20;
const SPLIT_WORDS_COLUMN_AT = 10;

var selectedServer = servers[DEFAULT_SERVER_INDEX];
var wordCount;
var wordLength;

var rawWordLength;
var spaceIndexes;
var matchWords;
var allWordsShown;
var copiedWords;
var currentHint;

var wordCountRadio;
var wordLengthSpinner;
var hintInput;
var listLeftColumn;
var listRightColumn
var showAllBtn;
var resetCopyBtn;
var clearInputBtn;
var missingWordDiv;

/**
	Load word lists from all server and find max word count, 
	min/max possible lengths for each word count
*/
function loadWordLists() {
	for (var s = 0; s < servers.length; s++) {
		// Load word list for that server
		var rawFile = new XMLHttpRequest();
		rawFile.open("GET", servers[s].wordListFile, false);
		rawFile.onreadystatechange = function() {
			if (rawFile.readyState === 4) {
				if (rawFile.status === 200 || rawFile.status === 0) {
					servers[s].wordList = rawFile.responseText.split(",").sort();
				}
			}
		};
		rawFile.send(null);
		
		// Find max and min
		servers[s].maxWordCount = 1;
		var max = [];
		var min = [];
		for (var i = 0; i < 3; i++) {
			max.push([]);
			min.push([]);
			for (var j = 0; j <= i; j++) {
				max[i].push(0);
				min[i].push(100);
			}
		}
		
		var word;
		var parts;
		var wordCount;
		for (var i = 0; i < servers[s].wordList.length; i++) {
			word = servers[s].wordList[i];
			if (!servers[s].allowNumbers && /[0-9]/.test(word)) {
				servers[s].allowNumbers = true;
			}
			parts = word.split(" ");
			wordCount = parts.length;
			if (wordCount > servers[s].maxWordCount) servers[s].maxWordCount = wordCount;
			for (var j = 0; j < wordCount; j++) {
				var length = parts[j].length;
				if (length < min[wordCount-1][j]) min[wordCount-1][j] = length
				if (length > max[wordCount-1][j]) max[wordCount-1][j] = length
			}
		}
		
		servers[s].minWordLength = min;
		servers[s].maxWordLength = max;
	}
	
	console.log(servers);
}

/**
	Called when a server is selected
	@param server Server object
*/
function onServerSelected(server) {
	selectedServer = server;
	currentHint = 0;

	// Update elements for this server name and words
	document.getElementById("title").innerHTML = server.game + " Cheat";
	document.getElementById("word-list-modal-title").innerHTML = "Complete list of known words for this server <b>- " + selectedServer.wordList.length + " words</b>";
	document.getElementById("word-list-modal-list").innerHTML = selectedServer.wordList.join("<br>");

	// Select default settings for that server
	wordCount = server.defaultWordCount
	wordCountRadio[wordCount-1].checked = true;
	onWordCountChanged(wordCount);

	if (server.maxWordCount == 1) {
		document.getElementById("word-count-div").style.display = "none";
	} else if (server.maxWordCount == 2) {
		document.getElementById("word-count-div").style.display = "block";
		document.getElementById("word-count-2").style.display = "inline";
		document.getElementById("word-count-3").style.display = "none";
	} else {
		document.getElementById("word-count-div").style.display = "block";
		document.getElementById("word-count-2").style.display = "inline";
		document.getElementById("word-count-3").style.display = "inline";
	}
}

/**
	Called when number of words radio is checked
	@param count Between 0 and 2 depending on the server (1-3)
*/
function onWordCountChanged(count) {

	wordLength = selectedServer.defaultWordLength[count-1].slice(0);
	for (var i = 0; i < (count == 1 ? 1 : count+1); i++) {
		var word = (i <= 1 ? 0 : i-1);
		wordLengthSpinner[i].min = selectedServer.minWordLength[count-1][word];
		wordLengthSpinner[i].max = selectedServer.maxWordLength[count-1][word];
		wordLengthSpinner[i].value = wordLength[word];
	}
	onWordLengthChanged();

	if (count == 1) {
		document.getElementById("single-word-length-div").style.display = "block";
		document.getElementById("multiple-word-length-div").style.display = "none";
	} else if (count == 2) {
		document.getElementById("single-word-length-div").style.display = "none";
		document.getElementById("multiple-word-length-div").style.display = "block";
		document.getElementById("word-length-label-3").style.display = "none";
	} else {
		document.getElementById("single-word-length-div").style.display = "none";
		document.getElementById("multiple-word-length-div").style.display = "block";
		document.getElementById("word-length-label-3").style.display = "inline";
	}
}

/**
	Called when word length spinner value is changed
	@param length New length of the word
*/
function onWordLengthChanged() {
	// Adjust hint inputs to match words lengths
	rawWordLength = 0;
	spaceIndexes = [];
	for (var i = 0; i < wordCount; i++) {
		rawWordLength += wordLength[i];
		if (wordCount != 1 && i < wordCount-1) spaceIndexes.push(rawWordLength);
	}
	var spaces = spaceIndexes.slice(0);
	for (var i = 0; i < MAXIMUM_POSSIBLE_LENGTH; i++) {
		hintInput[i].style.display = (i < rawWordLength ? "inline" : "none");
		hintInput[i].value = "";
		if (spaces.length > 0 && i == spaces[0]) {
			// Add left margin to add space between words
			hintInput[i].style.marginLeft = HINT_SPACE_WIDTH;
			spaces.shift();
		} else {
			hintInput[i].style.marginLeft = "5px";  // Reset margin
		}
	}

	clearInputBtn.style.visibility = "hidden";

	findWords();  // Find words matching new length
}

/**
	Change current selected hint in a direction
	@param dir Either left (-1) or right (1)
*/
function changeCurrentHint(dir) {
	currentHint += dir;
	if (currentHint < 0) currentHint = rawWordLength-1;
	if (currentHint >= rawWordLength) currentHint = 0;
	hintInput[currentHint].focus();
}

/**
	Update word list to match the hints
*/
function findWords() {
	// Create template matching the hints -> dr_w _y th_ng
	var template = "";
	var spaces = spaceIndexes.slice(0);
	var showClear = false
	for (var i = 0; i < rawWordLength; i++) {
		if (spaces.length > 0 && i == spaces[0]) {
			template += " ";
			spaces.shift();
		}
		var val = hintInput[i].value;
		if (val.length == 0) {
			template += "_";
		} else {
			template += val.toLowerCase();
			showClear = true;
		}
	}
	clearInputBtn.style.visibility = (showClear ? "visible" : "hidden");

	// Find words in list matching template
	matchWords = [];
	for (var i = 0; i < selectedServer.wordList.length; i++) {
		var word = selectedServer.wordList[i];
		if (template.length == word.length) {
			var match = true;
			for (var j = 0; j < word.length; j++) {
				var char = template.charAt(j);
				if (!(char == "_" && word.charAt(j) != " " || char == word.charAt(j))) {
					match = false;
					break;
				}
			}
			if (match) matchWords.push(word);
		}
	}

	// Update word list
	var found = matchWords.length;
	if (found == 0) {
		document.getElementById("word-found-label").innerHTML = "No matches found";
		missingWordDiv.style.display = "block";
	} else if (found == 1) {
		document.getElementById("word-found-label").innerHTML = "1 match found";
		missingWordDiv.style.display = "none";
	} else {
		document.getElementById("word-found-label").innerHTML = found + " matches found";
		missingWordDiv.style.display = "none";
	}

	showFoundWords(false);

	// Show Show more words button if needed
	if (found > MAX_WORDS_SHOWN) {
		showAllBtn.style.visibility = "visible";
		showAllBtn.innerHTML = "Show " + (found - MAX_WORDS_SHOWN) + " more";
	} else {
		showAllBtn.style.visibility = "hidden";
	}
	allWordsShown = false;
	copiedWords = [];

	// Hide reset copy button
	resetCopyBtn.style.visibility = "hidden";
}

function addWordToList(list, index) {
	var word = document.createElement("p");
	word.innerHTML = matchWords[index];
	word.className = "word-found";
	word.title = "Click to copy to clipboard";
	word.addEventListener("click", function() {
		this.className += " word-found-copied";
		resetCopyBtn.style.visibility = "visible";
		copiedWords.push(index);
		copyToClipboard(matchWords[index]);
	})
	list.appendChild(word);
}

function showFoundWords(showAll) {
	var found = matchWords.length;

	while (listLeftColumn.hasChildNodes()) listLeftColumn.removeChild(listLeftColumn.lastChild);
	while (listRightColumn.hasChildNodes()) listRightColumn.removeChild(listRightColumn.lastChild);

	if (found == 0) {
		listLeftColumn.style.display = "none";
		listRightColumn.style.display = "none";
	} else if (found < SPLIT_WORDS_COLUMN_AT) {
		for (i = 0; i < found; i++) {
			addWordToList(listLeftColumn, i);
		}
		listLeftColumn.style.display = "inline-block";
		listRightColumn.style.display = "none";
	} else {
		var all = (showAll ? found : Math.min(found, MAX_WORDS_SHOWN));
		var half = Math.ceil(all/2);
		for (i = 0; i < half; i++) {
			addWordToList(listLeftColumn, i);
		}
		for (i = half; i < all; i++) {
			addWordToList(listRightColumn, i);
		}
		listLeftColumn.style.display = "inline-block";
		listRightColumn.style.display = "inline-block";
	}
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

function main() {
	// Load server word lists
	loadWordLists();
	
	// Server dropdown, add servers to list
	var serverDropdown = document.getElementById("server-dropdown");
	for (var i = 0; i < servers.length; i++) {
		var option = document.createElement("option");
		option.text = servers[i].name + " - " + servers[i].game;
		serverDropdown.add(option, i);
	}
	serverDropdown.addEventListener("change", function() {
		onServerSelected(servers[this.selectedIndex]);
	});

	// Word count radios
	wordCountRadio = document.querySelectorAll("input[name=word-count]");
	for (var i = 0; i < 3; i++) {
		wordCountRadio[i].addEventListener("change", (function(j) {
			return function() {
				wordCount = j+1
				onWordCountChanged(wordCount);
			};
		}(i)));
	}

	// Word length spinners
	wordLengthSpinner = document.querySelectorAll("input[name=word-length]");
	for (var i = 0; i < 4; i++) {
		(function(word) {
			wordLengthSpinner[i].addEventListener("focusin", function() {
				this.oldValue = this.value;
			});
			wordLengthSpinner[i].addEventListener("change", function() {
				// Only allow number value between server min and max for this word
				if (/^0|[1-9]\d*$/.test(this.value)) {
					if (this.value < selectedServer.minWordLength[wordCount-1][word]) {
						this.value = selectedServer.minWordLength[wordCount-1][word];
					} else if (this.value > selectedServer.maxWordLength[wordCount-1][word]) {
						this.value = selectedServer.maxWordLength[wordCount-1][word];
					}
					this.oldValue = this.value;
					wordLength[word] = parseInt(this.value);
					onWordLengthChanged();
				} else {
					// Not a number, use old value
					this.value = this.oldValue;
				}
			});
		})(i <= 1 ? 0 : i-1);
	}

	// Hint inputs
	hintInput = [];
	var hintDiv = document.getElementById("hint-div");
	for (var i = 0; i < MAXIMUM_POSSIBLE_LENGTH; i++) {
		var input = document.createElement("input");
		input.className = "input-hint";
		input.style.display = "none";
		input.addEventListener("input", function() {
			if (selectedServer.allowNumbers) {
				this.value = this.value.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
			} else {
				this.value = this.value.replace(/[^a-zA-Z]/g, "").toUpperCase();
			}
			if (this.value.length > 1) this.value = this.value.substring(1);

			findWords(); // Update word list

			if (currentHint < rawWordLength-1) changeCurrentHint(1);
		});
		input.addEventListener("keydown", function(event) {
			if (event.keyCode == 37) {  // Left
				changeCurrentHint(-1);
			} else if (event.keyCode == 39) {  // Right
				changeCurrentHint(1);
			} else if (event.keyCode == 46 || event.keyCode == 8) {  // Delete or Backspace
				this.value = "";
				findWords();
			}
		});
		(function(j) {
			input.addEventListener("focus", function(event) {
				currentHint = j;
			});
		})(i);
		hintDiv.appendChild(input);
		hintInput.push(input);
	}

	// Word list columns
	listLeftColumn = document.getElementById("left-word-found");
	listRightColumn = document.getElementById("right-word-found");

	// Show all word button
	showAllBtn = document.getElementById("show-all-btn");
	showAllBtn.addEventListener("click", function () {
		if (!allWordsShown) {
			allWordsShown = true;
			showFoundWords(true);

			var half = Math.ceil(matchWords.length/2);
			for (var i = 0; i < copiedWords.length; i++) {
				var index = copiedWords[i];
				if (index < half) {
					listLeftColumn.children[index].className += " word-found-copied";
				} else {
					listRightColumn.children[index-half].className += " word-found-copied";
				}
			}

			this.style.visibility = "hidden";
		}
	});

	// Reset copied words button
	resetCopyBtn = document.getElementById("reset-copy-btn");
	resetCopyBtn.addEventListener("click", function () {
		for (var i = 0; i < listLeftColumn.children.length; i++) {
			listLeftColumn.children[i].className = "word-found";
		}
		for (var i = 0; i < listRightColumn.children.length; i++) {
			listRightColumn.children[i].className = "word-found";
		}
		copiedWords = [];
		this.style.visibility = "hidden";
	});

	// Clear input button
	clearInputBtn = document.getElementById("clear-input-btn");
	clearInputBtn.style.visibility = "hidden";
	clearInputBtn.addEventListener("click", function() {
		clearInputBtn.style.visibility = "hidden";
		for (var i = 0; i < MAXIMUM_POSSIBLE_LENGTH; i++) {
			hintInput[i].value = "";
		}
		findWords();
	});

	// Missing word button
	missingWordDiv = document.getElementById("missing-word-div");
	missingWordDiv.style.display = "none";

	// Word list modal
	var wordListModal = document.getElementById("word-list-modal");
	var wordListBtn = document.getElementById("word-list-btn");
	var wordListCloseBtn = document.getElementById("word-list-modal-close");

	wordListBtn.addEventListener("click", function() {
		wordListModal.style.display = "block";
	});
	wordListCloseBtn.addEventListener("click", function() {
		wordListModal.style.display = "none";
	});

	// Help modal
	var helpModal = document.getElementById("help-modal");
	var helpBtn = document.getElementById("help-btn");
	var helpCloseBtn = document.getElementById("help-modal-close");

	helpBtn.addEventListener("click", function() {
		helpModal.style.display = "block";
	});
	helpCloseBtn.addEventListener("click", function() {
		helpModal.style.display = "none";
	});

	window.addEventListener("click", function(event) {
		// Close modals when clicked outside
		if (event.target == wordListModal) {
			wordListModal.style.display = "none";
		} else if (event.target == helpModal) {
			helpModal.style.display = "none";
		}
	});

	// Select default settings
	serverDropdown.selectedIndex = DEFAULT_SERVER_INDEX;
	onServerSelected(selectedServer);
}

main();
