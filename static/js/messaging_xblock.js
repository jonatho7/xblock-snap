/**
 * Created by vivek bharath akupatni on 4/24/15.
 */

/*

    Most of the contents here should more or less match with that of message_communication.js
    file in SnapEdx/js/message_communication.js

    *** Note**
    This file should be included by Xblocks. This file contains services for sending
    and receiving messages from iframe (containing snap problems)

    Assumptions:
        1) There is only 1 snap iframe which is accessible as
            follows:
            $(".snap_context #snap_iframe")
*/

var MESSAGES_TYPE = {
    DEMO:  'DEMO',  // only for demo purposes
    SUBMIT: 'SUBMIT', //Used for communication of submit option
    READY: 'READY'   // Message to indicate that iframe is setup

};

var function_callbacks = {};


function register_callback(type, func) {
    if ((type in MESSAGES_TYPE) && func) {
        if (!(type in function_callbacks)) {
            /* Message is not present so add it */
            function_callbacks[type]  = []
        }
        function_callbacks[type].push(func);
    }
}


function configure_listener() {
    var eventMethod = window.addEventListener ? "addEventListener" : "attachEvent";
	    var eventer = window[eventMethod];
	    var messageEvent = eventMethod == "attachEvent" ? "onmessage" : "message";

	    // Listen to message from child window
	    eventer(messageEvent,function(e) {
  		    var msg = e.data;
            console.log('Received message from iframe (snap):  ', msg.type, ' data = ', msg.data);
            // Call the function references only if object contains 'type' and 'data fields

            if ((msg.type in function_callbacks) && ('data' in msg)) {
                // Call all the registered function handlers
                //console.log("len = ", function_callbacks[msg.type].length);
                for (var i = 0 ; i < function_callbacks[msg.type].length; i++) {
                    function_callbacks[msg.type][i](msg.data)
                }
            }

	    },false);
}


function send_msg_to_snap_iframe(msg_type, data) {
    var msg = {
        type: msg_type,
        data: data
    };
    $(".snap_context #snap_iframe")[0].contentWindow.postMessage(msg, '*');
}

function main() {
    send_msg_to_snap_iframe(MESSAGES_TYPE.DEMO, {from : "xblocK", to: "iframe (snap)"});
}

/*
    Will be called by runtime see frag.initialize_js('java_script_initializer') in snap_context.py
 */

function java_script_initializer(runtime, element) {
    console.log("Main function in xblock got called");
    configure_listener();

    // Listen for ready event
    register_callback(MESSAGES_TYPE.READY, main);

    // Just for testing
    register_callback(MESSAGES_TYPE.DEMO, function (data) { console.log(" Data received from iframe", data); });

}


