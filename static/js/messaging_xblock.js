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
    READY: 'READY',   // Message to indicate that iframe is setup
    WATCHED: 'WATCHED',  // Watched event to parent
    SUBMIT:  'SUBMIT',  // Submit (obviously student submit) event from Xblock
    RESULT:  'RESULT',  // Event to send results from snap to Xblock
    TRACKING: 'TRACKING'   //  Tracking of students' interactions with Snap IDE
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

/*
    Code separated out for ease of understanding
 */
function handle_results_from_xblock(data) {
    /*
        This handles the result from xblock
     */
    if (!data.finished) {
        console.log("Student tests have failed");
    }
    // Re enable the submit button again
    $(".status .student_submit").prop("disabled", false);

}


function main() {
    send_msg_to_snap_iframe(MESSAGES_TYPE.DEMO, {from : "xblocK", to: "iframe (snap)"});

    //Enable submit button for student to submit the answer
    $(".status .student_submit").prop("disabled", false);


    // Register for 'RESULT' event from snap
    register_callback(MESSAGES_TYPE.SUBMIT, handle_results_from_xblock);

    //Attach event after submit clicks the submit button
    $(".status .student_submit").click(function () {
        $(this).prop('disabled', true); //disable first
        send_msg_to_snap_iframe(MESSAGES_TYPE.SUBMIT, {});
    })

}

/*
    Will be called by runtime see frag.initialize_js('java_script_initializer') in snap_context.py
 */

function java_script_initializer(runtime, element) {
    console.log("Main function in xblock got called");
    configure_listener();

    // Initially disble the submit button till ready event is received from Snap
    $(".status .student_submit").prop("disabled",true);

    // Listen for ready event
    register_callback(MESSAGES_TYPE.READY, main);

    // Just for testing
    register_callback(MESSAGES_TYPE.DEMO, function (data) { console.log(" Data received from iframe", data); });

    register_callback(MESSAGES_TYPE.WATCHED, function (data) {
        update_watched_event(runtime, element, data);
    });

    //Register for 'Tracking' event from snap
    register_callback(MESSAGES_TYPE.TRACKING, function (data){
        console.log("Tracking Data received from iframe", data);
        $.ajax({
                type: "POST",
                url: runtime.handlerUrl(element, 'publish_event'),  //publish for student data analytics
                data: JSON.stringify({
                    url: $(".snap_context #snap_iframe")[0].src,
                    event_type: 'edx.snap.interaction'
                }),
                success: function(result){
                    console.log(result.result+':'+JSON.stringify(data));
                }
            });
    });

}

function update_watched_event(runtime, element, data) {
    // Update watched count variable on Xblock
    var update_element = $(".status .watched_count");

    $.ajax({
        type: 'POST',
        url: runtime.handlerUrl(element, 'handle_watched_count'),
        data: JSON.stringify({
                'watched': true
        }),
        success: function (result) {
            update_element.text(result.watched_count);
        }
    });

}




