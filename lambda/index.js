// 1. Text strings =====================================================================================================
//    Modify these strings and messages to change the behavior of your Lambda function


const languageString = {
  'en': {
    'translation': {
      'WELCOME': "Welcome to Busy Hands, a skill for Science Projects. This skill provides step by step instructions for  science projects. Find out what's available by saying, read project list or say start followed by your projects name to begin. You can also ask me for a list of equipment. For more information say, Help",
      'WELCOME_BACK': "Welcome back to Busy Hands. You can start a new project, read out the list of projects or get a fact. What can I help you with?",
      'TITLE': "Busy Hands",
      'HELP': "Busy Hands has science projects for you to try. To find out what is available say, read project list. You can then start a project by saying start followed by its name. You can ask me what equipement is required or ask for a science fact. Once you have started a project, say Next to advance to the next step. Pause to stop and come back to the same instruction later.",
      'STOP': "Okay, see you next time! "
    }
  }

};

// This sample demonstrates handling intents from an Alexa skill using the Alexa Skills Kit SDK (v2).
// Please visit https://alexa.design/cookbook for additional examples on implementing slots, dialog management,
// session persistence, api calls, and more.
const AWS = require("aws-sdk");
const Alexa = require('ask-sdk-core');
const Alex = require('ask-sdk');
const i18n = require('i18next');
const sprintf = require('i18next-sprintf-postprocessor');
const ddbAdapter = require('ask-sdk-dynamodb-persistence-adapter');
const TABLE_NAME = 'MyTest';

const GlobalHandlers = {

  RequestInterceptor: {
    async process(handlerInput) {
      console.log('Global.RequestInterceptor: pre-processing response');
      let {
        attributesManager,
        requestEnvelope
      } = handlerInput;
      let ctx = attributesManager.getRequestAttributes();
      let persistentAtttributes = await attributesManager.getPersistentAttributes();
      let sessionAttributes = attributesManager.getSessionAttributes();

      // Apply the persistent attributes to the current session
      attributesManager.setSessionAttributes(Object.assign({}, persistentAtttributes, sessionAttributes));

      /**
       * Log the request for debug purposes.
       */
      //console.log('----- REQUEST -----');
      //console.log(JSON.stringify(requestEnvelope, null, 2));

      /**
       * Ensure we're starting at a clean state.
       */
      ctx.directives = [];
      ctx.outputSpeech = [];
      ctx.reprompt = [];

      /**onAttributes(Object.assign({}, persistentAtttributes, sessionAttributes));
 
       * For ease of use we'll attach the utilities for rendering display
       * and handling localized tts to the request attributes.
       */
      console.log('Initializing messages for ' + handlerInput.requestEnvelope.request.locale);

      const localizationClient = i18n.use(sprintf).init({
        lng: handlerInput.requestEnvelope.request.locale,
        overloadTranslationOptionHandler: sprintf.overloadTranslationOptionHandler,
        resources: languageString,
        returnObjects: true
      });

      const attributes = handlerInput.attributesManager.getRequestAttributes();
      attributes.t = function (...args) {
        return localizationClient.t(...args);
      };


      console.log('Global.RequestInterceptor: pre-processing response complete');
    }
  },
  ResponseInterceptor: {
    async process(handlerInput) {
      console.log('Global.ResponseInterceptor: post-processing response');
      let {
        attributesManager,
        responseBuilder
      } = handlerInput;
      let ctx = attributesManager.getRequestAttributes();
      let sessionAttributes = attributesManager.getSessionAttributes();
      let persistentAtttributes = await attributesManager.getPersistentAttributes();

      /**
       * Log the attributes and response for debug purposes.
       */
      console.log('----- REQUEST ATTRIBUTES -----');
      console.log(JSON.stringify(ctx, null, 2));

      console.log('----- SESSION ATTRIBUTES -----');
      console.log(JSON.stringify(sessionAttributes, null, 2));

      console.log('----- CURRENT PERSISTENT ATTRIBUTES -----');
      console.log(JSON.stringify(persistentAtttributes, null, 2));

      /**
       * Build the speech response.
       */
      if (ctx.outputSpeech.length > 0) {
        let outputSpeech = ctx.outputSpeech.join(' ');
        console.log('Global.ResponseInterceptor: adding ' +
          ctx.outputSpeech.length + ' speech parts');
        responseBuilder.speak(outputSpeech);
      }

      if (ctx.reprompt.length > 0) {
        console.log('Global.ResponseInterceptor: adding ' +
          ctx.outputSpeech.length + ' speech reprompt parts');
        let reprompt = ctx.reprompt.join(' ');
        responseBuilder.reprompt(reprompt);
      }

      /**
       * Add the display response
       */
      /* if (ctx.renderTemplate) {
         responseBuilder.addRenderTemplateDirective(ctx.renderTe[Error]: The lambda deploy failed for Alexa region "default": Error [ERR_SOCKET_CONNECTION_TIMEOUT]: Socket connection timeout
mplate);
         console.log('RENDER TEMPLATE IF STATEMENT')
       } */

      let response = responseBuilder.getResponse();

      /**
       * Apply the custom directives to the response.
       */
      if (Array.isArray(ctx.directives)) {
        console.log('Global.ResponseInterceptor: processing ' + ctx.directives.length + ' custom directives ');
        response.directives = response.directives || [];
        for (let i = 0; i < ctx.directives.length; i++) {
          response.directives.push(ctx.directives[i]);
        }
      }
      /*
            if ('openMicrophone' in ctx) {
              if (ctx.openMicrophone) {
                /**
                 * setting shouldEndSession = false - lets Alexa know that we want an answer from the user
                 * see: https://developer.amazon.com/docs/gadget-skills/receive-voice-input.html#open
                 *      https://developer.amazon.com/docs/gadget-skills/keep-session-open.html
                 
                response.shouldEndSession = false;
                console.log('Global.ResponseInterceptor: request to open microphone -> shouldEndSession = false');
              } else {
                if (ctx.endSession){
                  // We have explicitely asked for the session to end
                  response.shouldEndSession = true;
                } else {
                  /**
                   * deleting shouldEndSession will keep the skill session going,
                   * while the input handler is active, waiting for button presses
                   * see: https://developer.amazon.com/docs/gadget-skills/keep-session-open.html
                   
                  delete response.shouldEndSession;
                }
      
                console.log('Global.ResponseInterceptor: request to open microphone -> delete shouldEndSession');
              }
            } */

      /**
       * Persist the current session attributes
       */
      attributesManager.setPersistentAttributes(sessionAttributes);
      await attributesManager.savePersistentAttributes();
      console.log('----- NEW PERSISTENT ATTRIBUTES -----');
      console.log(JSON.stringify(persistentAtttributes, null, 2));

      /**
       * Log the attributes and response for debug purposes.
       */
      console.log('----- RESPONSE -----');
      console.log(JSON.stringify(response, null, 2));

      return response;
    }
  },
};

const LaunchRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'LaunchRequest';
  },
  async handle(handlerInput) {
    console.log('launch');
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    console.log(sessionAttributes)

    const attributesManager = handlerInput.attributesManager;
    console.log(attributesManager)
    let attributes = { "counter": 10 };
    // Set persistent attributes
    attributesManager.setPersistentAttributes(attributes);
    console.log("ATT MANAGER")
    await attributesManager.savePersistentAttributes();

    if (Object.keys(sessionAttributes).length === 0) {
      sessionAttributes.user = true
      say = "Welcome"
    } else {
      say = "welcome Back";
    }


    let speakOutput = say;

    console.log("Session Att")
    console.log(sessionAttributes)


    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};



const LogActivityIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LogActivityIntent';
  },
  async handle(handlerInput) {

    var currentCyclePhase = handlerInput.requestEnvelope.request.intent.slots.cyclePhase.value;

    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes() || {};
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    if (currentCyclePhase.toLowerCase().includes("start")) {
      currentCyclePhase = "start";
    } else if (currentCyclePhase.toLowerCase().includes("stop")) {
      currentCyclePhase = "stop";
    } else {
      // Default to "start" if neither "start" nor "stop" is found
      //Maybe include something here where it says not sure
      currentCyclePhase = "start";
    }

    // Get the current timestamp
    const currentTimestamp = new Date().toISOString();

    // Check if there is an array in the session attributes to store timestamps
    if (!sessionAttributes.timestamps) {
      sessionAttributes.timestamps = [];
    }
    if (!sessionAttributes.cyclePhase) {
      sessionAttributes.cyclePhase = [];
    }
    if (!sessionAttributes.logType) {
      sessionAttributes.logType = [];
    }

    const timestampsLength = sessionAttributes.timestamps.length;
    const cyclePhaseLength = sessionAttributes.cyclePhase.length;


    // Check if the last recorded cyclePhase is "start" and the currentCyclePhase is also "start"
    if (
      cyclePhaseLength > 0 &&
      sessionAttributes.cyclePhase[cyclePhaseLength - 1] === "start" &&
      currentCyclePhase === "start"
    ) {
      speakOutput = "You have not stopped your last session.";
      reprompt = "How long? Delete, or set to your average time."
      speakOutput = speakOutput + " " + reprompt

      return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(reprompt)
        .getResponse();

    } else {
      // Add the current timestamp and cyclePhase to the arrays
      sessionAttributes.timestamps.push(currentTimestamp);
      sessionAttributes.cyclePhase.push(currentCyclePhase);
      sessionAttributes.logType.push("Timestamp");


      // Update speakOutput with the relevant information
      speakOutput = "You triggered " + currentCyclePhase + " logged." + " and last logged is" + sessionAttributes.cyclePhase[cyclePhaseLength - 1] + "Cycle phase length is " + cyclePhaseLength + ". Timestamp length is " + timestampsLength + ". Activity is logged at " + sessionAttributes.timestamps[timestampsLength - 1];

      return handlerInput.responseBuilder
        .speak(speakOutput)
        //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
        .getResponse();
    }
  }
};

const LogActivityDurationIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LogActivityDurationIntent';
  },
  async handle(handlerInput) {

    var currentHourDuration = handlerInput.requestEnvelope.request.intent.slots.hourDuration.value;
    var currentMinuteDuration = handlerInput.requestEnvelope.request.intent.slots.minuteDuration.value;

    currentCyclePhase = "stop"

    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes() || {};
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const timestampsLength = sessionAttributes.timestamps.length;
    const cyclePhaseLength = sessionAttributes.cyclePhase.length;

    const lastTimestamp = sessionAttributes.timestamps[timestampsLength - 1]

    const lastTimestampDate = new Date(lastTimestamp);

    // Add currentHourDuration and currentMinuteDuration to the Date object
    lastTimestampDate.setHours(lastTimestampDate.getHours() + parseInt(currentHourDuration, 10) || 0);
    lastTimestampDate.setMinutes(lastTimestampDate.getMinutes() + parseInt(currentMinuteDuration, 10) || 0);

    // Convert the modified Date object back to the desired format
    const updatedTimestamp = lastTimestampDate.toISOString();

    sessionAttributes.timestamps.push(updatedTimestamp);
    sessionAttributes.cyclePhase.push(currentCyclePhase);
    sessionAttributes.logType.push("Duration");




    // Check if the last recorded cyclePhase is "start" and the currentCyclePhase is also "start"



    // Update speakOutput with the relevant information
    speakOutput = "You said " + currentHourDuration + " and " + currentMinuteDuration + " updated " + updatedTimestamp;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();

  }
};
const ReadActivityIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ReadActivityIntent';
  },
  async handle(handlerInput) {

    const attributesManager = handlerInput.attributesManager;

    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    // Assuming sessionAttributes.timestamps and sessionAttributes.cyclePhase are defined
    const lastTimestamp = sessionAttributes.timestamps[sessionAttributes.timestamps.length - 1];
    const previousTimestamp = sessionAttributes.timestamps[sessionAttributes.timestamps.length - 2];
    const lastCyclePhase = sessionAttributes.cyclePhase[sessionAttributes.cyclePhase.length - 1];

    let endReferenceTimestamp;
    let startReferenceTimestamp;

    // Use the stop timestamp if the last cyclePhase is "stop", otherwise use the current time
    if (lastCyclePhase === "stop") {
      endReferenceTimestamp = new Date(lastTimestamp);
      startReferenceTimestamp = new Date(previousTimestamp);

    } else {
      endReferenceTimestamp = new Date();
      startReferenceTimestamp = new Date(lastTimestamp);
    }

    // Calculate the difference in milliseconds
    const timeDifferenceInMilliseconds = endReferenceTimestamp - startReferenceTimestamp;

    // Convert milliseconds to hours and minutes
    const hours = Math.floor(timeDifferenceInMilliseconds / (1000 * 60 * 60));
    const remainingMilliseconds = timeDifferenceInMilliseconds % (1000 * 60 * 60);
    const minutes = Math.floor(remainingMilliseconds / (1000 * 60));

    const speakHours = hours === 1 ? hours + " hour" : hours > 1 ? hours + " hours" : "";
    const speakMinutes = minutes === 1 ? minutes + " minute" : minutes + " minutes";

    let speakOutput = endReferenceTimestamp + " " + startReferenceTimestamp + " " + lastCyclePhase + `Your last sleep cycle was ` + (speakHours ? speakHours + " " : "") + speakMinutes;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();
  }
};

const DeleteActivityIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'DeleteActivityIntent';
  },
  async handle(handlerInput) {

    const attributesManager = handlerInput.attributesManager;

    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    // Assuming sessionAttributes.timestamps and sessionAttributes.cyclePhase are defined
    const lastTimestamp = sessionAttributes.timestamps[sessionAttributes.timestamps.length - 1];
    const hours = Math.floor(timeDifferenceInMilliseconds / (1000 * 60 * 60));
    const remainingMilliseconds = timeDifferenceInMilliseconds % (1000 * 60 * 60);
    const minutes = Math.floor(remainingMilliseconds / (1000 * 60));
    sessionAttributes.timestamps.pop();
    sessionAttributes.cyclePhase.pop();
    sessionAttributes.logType.pop();

    // Get the current timestamp
    const currentTimestamp = new Date().toISOString();

    // Check if there is an array in the session attributes to store timestamps
    if (!sessionAttributes.timestamps) {
      sessionAttributes.timestamps = [];
    }
    if (!sessionAttributes.cyclePhase) {
      sessionAttributes.cyclePhase = [];
    }
    if (!sessionAttributes.logType) {
      sessionAttributes.logType = [];
    }

    // Add the current timestamp and cyclePhase to the arrays
    sessionAttributes.timestamps.push(currentTimestamp);
    sessionAttributes.cyclePhase.push("start");
    sessionAttributes.logType.push("Timestamp")


    let speakOutput = "The last one was deleted and a new cycle is logged";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();
  }
};

const LogAverageActivityIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'LogAverageActivityIntent';
  },
  async handle(handlerInput) {

    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    // Assuming sessionAttributes.timestamps and sessionAttributes.cyclePhase are defined
    const lastTimestampString = sessionAttributes.timestamps[sessionAttributes.timestamps.length - 1];


    // Extract "start" and "stop" pairs and calculate sleep time
    const sleepTimes = [];
    for (let i = 0; i < sessionAttributes.cyclePhase.length - 1; i++) {
      if (sessionAttributes.cyclePhase[i] === "start" && sessionAttributes.cyclePhase[i + 1] === "stop") {

        const sleepTime = calculateTimeDifference(sessionAttributes.timestamps[i], sessionAttributes.timestamps[i + 1]);
        sleepTimes.push(sleepTime);
      }
    }

    // Calculate the average sleep time
    const averageSleepTimeInMinutes = sleepTimes.length > 0 ? sleepTimes.reduce((sum, time) => sum + time, 0) / sleepTimes.length : 0;

    const hours = Math.floor(averageSleepTimeInMinutes / 60);
    const minutes = Math.round(averageSleepTimeInMinutes % 60);

    const formattedAverageSleepTime = `${hours} hours ${minutes} minutes`;
    const lastTimestamp = new Date(lastTimestampString)
    const newTimestamp = new Date(lastTimestamp);
    newTimestamp.setHours(lastTimestamp.getHours() + hours);
    newTimestamp.setMinutes(lastTimestamp.getMinutes() + minutes);


    // Concatenate with last timestamp

    sessionAttributes.timestamps.push(newTimestamp);
    sessionAttributes.cyclePhase.push("stop");
    sessionAttributes.logType.push("average")

    let speakOutput = "Sleep Times:" + sleepTimes + " Average Sleep Time (minutes):" + formattedAverageSleepTime + "newtimestamp " + newTimestamp;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();
  }
};
const HelpIntentHandler = {

  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.HelpIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'You can say hello to me! How can I help?';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};
const CancelAndStopIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.CancelIntent'
        || Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.StopIntent');
  },
  handle(handlerInput) {
    const speakOutput = 'Goodbye!';
    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();
  }
};

/* *
 * FallbackIntent triggers when a customer says something that doesn’t map to any intents in your skill
 * It must also be defined in the language model (if the locale supports it)
 * This handler can be safely added but will be ignored in locales that do not support it yet 
 * */
const FallbackIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.FallbackIntent';
  },
  handle(handlerInput) {
    const speakOutput = 'Sorry, I don\'t know about that. Please try again.';

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

/* *
 * SessionEndedRequest notifies that a session was ended. This handler will be triggered when a currently open 
 * session is closed for one of the following reasons: 1) The user says "exit" or "quit". 2) The user does not 
 * respond or says something that does not match an intent defined in your voice model. 3) An error occurs 
 * */
const SessionEndedRequestHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'SessionEndedRequest';
  },
  handle(handlerInput) {
    // Any cleanup logic goes here.
    return handlerInput.responseBuilder.getResponse();
  }
};

// The intent reflector is used for interaction model testing and debugging.
// It will simply repeat the intent the user said. You can create custom handlers
// for your intents by defining them above, then also adding them to the request
// handler chain below.
const IntentReflectorHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest';
  },
  handle(handlerInput) {
    const intentName = Alexa.getIntentName(handlerInput.requestEnvelope);
    const speakOutput = `You just triggered ${intentName}`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();
  }
};

// Generic error handling to capture any syntax or routing errors. If you receive an error
// stating the request handler chain is not found, you have not implemented a handler for
// the intent being invoked or included it in the skill builder below.
const ErrorHandler = {
  canHandle() {
    return true;
  },
  handle(handlerInput, error) {
    console.log(`~~~~ Error handled: ${error.stack}`);
    const speakOutput = `Sorry, I had trouble doing what you asked. Please try again.`;

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
  }
};

// The SkillBuilder acts as the entry point for your skill, routing all request and response
// payloads to the handlers above. Make sure any new handlers or interceptors you've
// defined are included below. The order matters - they're processed top to bottom.




exports.handler = function (event, context) {
  let factory = Alex.SkillBuilders.standard()
    .addRequestHandlers(
      LaunchRequestHandler,
      LogActivityIntentHandler,
      LogActivityDurationIntentHandler,
      ReadActivityIntentHandler,
      DeleteActivityIntentHandler,
      LogAverageActivityIntentHandler,
      HelpIntentHandler,
      CancelAndStopIntentHandler,
      FallbackIntentHandler,
      SessionEndedRequestHandler,
      IntentReflectorHandler, // make sure IntentReflectorHandler is last so it doesn't override your custom intent handlers

    )
    .addErrorHandlers(ErrorHandler)
    // .addRequestInterceptors(LocalizationInterceptor)
    .addRequestInterceptors(GlobalHandlers.RequestInterceptor)
    .addResponseInterceptors(GlobalHandlers.ResponseInterceptor)

  // if (settings.APP_ID) {
  // factory.withSkillId(settings.APP_ID);
  //}

  console.log("===ENV VAR DYNAMODBTABLE===: " + process.env.DYNAMODB_TABLE_NAME);
  if (process.env.DYNAMODB_TABLE_NAME && process.env.DYNAMODB_TABLE_NAME !== '') {
    TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;
    console.log("===STORAGE SESSION TABLE Set to===: " + settings.STORAGE.SESSION_TABLE);
  }

  if (TABLE_NAME) {
    factory.withTableName(TABLE_NAME)
      .withAutoCreateTable(true);
  }

  let skill = factory.create();

  return skill.invoke(event, context);
}

function calculateTimeDifference(startTimestamp, endTimestamp) {
  const start = new Date(startTimestamp);
  const end = new Date(endTimestamp);
  const timeDifference = end - start; // Time difference in milliseconds
  return timeDifference / (1000 * 60); // Convert to minutes
}



