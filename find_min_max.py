path = "wordlist.txt"
maxWordCount = 3

file = open(path, "r")
words = file.read().replace("\n", "").split(",")
file.close()

maxlen = []
minlen = []
for i in range(maxWordCount):
    maxlen.append([])
    minlen.append([])
    for j in range(i+1):
        maxlen[i].append(0)
        minlen[i].append(100)

for word in words:
    parts = word.split(" ")
    wordCount = len(parts)
    for i in range(wordCount):
        length = len(parts[i]);
        if (length < minlen[wordCount-1][i]): minlen[wordCount-1][i] = length
        if (length > maxlen[wordCount-1][i]): maxlen[wordCount-1][i] = length

print("MIN: " + str(minlen))
print("MAX: " + str(maxlen))
