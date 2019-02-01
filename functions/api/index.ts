import * as dialogflow from 'dialogflow';
import * as line from '@line/bot-sdk';

let channelSecret: string = '';
if (process.env.CHANNEL_SECRET) {
    channelSecret = process.env.CHANNEL_SECRET;
}

let channelAccessToken: string = '';
if (process.env.CHANNEL_ACCESS_TOKEN) {
    channelAccessToken = process.env.CHANNEL_ACCESS_TOKEN;
}

let client_email: string = '';
let private_key: string = '';
if (process.env.CLIENT_EMAIL) {
    client_email = process.env.CLIENT_EMAIL;
}

if (process.env.PRIVATE_KEY) {
    private_key = process.env.PRIVATE_KEY;
}

let credentials: dialogflow.ClientOptions = {
    'credentials': {
        'client_email': client_email,
        'private_key': private_key
    }
}

const dfClient = new dialogflow.SessionsClient(credentials);
const lineClient = new line.Client({channelAccessToken: channelAccessToken});

exports.handler = async(event: any) => {
    console.log(JSON.stringify(event));

    if(!line.validateSignature(event.body, channelSecret, event.headers['X-Line-Signature'])) {
        console.log('ERROR: X-Line-Signature Error.');
        return;
    } else {
        console.log('Signature Verify.');
    }

    let body = JSON.parse(event.body);
    let messageEvent: line.MessageEvent = body.events[0];
    let userId: string = '';
    if (messageEvent.source.userId) {
        userId = messageEvent.source.userId;
    }
    if (userId == 'Udeadbeefdeadbeefdeadbeefdeadbeef') {
        console.log('INFO: Signature Check.');
    } else {
        let projectId: string = '';
        if (process.env.PROJECT_ID) {
            projectId = process.env.PROJECT_ID;
        }

        let query: string = '';
        if (messageEvent.message.type == 'text') {
            query = messageEvent.message.text;
        }

        const sessionPath: string = dfClient.sessionPath(projectId, userId);
        const request: dialogflow.DetectIntentRequest = {
            session: sessionPath,
            queryInput: {
                text: {
                    text: query,
                    languageCode: 'ja-JP'
                }
            }
        };

        let result: dialogflow.DetectIntentResponse[] = await dfClient.detectIntent(request);
        let messageLength: number = result[0].queryResult.fulfillmentMessages.length;
        let messages: any[] = [];
        
        for (let i = 0; i < messageLength; i++) {
            messages.push({type: 'text', text: result[0].queryResult.fulfillmentText});
            if (result[0].queryResult.fulfillmentMessages[i].payload) {
                messages.push(result[0].queryResult.fulfillmentMessages[i].payload);
            }
        }

        console.log('messages: ' + messages);
        await lineClient.replyMessage(messageEvent.replyToken, messages);
    }

    return { statusCode: 200 };
};