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
    console.log("----INFO----LogActivityIntentHandler")
    var currentCyclePhase = handlerInput.requestEnvelope.request.intent.slots.cyclePhase.value;
    var currentCycleType = handlerInput.requestEnvelope.request.intent.slots.cycleType.value;
    var currentBottleFeedAmount = handlerInput.requestEnvelope.request.intent.slots.bottleAmount.value;

    if (currentCycleType === undefined && currentBottleFeedAmount != undefined) {
      currentCycleType = "bottle feed"
    }

    if (currentCyclePhase === undefined) {
      currentCyclePhase = "start"
    }

    console.log("currentCyclePhase " + currentCyclePhase)
    console.log("currentCycleType " + currentCycleType)
    console.log("currentBottleFeedAmount " + currentBottleFeedAmount)

    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes() || {};
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    let timestampsLength = 0;
    let cyclePhaseLength = 0;
    let speakOutput = "hi";



    if (currentCyclePhase.toLowerCase().includes("start")) {
      currentCyclePhase = "start";
    } else if (currentCyclePhase.toLowerCase().includes("stop")) {
      currentCyclePhase = "stop";
    } else {
      // Default to "start" if neither "start" nor "stop" is found
      //Maybe include something here where it says not sure
      currentCyclePhase = "start";
    }

    const currentTimestamp = new Date().toISOString();

    if (currentCycleType.includes("sleep")) {
      console.log("In Sleep Cycle ")

      timestampsLength = sessionAttributes.sleepTimestamps ? sessionAttributes.sleepTimestamps.length : 0;
      cyclePhaseLength = sessionAttributes.sleepCyclePhase ? sessionAttributes.sleepCyclePhase.length : 0;

      // Check if the last recorded cyclePhase is "start" and the currentCyclePhase is also "start"
      if (
        cyclePhaseLength > 0 &&
        sessionAttributes.sleepCyclePhase[cyclePhaseLength - 1] === "start" &&
        currentCyclePhase === "start"
      ) {
        sessionAttributes.tempCycleType = "sleep"
        speakOutput = "You have not stopped your last session.";
        reprompt = "How long? Delete, or set to your average time."
        speakOutput = speakOutput + " " + reprompt

        return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt(reprompt)
          .getResponse();
      }

      sessionAttributes.sleepTimestamps = sessionAttributes.sleepTimestamps || [];
      sessionAttributes.sleepCyclePhase = sessionAttributes.sleepCyclePhase || [];
      sessionAttributes.sleepLogType = sessionAttributes.sleepLogType || [];
      sessionAttributes.sleepCycleType = sessionAttributes.sleepCycleType || [];

      sessionAttributes.sleepTimestamps.push(currentTimestamp);
      sessionAttributes.sleepCyclePhase.push(currentCyclePhase);
      sessionAttributes.sleepLogType.push("Timestamp");
      sessionAttributes.sleepCycleType.push(currentCycleType); // Now push should work

      timestampsLength = sessionAttributes.sleepTimestamps.length;
      cyclePhaseLength = sessionAttributes.sleepCyclePhase.length;

      // Update speakOutput with the relevant information
      speakOutput = "You triggered " + currentCyclePhase + " logged." + " and last logged is" + sessionAttributes.sleepCyclePhase[cyclePhaseLength - 1] + "Cycle phase length is " + cyclePhaseLength
        + ". Timestamp length is " + timestampsLength + ". Activity is logged at "
        + sessionAttributes.sleepTimestamps[timestampsLength - 1]
        + " Cycle Type " + currentCycleType;

    } else if (currentCycleType.includes("breast")) {
      console.log("In Breast Feed ")

      timestampsLength = sessionAttributes.breastFeedTimestamps ? sessionAttributes.breastFeedTimestamps.length : 0;
      cyclePhaseLength = sessionAttributes.breastFeedCyclePhase ? sessionAttributes.breastFeedCyclePhase.length : 0;

      // Check if the last recorded cyclePhase is "start" and the currentCyclePhase is also "start"
      if (
        cyclePhaseLength > 0 &&
        sessionAttributes.breastFeedCyclePhase[cyclePhaseLength - 1] === "start" &&
        currentCyclePhase === "start"
      ) {
        sessionAttributes.tempCycleType = "breast feed"
        speakOutput = "You have not stopped your last session.";
        reprompt = "How long? Delete, or set to your average time."
        speakOutput = speakOutput + " " + reprompt

        return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt(reprompt)
          .getResponse();
      }
      sessionAttributes.breastFeedTimestamps = sessionAttributes.breastFeedTimestamps || [];
      sessionAttributes.breastFeedCyclePhase = sessionAttributes.breastFeedCyclePhase || [];
      sessionAttributes.breastFeedLogType = sessionAttributes.breastFeedLogType || [];
      sessionAttributes.breastFeedCycleType = sessionAttributes.breastFeedCycleType || [];

      sessionAttributes.breastFeedTimestamps.push(currentTimestamp);
      sessionAttributes.breastFeedCyclePhase.push(currentCyclePhase);
      sessionAttributes.breastFeedLogType.push("Timestamp");
      sessionAttributes.breastFeedCycleType.push(currentCycleType); // Now push should work

      timestampsLength = sessionAttributes.breastFeedTimestamps.length;
      cyclePhaseLength = sessionAttributes.breastFeedCyclePhase.length;

      // Update speakOutput with the relevant information
      speakOutput = "You triggered Breast Feed" + currentCyclePhase + " logged." + " and last logged is" + sessionAttributes.breastFeedCyclePhase[cyclePhaseLength - 1] + "Cycle phase length is " + cyclePhaseLength
        + ". Timestamp length is " + timestampsLength + ". Activity is logged at "
        + sessionAttributes.breastFeedTimestamps[timestampsLength - 1]
        + " Cycle Type " + currentCycleType;

    } else if (currentCycleType.includes("bottle")) {
      console.log("Bottle Feed ")

      timestampsLength = sessionAttributes.bottleFeedTimestamps ? sessionAttributes.bottleFeedTimestamps.length : 0;
      cyclePhaseLength = sessionAttributes.bottleFeedCyclePhase ? sessionAttributes.bottleFeedCyclePhase.length : 0;

      // Check if the last recorded cyclePhase is "start" and the currentCyclePhase is also "start"

      sessionAttributes.bottleFeedTimestamps = sessionAttributes.bottleFeedTimestamps || [];
      sessionAttributes.bottleFeedAmount = sessionAttributes.bottleFeedAmount || [];
      sessionAttributes.bottleFeedLogType = sessionAttributes.bottleFeedLogType || [];



      // Update speakOutput with the relevant information
      if (currentBottleFeedAmount != undefined) {
        speakOutput = "You have logged a Bottle Feed with amount " + currentBottleFeedAmount
        sessionAttributes.bottleFeedTimestamps.push(currentTimestamp);
        sessionAttributes.bottleFeedAmount.push(currentBottleFeedAmount);
        sessionAttributes.bottleFeedLogType.push("Log Activity");
  
        timestampsLength = sessionAttributes.bottleFeedAmount.length;
        cyclePhaseLength = sessionAttributes.bottleFeedCyclePhase.length;
      } else {

        speakOutput = "You have logged a Bottle Feed but not specified an amount"
        reprompt = "Say the amount or do you want to finish logging later"
        speakOutput = speakOutput + reprompt

        sessionAttributes.substate = 2 //Bottle Feed Clarification Required

        return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt(reprompt)
          .getResponse();
      }



      //If feed type is not specified
    } else if (currentCycleType.includes("feed") && !currentCycleType.includes("bottle") && !currentCycleType.includes("breast")) {
      sessionAttributes.defaultFeed = sessionAttributes.defaultFeed || [];
      const defaultFeed = sessionAttributes.defaultFeed
      if (defaultFeed.includes("breast")) {
        console.log("Default Feed = Breast")
        sessionAttributes.breastFeedTimestamps = sessionAttributes.breastFeedTimestamps || [];
        sessionAttributes.breastFeedCyclePhase = sessionAttributes.breastFeedCyclePhase || [];
        sessionAttributes.breastFeedLogType = sessionAttributes.breastFeedLogType || [];
        sessionAttributes.breastFeedCycleType = sessionAttributes.breastFeedCycleType || [];

        sessionAttributes.breastFeedTimestamps.push(currentTimestamp);
        sessionAttributes.breastFeedCyclePhase.push(currentCyclePhase);
        sessionAttributes.breastFeedLogType.push("Timestamp");
        sessionAttributes.breastFeedCycleType.push(currentCycleType); // Now push should work

        timestampsLength = sessionAttributes.breastFeedTimestamps.length;
        cyclePhaseLength = sessionAttributes.breastFeedCyclePhase.length;
        // Update speakOutput with the relevant information
        speakOutput = "You triggered Breast Feed" + currentCyclePhase + " logged." + " and last logged is" + sessionAttributes.breastFeedCyclePhase[cyclePhaseLength - 1] + "Cycle phase length is " + cyclePhaseLength
          + ". Timestamp length is " + timestampsLength + ". Activity is logged at "
          + sessionAttributes.breastFeedTimestamps[timestampsLength - 1]
          + " Cycle Type " + currentCycleType;

      } else if (defaultFeed.includes("bottle")) {
        sessionAttributes.bottleFeedAmount = sessionAttributes.bottleFeedAmount || [];
        sessionAttributes.bottleFeedLogType = sessionAttributes.bottleFeedLogType || [];
        sessionAttributes.bottleFeedCycleType = sessionAttributes.bottleFeedCycleType || [];

        // Update speakOutput with the relevant information
      if (currentBottleFeedAmount != undefined) {
        speakOutput = "You have logged a Bottle Feed with amount " + currentBottleFeedAmount
        sessionAttributes.bottleFeedTimestamps.push(currentTimestamp);
        sessionAttributes.bottleFeedAmount.push(currentBottleFeedAmount);
        sessionAttributes.bottleFeedLogType.push("Log Activity");
  
        timestampsLength = sessionAttributes.bottleFeedAmount.length;
        cyclePhaseLength = sessionAttributes.bottleFeedCyclePhase.length;
      } else {
        speakOutput = "You have logged a Bottle Feed but not specified an amount"
        reprompt = " Say the amount or do you want to finish logging later"
        speakOutput = speakOutput + reprompt
        return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt(reprompt)
          .getResponse();
      }
      } else {

        sessionAttributes.tempCyclePhase = currentCyclePhase
        speakOutput = "What type of feed is this?";
        reprompt = "Is this a breast feed or a bottle feed?"
        speakOutput = speakOutput + " " + reprompt

        return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt(reprompt)
          .getResponse();
      }
    }



    return handlerInput.responseBuilder
      .speak(speakOutput)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();
  }
};

const ClarifyBottleAmountIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'ClarifyBottleAmountIntent';
  },
  async handle(handlerInput) {

    const attributesManager = handlerInput.attributesManager;
    const attributes = await attributesManager.getPersistentAttributes() || {};
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    var currentBottleFeedAmount = handlerInput.requestEnvelope.request.intent.slots.bottleAmount.value;

    timestampsLength = sessionAttributes.bottleFeedTimestamps ? sessionAttributes.bottleFeedTimestamps.length : 0;

    const currentTimestamp = new Date().toISOString();


    sessionAttributes.bottleFeedTimestamps = sessionAttributes.bottleFeedTimestamps || [];
    sessionAttributes.bottleFeedAmount = sessionAttributes.bottleFeedAmount || [];
    sessionAttributes.bottleFeedLogType = sessionAttributes.bottleFeedLogType || [];

    // Update speakOutput with the relevant information
    if (currentBottleFeedAmount != undefined) {

      speakOutput = "You have logged a Bottle Feed with amount " + currentBottleFeedAmount
      sessionAttributes.bottleFeedTimestamps.push(currentTimestamp);
      sessionAttributes.bottleFeedAmount.push(currentBottleFeedAmount);
      sessionAttributes.bottleFeedLogType.push("Log Activity");

      timestampsLength = sessionAttributes.bottleFeedAmount.length;
      cyclePhaseLength = sessionAttributes.bottleFeedCyclePhase.length;
    } else {
      speakOutput = "You have logged a Bottle Feed but not specified an amount"
      reprompt = "Say the amount or do you want to finish logging later"
      speakOutput = speakOutput + reprompt
      return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(reprompt)
        .getResponse();
    }

    return handlerInput.responseBuilder
      .speak(speakOutput)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();

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

    const timestampsLength = sessionAttributes.sleepTimestamps.length;
    const cyclePhaseLength = sessionAttributes.sleepCyclePhase.length;

    const lastTimestamp = sessionAttributes.sleepTimestamps[timestampsLength - 1]

    const lastTimestampDate = new Date(lastTimestamp);

    // Add currentHourDuration and currentMinuteDuration to the Date object
    lastTimestampDate.setHours(lastTimestampDate.getHours() + parseInt(currentHourDuration, 10) || 0);
    lastTimestampDate.setMinutes(lastTimestampDate.getMinutes() + parseInt(currentMinuteDuration, 10) || 0);

    // Convert the modified Date object back to the desired format
    const updatedTimestamp = lastTimestampDate.toISOString();

    sessionAttributes.sleepTimestamps.push(updatedTimestamp);
    sessionAttributes.sleepCyclePhase.push(currentCyclePhase);
    sessionAttributes.sleepLogType.push("Duration");




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



    if (sessionAttributes.tempCycleType = "sleep") {
      // Check if there is an array in the session attributes to store timestamps
      if (!sessionAttributes.sleepTimestamps) {
        sessionAttributes.sleepTimestamps = [];
      }
      if (!sessionAttributes.sleepCyclePhase) {
        sessionAttributes.sleepCyclePhase = [];
      }
      if (!sessionAttributes.sleepLogType) {
        sessionAttributes.sleepLogType = [];
      }
      sessionAttributes.sleepTimestamps.pop();
      sessionAttributes.sleepCyclePhase.pop();
      sessionAttributes.sleepLogType.pop();

      // Get the current timestamp
      const currentTimestamp = new Date().toISOString();



      // Add the current timestamp and cyclePhase to the arrays
      sessionAttributes.sleepTimestamps.push(currentTimestamp);
      sessionAttributes.sleepCyclePhase.push("start");
      sessionAttributes.sleepLogType.push("Timestamp")
    }

    if (sessionAttributes.tempCycleType = "bottle feed") {
      // Check if there is an array in the session attributes to store timestamps
      if (!sessionAttributes.bottleFeedTimestamps) {
        sessionAttributes.bottleFeedTimestamps = [];
      }
      if (!sessionAttributes.bottleFeedCyclePhase) {
        sessionAttributes.bottleFeedCyclePhase = [];
      }
      if (!sessionAttributes.bottleFeedLogType) {
        sessionAttributes.bottleFeedLogType = [];
      }
      sessionAttributes.bottleFeedTimestamps.pop();
      sessionAttributes.bottleFeedCyclePhase.pop();
      sessionAttributes.bottleFeedLogType.pop();

      // Get the current timestamp
      const currentTimestamp = new Date().toISOString();


      // Add the current timestamp and cyclePhase to the arrays
      sessionAttributes.bottleFeedTimestamps.push(currentTimestamp);
      sessionAttributes.bottleFeedCyclePhase.push("start");
      sessionAttributes.bottleFeedLogType.push("Timestamp")
    }

    if (sessionAttributes.tempCycleType = "breast feed") {
      // Check if there is an array in the session attributes to store timestamps
      if (!sessionAttributes.breastFeedTimestamps) {
        sessionAttributes.breastFeedTimestamps = [];
      }
      if (!sessionAttributes.breastFeedCyclePhase) {
        sessionAttributes.breastFeedCyclePhase = [];
      }
      if (!sessionAttributes.breastFeedLogType) {
        sessionAttributes.breastFeedLogType = [];
      }
      sessionAttributes.breastFeedTimestamps.pop();
      sessionAttributes.breastFeedCyclePhase.pop();
      sessionAttributes.breastFeedLogType.pop();

      // Get the current timestamp
      const currentTimestamp = new Date().toISOString();



      // Add the current timestamp and cyclePhase to the arrays
      sessionAttributes.breastFeedTimestamps.push(currentTimestamp);
      sessionAttributes.breastFeedCyclePhase.push("start");
      sessionAttributes.breastFeedLogType.push("Timestamp")
    }

    let speakOutput = "The last " + sessionAttributes.tempCycleType + "cycle was deleted and a new cycle is logged";

    return handlerInput.responseBuilder
      .speak(speakOutput)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();
  }
};

const FeedActivityClarifyIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && Alexa.getIntentName(handlerInput.requestEnvelope) === 'FeedActivityClarifyIntent';
  },
  async handle(handlerInput) {
    console.log("----INFO INTENT---- FeedActivityClarifyIntentHandler")
    sessionAttributes.substate = 0

    var feedType = handlerInput.requestEnvelope.request.intent.slots.feedType.value;
    var currentBottleFeedAmount = handlerInput.requestEnvelope.request.intent.slots.bottleAmount.value;
    console.log("----INFO---- Feed Type " + feedType)

    const attributesManager = handlerInput.attributesManager;

    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    let speakOutput = ""

    // Get the current timestamp
    const currentTimestamp = new Date().toISOString();

    if (feedType.includes("breast")) {

      timestampsLength = sessionAttributes.breastFeedTimestamps ? sessionAttributes.breastFeedTimestamps.length : 0;
      cyclePhaseLength = sessionAttributes.breastFeedCyclePhase ? sessionAttributes.breastFeedCyclePhase.length : 0;

      // Check if the last recorded cyclePhase is "start" and the currentCyclePhase is also "start"
      if (
        cyclePhaseLength > 0 &&
        sessionAttributes.breastFeedCyclePhase[cyclePhaseLength - 1] === "start" &&
        sessionAttributes.tempCyclePhase === "start"
      ) {
        speakOutput = "You have not stopped your last session.";
        reprompt = "How long? Delete, or set to your average time."
        speakOutput = speakOutput + " " + reprompt

        return handlerInput.responseBuilder
          .speak(speakOutput)
          .reprompt(reprompt)
          .getResponse();
      }
      sessionAttributes.breastFeedTimestamps = sessionAttributes.breastFeedTimestamps || [];
      sessionAttributes.breastFeedCyclePhase = sessionAttributes.breastFeedCyclePhase || [];
      sessionAttributes.breastFeedLogType = sessionAttributes.breastFeedLogType || [];
      sessionAttributes.breastFeedCycleType = sessionAttributes.breastFeedCycleType || [];

      sessionAttributes.breastFeedTimestamps.push(currentTimestamp);
      sessionAttributes.breastFeedCyclePhase.push(sessionAttributes.tempCyclePhase);
      sessionAttributes.breastFeedLogType.push("Timestamp");
      sessionAttributes.breastFeedCycleType.push("breast feed");
      sessionAttributes.tempFeedType = "breast feed"

      timestampsLength = sessionAttributes.breastFeedTimestamps.length;
      cyclePhaseLength = sessionAttributes.breastFeedCyclePhase.length;

      // Update speakOutput with the relevant information
      speakOutput = "You triggered Breast Feed" + sessionAttributes.tempCyclePhase + " logged." + " and last logged is" + sessionAttributes.breastFeedCyclePhase[cyclePhaseLength - 1] + "Cycle phase length is " + cyclePhaseLength
        + ". Timestamp length is " + timestampsLength + ". Activity is logged at "
        + sessionAttributes.breastFeedTimestamps[timestampsLength - 1]
        + " Cycle Type breast feed";

    } else if (feedType.includes("bottle")) {
      sessionAttributes.bottleFeedAmount = sessionAttributes.bottleFeedAmount || [];
      sessionAttributes.bottleFeedLogType = sessionAttributes.bottleFeedLogType || [];
      sessionAttributes.bottleFeedCycleType = sessionAttributes.bottleFeedCycleType || [];

      // Update speakOutput with the relevant information
    if (currentBottleFeedAmount != undefined) {
      speakOutput = "You have logged a Bottle Feed with amount " + currentBottleFeedAmount
      sessionAttributes.bottleFeedTimestamps.push(currentTimestamp);
      sessionAttributes.bottleFeedAmount.push(currentBottleFeedAmount);
      sessionAttributes.bottleFeedLogType.push("Log Activity");

      timestampsLength = sessionAttributes.bottleFeedAmount.length;
      cyclePhaseLength = sessionAttributes.bottleFeedCyclePhase.length;
    } else {
      speakOutput = "You are logging a Bottle Feed but haven't specified an amount"
      reprompt = " Say the amount or do you want to finish logging later"
      speakOutput = speakOutput + reprompt
      return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(reprompt)
        .getResponse();
    }


    }

    
    defaultFeed = sessionAttributes.defaultFeed
    if (!sessionAttributes.defaultFeed || !defaultFeed.includes("breast") || !defaultFeed.includes("bottle")) {

      reprompt = "It seems you haven't set a default feed type. Would you like to set " + feedType + " as your default??"
      speakOutput = speakOutput + reprompt;

      return handlerInput.responseBuilder
        .speak(speakOutput)
        .reprompt(reprompt)
        .getResponse();

    }
    sessionAttributes.tempFeedType = feedType
    sessionAttributes.substate = 1 //Substate 1 is default feed



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
    const sleepTimes = [];LaterInt
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

const defaultFeedIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'defaultFeedIntent');
  },
  handle(handlerInput) {
    console.log("----INFO INTENT---- defaultFeedHandler")

    var feedType = handlerInput.requestEnvelope.request.intent.slots.feedType.value;
    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    sessionAttributes.defaultFeed = feedType
    const speakOutput = "Ok your default feed type has been stored as " + feedType;

    sessionAttributes.tempFeedType = ""
    sessionAttributes.substate = 0 //Substate 0 Reset

    return handlerInput.responseBuilder
      .speak(speakOutput)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();

  }
};


//Used for bottle feed to allow to log the amount later   
const LaterIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'LaterIntent');
  }, 
  handle(handlerInput) {
    console.log("----INFO INTENT---- laterFeedHandler")

    const substate = sessionAttributes.substate 
    if (substate = 2) {

    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();
    const speakOutput = "Ok,  you can continue to log items later";

    const currentTimestamp = new Date().toISOString();

    sessionAttributes.bottleFeedTimestamps.push(currentTimestamp);
    sessionAttributes.bottleFeedAmount.push("later");
    sessionAttributes.bottleFeedLogType.push("Log Activity");

    sessionAttributes.substate = 0 //Substate 0 Reset

    return handlerInput.responseBuilder
      .speak(speakOutput)
      .getResponse();

    } else { //Catch an error
      speakOutput = "I'm sorry I didn't quite understand what can I help you with"
      return handlerInput.responseBuilder
      .speak(speakOutput)
      .reprompt(speakOutput)
      .getResponse();
    }


  }
};



const YesIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.YesIntent');
  },
  handle(handlerInput) {
    console.log("----INFO INTENT---- YesIntentHandler")

    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    tempDefaultFeedType = sessionAttributes.tempFeedType
    sessionAttributes.defaultFeed = tempDefaultFeedType
    console.log("----INFO ---- tempDefaultFeedType" + tempDefaultFeedType)
    const speakOutput = "Ok your default feed type has been stored as " + tempDefaultFeedType;

    sessionAttributes.tempFeedType = ""
    sessionAttributes.substate = 0 //Substate 0 Reset

    // Get the current timestamp
    const currentTimestamp = new Date().toISOString();


    if (tempDefaultFeedType.includes("breast")) {

      timestampsLength = sessionAttributes.breastFeedTimestamps ? sessionAttributes.breastFeedTimestamps.length : 0;
      cyclePhaseLength = sessionAttributes.breastFeedCyclePhase ? sessionAttributes.breastFeedCyclePhase.length : 0;

      // Check if the last recorded cyclePhase is "start" and the currentCyclePhase is also "start"

      sessionAttributes.breastFeedTimestamps = sessionAttributes.breastFeedTimestamps || [];
      sessionAttributes.breastFeedCyclePhase = sessionAttributes.breastFeedCyclePhase || [];
      sessionAttributes.breastFeedLogType = sessionAttributes.breastFeedLogType || [];
      sessionAttributes.breastFeedCycleType = sessionAttributes.breastFeedCycleType || [];

      sessionAttributes.breastFeedTimestamps.push(currentTimestamp);
      sessionAttributes.breastFeedCyclePhase.push(sessionAttributes.tempCyclePhase);
      sessionAttributes.breastFeedLogType.push("Timestamp");
      sessionAttributes.breastFeedCycleType.push("breast feed");


      // Update speakOutput with the relevant information
      speakOutput = speakOutput + "You triggered Breast Feed" + sessionAttributes.tempCyclePhase + " logged." + " and last logged is" + sessionAttributes.breastFeedCyclePhase[cyclePhaseLength - 1] + "Cycle phase length is " + cyclePhaseLength
        + ". Timestamp length is " + timestampsLength + ". Activity is logged at "
        + sessionAttributes.breastFeedTimestamps[timestampsLength - 1]
        + " Cycle Type breast feed";

    } else if (tempDefaultFeedType.includes("bottle")) {

      timestampsLength = sessionAttributes.bottleFeedTimestamps ? sessionAttributes.bottleFeedTimestamps.length : 0;
      cyclePhaseLength = sessionAttributes.bottleFeedCyclePhase ? sessionAttributes.bottleFeedCyclePhase.length : 0;

      sessionAttributes.bottleFeedAmount = sessionAttributes.bottleFeedAmount || [];
      sessionAttributes.bottleFeedCyclePhase = sessionAttributes.bottleFeedCyclePhase || [];
      sessionAttributes.bottleFeedLogType = sessionAttributes.bottleFeedLogType || [];
      sessionAttributes.bottleFeedCycleType = sessionAttributes.bottleFeedCycleType || [];

      sessionAttributes.bottleFeedAmount.push(currentBottleFeedAmount);
      sessionAttributes.bottleFeedCyclePhase.push(sessionAttributes.tempCyclePhase);
      sessionAttributes.bottleFeedLogType.push("Timestamp");
      sessionAttributes.bottleFeedCycleType.push("bottle feed"); // Now push should work

      // Update speakOutput with the relevant information
      speakOutput = speakOutput + "You triggered Bottle Feed" + sessionAttributes.tempCyclePhase + " logged." + " and last logged is" + sessionAttributes.bottleFeedCyclePhase[cyclePhaseLength - 1] + "Cycle phase length is " + cyclePhaseLength
        + ". Timestamp length is " + timestampsLength + ". Activity is logged at "
        + sessionAttributes.bottleFeedTimestamps[timestampsLength - 1]
        + " Cycle Type bottle feed";
    }

    sessionAttributes.tempFeedType = ""
    sessionAttributes.substate = 0 //Substate 0 is reset



    return handlerInput.responseBuilder
      .speak(speakOutput)
      //.reprompt('add a reprompt if you want to keep the session open for the user to respond')
      .getResponse();

  }
};

const NoIntentHandler = {
  canHandle(handlerInput) {
    return Alexa.getRequestType(handlerInput.requestEnvelope) === 'IntentRequest'
      && (Alexa.getIntentName(handlerInput.requestEnvelope) === 'AMAZON.NoIntent');
  },
  handle(handlerInput) {

    let sessionAttributes = handlerInput.attributesManager.getSessionAttributes();

    const speakOutput = "Ok your default feed type has not been stored";

    sessionAttributes.tempFeedType = ""
    sessionAttributes.substate = 0 //Substate 0 Reset



    // Assuming sessionAttributes.timestamps and sessionAttributes.cyclePhase are defined
    const lastTimestampString = sessionAttributes.timestamps[sessionAttributes.timestamps.length - 1];



    return handlerInput.responseBuilder
      .speak(speakOutput)
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
      FeedActivityClarifyIntentHandler,
      LogActivityIntentHandler,
      LogActivityDurationIntentHandler,
      ReadActivityIntentHandler,
      DeleteActivityIntentHandler,
      LogAverageActivityIntentHandler,
      defaultFeedIntentHandler,
      ClarifyBottleAmountIntentHandler,
      
      LaterIntentHandler,
      YesIntentHandler,
      NoIntentHandler,
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



