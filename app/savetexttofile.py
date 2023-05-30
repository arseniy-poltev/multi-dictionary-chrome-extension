import sys
import json
import struct
import os
import math
import codecs
import logging

version = "0.2.0"

# logging.basicConfig(filename="C:\savetexttofile\logs.log",
#                     filemode='a',
#                     format='%(asctime)s,%(msecs)d %(name)s %(levelname)s %(message)s',
#                     datefmt='%H:%M:%S',
#                     level=logging.DEBUG)
# logger = logging.getLogger('nativeMessage')


def getMessage():
    rawLength = sys.stdin.buffer.read(4)
    if len(rawLength) == 0:
        sys.exit(0)
    messageLength = struct.unpack('@I', rawLength)[0]
    message = sys.stdin.buffer.read(messageLength)
    res = message.decode("utf-8")
    return json.loads(res)

# Encode a message for transmission,
# given its content.
def encodeMessage(messageContent):
    encodedContent = json.dumps(messageContent).encode('utf-8')
    encodedLength = struct.pack('@I', len(encodedContent))
    return {'length': encodedLength, 'content': encodedContent}

# Send an encoded message to stdout
def sendMessage(encodedMessage):
    sys.stdout.buffer.write(encodedMessage['length'])
    sys.stdout.buffer.write(encodedMessage['content'])
    sys.stdout.buffer.flush()

def insertSorted(arr, item):
    min = 0
    max = len(arr)
    index = math.floor((min + max) / 2)
    while max > min:
        if item < arr[index]:
            max = index
        else: 
            min = index + 1
        index = math.floor((min + max) / 2)

    arr.insert(index, item)
    return arr

def binarySearch(arr, item):
    l = 0 
    r = len(arr) - 1
    while l <= r:
        m = l + math.floor((r - 1) / 2)
        if item == arr[m]:
            return True
        if item > arr[m]:
            l = m + 1
        else:
            r = m - 1
        
    return False

while True:
    configuration = getMessage()
    absoluteFilePath = ''
    result = {
        'status': 'Failure'
    }

    if configuration['action'] == 'TEST_CONNECTIVITY':
        result['status'] = 'Success'
        result['version'] = version
        scriptPath = os.path.dirname(os.path.abspath(__file__))
        result['scriptpath'] = scriptPath + os.sep
        sendMessage(encodeMessage(json.dumps(result)))
    else:

        directory = configuration['directory']
        word = configuration['word']
        mode = configuration['mode']
        locale = configuration['locale']
        lowPriority = configuration['lowPriority']
        
        if mode == 'ADD' or mode == 'SORT':
            fileName = locale + '-words.txt'
        else:
            fileName = locale + '-ignore.txt'

        if directory.endswith('/'):
            absoluteFilePath = directory + fileName
        else:
            absoluteFilePath = directory + '/' + fileName

        try:
            with codecs.open(absoluteFilePath, 'r', encoding="utf-8-sig") as file:
                result['status'] = 'Success'
                word_list = file.read().splitlines()
                file.close()

            if mode == 'SORT':
                with codecs.open(absoluteFilePath, 'w', encoding="utf-8-sig") as file:
                    locale_line = word_list[0]
                    word_list.pop(0)
                    word_list = sorted(word_list)
                    filecontent = '\n'.join(word_list)
                    filecontent = locale_line + '\n' + filecontent
                    file.write('%s' % filecontent)
                    file.close()
                    sendMessage(encodeMessage(json.dumps(result)))

            elif mode == 'ADD':
                with codecs.open(absoluteFilePath, 'w', encoding="utf-8-sig") as file:
                    locale_line = word_list[0]
                    word_list.pop(0)
                    if lowPriority == True:
                        removeItem = '~' + word
                        word_list = list(filter(lambda x: removeItem != x, word_list))

                    word_list = insertSorted(word_list, word)

                    filecontent = '\n'.join(word_list)
                    filecontent = locale_line + '\n' + filecontent
                    file.write('%s' % filecontent)
                    file.close()
                    sendMessage(encodeMessage(json.dumps(result)))

            elif mode == 'IGNORE':
                word_list = sorted(word_list)
                with open(absoluteFilePath, 'w', encoding="utf-8-sig") as file:
                    word_list = insertSorted(word_list, word)
                    filecontent = '\n'.join(word_list)
                    file.write('%s' % filecontent)
                    file.close()
                    
                if lowPriority == True:
                    absoluteFilePath = directory + '/' + locale + '-words.txt'
                    with codecs.open(absoluteFilePath, 'r', encoding="utf-8-sig") as file:
                        word_list = file.read().splitlines()
                        file.close()
                    with codecs.open(absoluteFilePath, 'w', encoding="utf-8-sig") as file:
                        locale_line = word_list[0]
                        word_list.pop(0)
                        removeItem = '~' + word
                        word_list = list(filter(lambda x: removeItem != x, word_list))
                        filecontent = '\n'.join(word_list)
                        filecontent = locale_line + '\n' + filecontent
                        file.write('%s' % filecontent)
                        file.close()
                sendMessage(encodeMessage(json.dumps(result)))
        except IOError as e:
            print('Could not open or write to file (%s).' % e)
            sendMessage(encodeMessage(json.dumps(result)))