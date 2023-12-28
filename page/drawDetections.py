import sys
import json

# TODO Create a video with passed bboxes

with open("./output.txt", 'w') as f:
    f.write(sys.argv.join(" "))
    f.write(sys.stdin.readlines()[0])
