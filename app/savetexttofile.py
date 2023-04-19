import sys
import json
import struct
import os

version = "0.2.0"
# import logging

# logging.basicConfig(filename="C:\savetexttofile\logs.log",
#                     filemode='a',
#                     format='%(asctime)s,%(msecs)d %(name)s %(levelname)s %(message)s',
#                     datefmt='%H:%M:%S',
#                     level=logging.DEBUG)
# logger = logging.getLogger('nativeMessage')


try:
    # Python 3.x version
    # Read a message from stdin and decode it.
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

    while True:
        configuration = getMessage()
        absoluteFilePath = ''
        saveMode = ''
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
            if configuration['directory'].endswith('/'):
                absoluteFilePath = configuration['directory'] + configuration['filename']
            else:
                absoluteFilePath = configuration['directory'] + '/' + configuration['filename']

            if configuration['conflictAction'] == 'append':
                saveMode = 'a'
                configuration['fileContent'] = '\n\n' + configuration['fileContent']
            else:
                saveMode = 'w+'
            try:
                with open(absoluteFilePath, saveMode, encoding = "utf-8") as file:
                    file.write('%s' % configuration['fileContent'])
                    file.close()
                    result['status'] = 'Success'
                    sendMessage(encodeMessage(json.dumps(result)))
            except IOError as e:
                print('Could not open or write to file (%s).' % e)
                sendMessage(encodeMessage(json.dumps(result)))

except AttributeError:
    # Python 2.x version (if sys.stdin.buffer is not defined)
    # Read a message from stdin and decode it.
    def getMessage():
        rawLength = sys.stdin.read(4)
        if len(rawLength) == 0:
            sys.exit(0)
        messageLength = struct.unpack('@I', rawLength)[0]
        message = sys.stdin.read(messageLength)
        return json.loads(message)

    # Encode a message for transmission,
    # given its content.
    def encodeMessage(messageContent):
        encodedContent = json.dumps(messageContent)
        encodedLength = struct.pack('@I', len(encodedContent))
        return {'length': encodedLength, 'content': encodedContent}

    # Send an encoded message to stdout
    def sendMessage(encodedMessage):
        sys.stdout.write(encodedMessage['length'])
        sys.stdout.write(encodedMessage['content'])
        sys.stdout.flush()

    while True:

        configuration = getMessage()
        absoluteFilePath = ''
        saveMode = ''
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
            if configuration['directory'].endswith('/'):
                absoluteFilePath = configuration['directory'] + configuration['filename']
            else:
                absoluteFilePath = configuration['directory'] + '/' + configuration['filename']

            if configuration['conflictAction'] == 'append':
                saveMode = 'a'
                configuration['fileContent'] = '\n\n' + configuration['fileContent']
            else:
                saveMode = 'w+'

            try:
                with open(absoluteFilePath, saveMode) as file:
                    file.write('%s' % configuration['fileContent'])
                    file.close()
                    result['status'] = 'Success'
                    sendMessage(encodeMessage(json.dumps(result)))
            except IOError as e:
                print('Could not open or write to file (%s).' % e)
                sendMessage(encodeMessage(json.dumps(result)))
