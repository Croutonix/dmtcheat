import re

server = None
while server not in ["mineplex", "hive", "hypixel"]:
    server = input("Server: ").lower()

newWords = input("New words list (comma separated): ")

newWordsList = []
for word in newWords.split(","):
    word = word.lower().strip()
    if len(word) > 0:
        if re.match(r"^[a-z0-9 -]*$", word):
            if word not in newWordsList:
                newWordsList.append(word)
        else:
            print("Word '{0}' must be only contain letters and numbers.".format(word))

filename = "wordlist-{0}.txt".format(server)
serverFile = open(filename, "r")
wordList = serverFile.read().split(",")

added = []
for word in newWordsList:
    if word not in wordList:
        wordList.append(word)
        added.append(word)

added.sort()
wordList.sort()

serverFile = open(filename, "w")
serverFile.write(",".join(wordList))
serverFile.close()

print("{0} out of {1} new words added, {2} words total."
      .format(len(added), len(newWordsList), len(wordList)))
print("\n" + ", ".join(added))