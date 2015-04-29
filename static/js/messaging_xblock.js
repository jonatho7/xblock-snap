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

function update_total_attempts(runtime, element) {
    /*
        Increments the total attempts counter
     */
    console.log("Updating the total attempts counter from javascript");
    var update_element = $(".status .debugDiv .debugItem .total_attempts");
    $.ajax({
        type: 'POST',
        url: runtime.handlerUrl(element, 'update_attempts_count'),
        data: JSON.stringify({
                'attempt': true
        }),
        success: function (result) {
            console.log("Got update attempts result = ", result);
            update_element.text(result.total_attempts);
        }
    });
}

/*
    Get response from teacher version of problem by contacting
    django server
 */
var teacher_response = {
    get_data : function () {
        if (!this.deferred) {
            this.deferred = $.Deferred();
            var url = $(".snap_context").data("teacher-problem-full-url-response");
            console.log("Contacting url = ", url, " to get the teacher's output");
            var deferred = this.deferred;
            $.ajax(url, {
                success: function (response) {
                    deferred.resolve(response['data']);
                }
            });
        }
        return this.deferred.promise();
    }
};



/*
    Code separated out for ease of understanding
 */

var problem_solved_indicator = '<i class="fa fa-check fa-lg"></i>';
var incorrect_solution_indicator = '<i class="fa fa-times lg"></i>';

var evaluation_in_process_indicator = '<i class="fa fa-spinner fa-spin fa-lg"></i></i>';

function update_problem_status_indicator(html) {
        $(".status .indicator").html(html);
}

function handle_results_from_xblock(runtime, element, data) {
    /*
        This handles the result from xblock
     */
    console.log("Trying to handle the results from snap");
    var student_data = data;
    if (!data.finished) {
        // Student results are wrong (in this case they have no data too). Basically, they did nothing
        // other than clicking the submit button (or did something horribly wrong)
        console.log("Student tests have failed");
        update_total_attempts(runtime, element, data);
        // Re enable the submit button again
        $(".status .student_submit").prop("disabled", false);
        update_problem_status_indicator(incorrect_solution_indicator);
    } else {
        teacher_response.get_data().done(function (teacher_data) {
            //console.log(teacher_data);
            //console.log(student_data);
            //Send the data to server and wait for response
            $.ajax({
                type: 'POST',
                url: runtime.handlerUrl(element, 'handle_results_submission'),
                data: JSON.stringify({
                    'teacher_response': teacher_data,
                    'student_response': student_data
                }),
                success: function (result) {
                    // Update attempts counter
                    console.log("Scoring completed by Server result obtained = ", result);
                    $(".status .debugDiv .debugItem .total_attempts").text(result.total_attempts);

                    //Update grade
                    $(".status .grade").text(result.grade);

                    //Enable submit if the problem is not solved completely
                    if (!result.problem_solved)  {
                        $(".status .student_submit").prop("disabled", false);
                        if (result.grade == 0) {
                            update_problem_status_indicator(incorrect_solution_indicator);
                        } else {
                            // Just remove the icon
                            update_problem_status_indicator('');
                        }
                    } else {
                        update_problem_status_indicator(problem_solved_indicator);
                    }
                }
            });
        });
    }


}


function main() {
    send_msg_to_snap_iframe(MESSAGES_TYPE.DEMO, {from : "xblocK", to: "iframe (snap)"});



    //Enable submit button for student to submit the answer
    //Attach event after submit clicks the submit button

    $(".status .student_submit").prop("disabled", false).click(function () {
        $(this).prop('disabled', true); //disable first
        send_msg_to_snap_iframe(MESSAGES_TYPE.SUBMIT, {});
        update_problem_status_indicator(evaluation_in_process_indicator);
    });


}

/*
    Will be called by runtime see frag.initialize_js('java_script_initializer') in snap_context.py
 */

function java_script_initializer(runtime, element) {
    console.log("Main function in xblock got called");
    configure_listener();
    /*
        Initiate ajax request to collect the teacher response
        while iframe is being loaded up and student is solving
        the problem
    */

    //Do nothing, this will get the results for us ready
    teacher_response.get_data().done(function (response) {console.log("Got the teacher response from Server")});


    // Initially disable the submit button till ready event is received from Snap
    $(".status .student_submit").prop("disabled",true);

    // Listen for ready event
    register_callback(MESSAGES_TYPE.READY, main);

    // Just for testing
    register_callback(MESSAGES_TYPE.DEMO, function (data) { console.log(" Data received from iframe", data); });

    register_callback(MESSAGES_TYPE.WATCHED, function (data) {
        update_watched_event(runtime, element, data);
    });


    // Register for 'RESULT' event from snap
    register_callback(MESSAGES_TYPE.RESULT, function (data) {
        handle_results_from_xblock(runtime, element, data);
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


function update_results_event(runtime, element, student_data, teacher_data) {
    // Grab the grade HTML element.
    var grade_element = $(".status .grade");

    console.log("contacting runtime to calculate the grade for the problem");

    $.ajax({
        type: 'POST',
        url: runtime.handlerUrl(element, 'handle_results_submission'),
        data: JSON.stringify({
                'grade': true,
                '':''
        }),
        success: function (result) {
            grade_element.text(result.grade);
        }
    });

}


