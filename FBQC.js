require(['jquery-noconflict'], function($) {
  //Ensure MooTools is where it must be
  Window.implement('$', function(el, nc) {
    return document.id(el, nc, this.document);
  });

  var $ = window.jQuery;
  var TRACKING_SERVER_URL = 'your_tracking_server_url';

  //jQuery goes here
  var width = screen.width;
  var height = screen.height;

  var worker_id = 'na';
  var job_id = 'na';
  var dialogue_id = 'na';
  var assignment_id = 'na';
  var useragent = 'na';

  try {
    worker_id = document.getElementById("assignment-worker-id").innerHTML;
  } catch (e) {
    worker_id = 'na';
  }
  try {
    job_id = document.getElementById("assignment-job-id").innerHTML;
  } catch (e) {
    job_id = 'na';
  }
  try {
    dialogue_id = document.getElementById("dialogue_id").className;
  } catch (e) {
    dialogue_id = 'na';
  }
  try {
    assignment_id = document.getElementsByClassName("js-assignment-id")[0].getAttribute('data-assignment-id');
  } catch (e) {
    assignment_id = 'na';
  }

  try {
    useragent = navigator.userAgent;
  } catch (e) {
    useragent = 'na';
  }

  //Global Variable with mouse position and what is the element under the mouse
  var DOC_CURSOR_X = null;
  var DOC_CURSOR_Y = null;
  var DOC_CURSOR_X_PREV = null;
  var DOC_CURSOR_Y_PREV = null;
  var WINDOW_CURSOR_X = null;
  var WINDOW_CURSOR_Y = null;
  var CURSOR_IN_WINDOW = false;
  var DOC_CURSOR_TARGET = null;
  var CURSOR_SELECTION = null;
  var CURSOR_SELECTION_CLASSNAME = null;

  var ctrlDown = false;
  var shitDown = false;
  var altDown = false;

  
  var withinInstruction = false;
  var enterTextfiled = false;

  var CUR_GRAND_ELEMENT_NAME = null;
  var DIS_INSTRUCTION = null;
  var post_id = 0;
  var post_data = [];
  var event_id = 0
  var move_timestamp = null;

  // update mouse position
  document.onmousemove = function(event) {

    DOC_CURSOR_X = event.pageX;
    DOC_CURSOR_Y = event.pageY;
    WINDOW_CURSOR_X = event.clientX;
    WINDOW_CURSOR_Y = event.clientY;
    CURSOR_IN_WINDOW = true;
    move_timestamp = event.timeStamp;

    var foundClass = false;
    var current_object = event.target;

    DOC_CURSOR_TARGET = null;
    if (current_object !== null)
      DOC_CURSOR_TARGET = current_object;
    
    // get relative position to Instruction: if the mouse is within the instruction
    var instr_bottom = DOC_CURSOR_Y  - $('#assignment-instructions').offset().top - document.getElementById('assignment-instructions').offsetHeight; // within instruction : < 0
    var instr_top = DOC_CURSOR_Y - $('#assignment-instructions').offset().top; // within instruction: > 0
    
    if (instr_bottom < 0 && instr_top > 0){
      withinInstruction = true;
    }
    else{
      withinInstruction = false;
    }
  }

  $('body').mousedown(function(event) {
    var selectedObj = window.getSelection();
    CURSOR_SELECTION = selectedObj.toString();
  });

  $('body').mouseup(function(event) {
    var selectedObj = window.getSelection();
    var time = event.timeStamp;
    event_id += 1;
    CURSOR_SELECTION = selectedObj.toString();
    updatePosition(event);
    if (CURSOR_SELECTION == '') {
      CURSOR_SELECTION_CLASSNAME = '';
      switch (event.which) {
        case 1:
          if (event.target.tagName == "A") {
            switch (event.target.className) {
              case "btn btn-inverse":
                logEvent(event, "mouse_click", "left_click_show_instruction", time, event_id);
                break;
              case "btn dropup":
                logEvent(event, "mouse_click", "left_click_hide_instruction", time, event_id);
                break;
              default:
                logEvent(event, "mouse_click", "left_click_unknown_instruction", time, event_id);
            }
          } else {
            logEvent(event, "mouse_click", "left_click", time, event_id);
          }
          break;
        case 2:
          logEvent(event, "mouse_click", "middle_click", time, event_id);
          break;
        case 3:
          logEvent(event, "mouse_click", "right_click", time, event_id);
          break;
        default:
          logEvent(event, "mouse_click", "unknown_mouseup_event", time, event_id);
      }
    } else {
      if (selectedObj.rangeCount > 0) {
        var cur_element = selectedObj.getRangeAt(0).startContainer.parentNode;
        var classname = cur_element.className;
        var tagname = cur_element.tagName;
        switch (tagname) {
          case "DIV":
            if (classname == "cml_field") {
              classname = cur_element.parentElement.className + '_margin';
            }
            break;
          case "LABEL":
            var child_el = cur_element.getElementsByTagName("INPUT")[0];
            tagname = child_el.tagName;
            classname = child_el.className.split(' ')[0] + '_option_' + child_el.value;
            break;
          case "INPUT":
            classname = cur_element.className.split(' ')[0] + '_option_' + cur_element.value;
            break;
          case "H2":
            if (classname == "legend") {
              grandparent_el = cur_element.parentElement.parentElement;
              tagname = grandparent_el.tagName
              classname = grandparent_el.className + '_legend';
            }
            break;
          case "LI":
            var parent_el = cur_element.parentElement;
            if (parent_el.tagName == 'OL') {
              tagname = "OL";
              classname = parent_el.className;
            }
            default:
              ;
        }
        CURSOR_SELECTION_CLASSNAME = classname;
      } else {
        CURSOR_SELECTION_CLASSNAME = null;
      }
      logEvent(event, 'mouse_click', 'mouse_select', time, event_id);
    }

  });

  $('body').mouseleave(function(event) {
    var time = event.timeStamp;
    event_id += 1;
    logEvent(event, "mouse_leave", "screen", time, event_id);
    CURSOR_IN_WINDOW = false;
  });

  $('body').mouseenter(function(event) {
    var time = event.timeStamp;
    event_id += 1;
    CURSOR_IN_WINDOW = true;
    logEvent(event, "mouse_enter", "screen", time, event_id);
  });


  window.onblur = function(event) {
    var time = event.timeStamp;
    event_id += 1;
    CURSOR_IN_WINDOW = false;
    logEvent(event, "window", "blur", time, event_id);
    ctrlDown = false;
    shitDown = false;
    altDown = false;
  }

  window.onfocus = function(event) {
    var time = event.timeStamp;
    event_id += 1;
    CURSOR_IN_WINDOW = true;
    logEvent(event, "window", "focus", time, event_id);
    ctrlDown = false;
    shitDown = false;
    altDown = false;
  }

  //***********************************************************************************************
  // Listen to the scroll events and trigger the log function
  //***********************************************************************************************
  var lastScrollTop = 0;
  $(window).scroll(function(event) {
    var st = $(this).scrollTop();
    var time = event.timeStamp;
    event_id += 1;

    var cur_x = WINDOW_CURSOR_X;
    var cur_y = WINDOW_CURSOR_Y;
    var scroll_tagname = '';
    var scroll_classname = '';
    var scroll_el = document.elementFromPoint(cur_x, cur_y);
    try {
      scroll_tagname = scroll_el.tagName;
      scroll_classname = scroll_el.className;
    } catch (e) {
      ;
    }

    // get relative position to Instruction
    var instr_bottom = WINDOW_CURSOR_Y + st  - $('#assignment-instructions').offset().top - document.getElementById('assignment-instructions').offsetHeight; // within instruction : < 0
    var instr_top = WINDOW_CURSOR_Y + st - $('#assignment-instructions').offset().top; // within instruction: > 0
    
    if (instr_bottom < 0 && instr_top > 0){
      withinInstruction = true;
    }
    else{
      withinInstruction = false;
    }
    
    if (withinInstruction){
          scroll_classname = 'Instruction';
    }
    else{
      switch (scroll_tagname) {
        case "DIV":
          if (scroll_classname == "radios cml_field" || scroll_classname == "checkboxes cml_field" || scroll_classname == "ratings cml_field") {
            var title = scroll_el.childNodes[0].innerText;
            scroll_classname = '[Question]' + title;
          }
          else if (scroll_classname == "checkbox cml_field") {
            var title = scroll_el.childNodes[0].innerText;
                var option_text = scroll_el.childNodes[1].childNodes[0].innerText;
                scroll_classname = '[Question]' + title + '[Option]' + option_text;
          };
          break;
        case "SPAN":
          if (scroll_classname == "required"){
            var title = scroll_el.parentElement.parentElement.childNodes[0].innerText;
            scroll_classname = '[Question]' + title;
          };
          break;
        case "LABEL":
          if(scroll_el.className == "legend"){
            scroll_classname = '[Question]' + scroll_el.innerText;
          }
          else{
            var title = scroll_el.parentElement.parentElement.childNodes[0].innerText;
            var scroll_text = scroll_el.innerText;
            scroll_classname = '[Question]' + title + '[Option]' + scroll_text;
          }
          break;
        case "INPUT":
          if (scroll_el.parentElement.tagName == 'TD'){
            var title = scroll_el.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.childNodes[0].innerText;
            var td_el = scroll_el.parentElement;
            var index = Array.prototype.indexOf.call(td_el.parentNode.children, td_el)
            var option_text = td_el.parentElement.parentElement.parentElement.childNodes[1].childNodes[1].childNodes[2*index+1].innerText;
          }
          else{
            var title = scroll_el.parentElement.parentElement.parentElement.childNodes[0].innerText;
            var option_text = scroll_el.parentElement.innerText;
          }
          scroll_classname = '[Question]' + title + '[Option]' + option_text;

          break;
        case "H2":
          if (scroll_classname == "legend") {
            scroll_classname = "[Question]" + scroll_el.innerText;
          }
          break;
        case "LI":
          var parent_el = scroll_el.parentElement;
          break;
        
        case "TD":
          var title = scroll_el.parentElement.parentElement.parentElement.parentElement.parentElement.childNodes[0].innerText;
          var index = Array.prototype.indexOf.call(scroll_el.parentNode.children, scroll_el)
          var option_text = scroll_el.parentElement.parentElement.parentElement.childNodes[1].childNodes[1].childNodes[2*index+1].innerText;
          scroll_classname = '[Question]' + title + '[Option]'+  option_text;
          break;

        case "TH":
          var title = scroll_el.parentElement.parentElement.parentElement.parentElement.parentElement.childNodes[0].innerText;
          var option_text = scroll_el.innerText;
          scroll_classname = '[Question]' + title + '[Option]'+  option_text;
          break;
              
        default:
          ;
      }
    }
    if (st > lastScrollTop) {
      logEvent(event, "scroll_down", scroll_classname, time, event_id);
    } else {
      logEvent(event, "scroll_up", scroll_classname, time, event_id);
    }
    lastScrollTop = st;
  });

  function logMousePosition(event) {
    if (!(DOC_CURSOR_X_PREV == DOC_CURSOR_X && DOC_CURSOR_Y_PREV == DOC_CURSOR_Y))
      if (CURSOR_IN_WINDOW) {
        var move_el = document.elementFromPoint(WINDOW_CURSOR_X, WINDOW_CURSOR_Y);
        var move_tagname = '';
        var move_classname = '';
        try {
          move_tagname = move_el.tagName;
          move_classname = move_el.className;
        } catch (e) {
        }
        
        if(withinInstruction){
          move_classname = 'Instruction';
        }
        else{
          switch (move_tagname) {

            case "DIV":
              if (move_classname == "radios cml_field" || move_classname == "checkboxes cml_field" || move_classname == "ratings cml_field") {
                var title = move_el.childNodes[0].innerText;
                move_classname = '[Question]' + title;
              }
              else if (move_classname == "checkbox cml_field") {
                var title = move_el.childNodes[0].innerText;
                var option_text = move_el.childNodes[1].childNodes[0].innerText;
                move_classname = '[Question]' + title + '[Move Option]' + option_text;
              }
              break;
              
            case "SPAN":
              if (move_classname == "required"){
                var title = move_el.parentElement.parentElement.childNodes[0].innerText;
                move_classname = '[Question]' + title;
              }
              
              break;
            case "LABEL":
              if(move_el.className == "legend"){
                move_classname = '[Question]' + move_el.innerText;
              }
              else{
                var title = move_el.parentElement.parentElement.childNodes[0].innerText;
                var move_text = move_el.innerText;
                move_classname = '[Question]' + title + '[Move Option]' + move_text;
              }
              break
            case "INPUT":

              if (move_el.parentElement.tagName == 'TD'){
                var title = move_el.parentElement.parentElement.parentElement.parentElement.parentElement.parentElement.childNodes[0].innerText;
                var td_el = move_el.parentElement;
                var index = Array.prototype.indexOf.call(td_el.parentNode.children, td_el)
                var option_text = td_el.parentElement.parentElement.parentElement.childNodes[1].childNodes[1].childNodes[2*index+1].innerText;
                move_classname = '[Question]' + title + '[Move Option]' + option_text;
              }
              else if(move_el.parentElement.className == 'cml_row'){
                var title = move_el.parentElement.parentElement.childNodes[0].innerText;
                move_classname = '[Question]' + title
              }
              else{
                var title = move_el.parentElement.parentElement.parentElement.childNodes[0].innerText;
                var option_text = move_el.parentElement.innerText;
                move_classname = '[Question]' + title + '[Move Option]' + option_text;
              }
              break;
            case "H2":
              if (move_classname == "legend") {
                move_classname = "[Question]" + move_el.innerText;
              }
              break;
            case "LI":
              var parent_el = move_el.parentElement;
              if (parent_el.tagName == 'OL') {
                move_tagname = "OL";
                move_classname = parent_el.className;
              }
              break;
           
            case "TD":
              var title = move_el.parentElement.parentElement.parentElement.parentElement.parentElement.childNodes[0].innerText;
              var index = Array.prototype.indexOf.call(move_el.parentNode.children, move_el)
              var option_text = move_el.parentElement.parentElement.parentElement.childNodes[1].childNodes[1].childNodes[2*index+1].innerText;
              move_classname = '[Question]' + title + '[Move Option]'+  option_text;
              break;
              
            case "TH":
              var title = move_el.parentElement.parentElement.parentElement.parentElement.parentElement.childNodes[0].innerText;
              var option_text = move_el.innerText;
              move_classname = '[Question]' + title + '[Move Option]'+  option_text;
              break;
            default:
              ;
          }
        }
        event_id += 1;
        logEvent(event, "mouse_move", move_classname, move_timestamp, event_id);
      }

    DOC_CURSOR_X_PREV = DOC_CURSOR_X;
    DOC_CURSOR_Y_PREV = DOC_CURSOR_Y;
  }
  setInterval(logMousePosition, 25);


  function updatePosition(event) {
    DOC_CURSOR_X_PREV = DOC_CURSOR_X;
    DOC_CURSOR_Y_PREV = DOC_CURSOR_Y;

    DOC_CURSOR_X = event.pageX;
    DOC_CURSOR_Y = event.pageY;
    WINDOW_CURSOR_X = event.clientX;
    WINDOW_CURSOR_Y = event.clientY;
  }


  $(document).ready(function(event) {
    var $inputs = $('#job_units :input');
    var default_values = '';
    $inputs.each(function() {
      if ($(this).is(':checked')) {
        default_values = default_values + '[Question]' + this.name.split('[')[1].slice(0, -1) + '[Default_Answer]' + $(this).val() + ' # ';
      }
    })
    var time = event.timeStamp;
    event_id += 1;
    logEvent(event, 'load_page', default_values, time, event_id)
  });

  //***********************************************************************************************
  // Key Log functions
  // logs the keycode (number) and comb with ALT,SHIFT,CTRL
  // logs on keyup
  //***********************************************************************************************

  $(document).ready(function() {
    ctrlDown = false;
    shitDown = false;
    altDown = false;
    cmdDown = false;
    var ctrlKey = 17,
      shiftKey = 16,
      altKey = 18,
      cmdKey = 91;

    $(document).keydown(function(event) {
      if (event.keyCode == ctrlKey) ctrlDown = true;
      if (event.keyCode == shiftKey) shitDown = true;
      if (event.keyCode == altKey) altDown = true;
      if (event.keyCode == cmdKey) cmdDown = true;
      //if (event.metaKey) cmdDown = true;
    }).keyup(function(e) {
      if (event.keyCode == ctrlKey) ctrlDown = false;
      if (event.keyCode == shiftKey) shitDown = false;
      if (event.keyCode == altKey) altDown = false;
      if (event.keyCode == cmdKey) cmdDown = false;
    });


  });

  window.onkeyup = function(event) {

    var ctrlKey = 17,
      shiftKey = 16,
      altKey = 18,
      cmdKey = 91;
    if (event.keyCode == ctrlKey) return;
    if (event.keyCode == shiftKey) return;
    if (event.keyCode == altKey) return;
    if (event.keyCode == cmdKey) return;
    if (enterTextfiled) return;
    
    var comboKey = "";
    if (ctrlDown) comboKey += " +CTRL";
    if (shitDown) comboKey += " +SHITF";
    if (altDown) comboKey += " +ALT";
    if (cmdDown) comboKey += " +CMD";

    var value = String.fromCharCode(event.keyCode);
    log_value = event.keyCode + comboKey;
    var time = event.timeStamp;
    event_id += 1;
    logEvent(event, "key", log_value, time, event_id);

  };

  $('textarea, input[type=text]').keypress(function(event) {
      var time = event.timeStamp;
      event_id += 1;
      var text_value = $(this).val();
      var classname = $(this).context.className.split(" ")[0];
      var title = $(this).parent().parent().find('label').text();

      logEvent(event, "key_pressed", "[Question]" + title + "[Selected Character]" + String.fromCharCode(event.which) + text_value, time, event_id);
      console.log("[Question]" + title + "[Selected Character]" + String.fromCharCode(event.which) + text_value);
  });

  $('input').focus(function(event) {
    var time = event.timeStamp;
    event_id += 1;
    if ($(this).is(':focus')) {
      switch ($(this).prop('type')){
        case "text":
          enterTextfiled = true;
          var title = $(this).parent().parent().find('label').text();
          logEvent(event, "option_focus", '[Question]' + title, time, event_id);
          break;
        case "radio":
          if ($(this).parent().prop("tagName") == "LABEL"){
            var title = $(this).parent().parent().parent().find('h2').text();
            var focus_text = $(this).parent().text();
            focus_text = focus_text.replace(/^\s+|\s+$/g, '');
            focus_text.trimStart();
            logEvent(event, "option_focus", '[Question]' + title + "[Focus Option]" + focus_text, time, event_id);
          }
          else if ($(this).parent().prop("tagName") == "TD"){
            var td_el = this.parentElement;
            var title = td_el.parentElement.parentElement.parentElement.parentElement.parentElement.childNodes[0].innerText;
            var index = Array.prototype.indexOf.call(td_el.parentNode.children, td_el)
            var focus_text = td_el.parentElement.parentElement.parentElement.childNodes[1].childNodes[1].childNodes[2*index+1].innerText;
            logEvent(event, "option_focus", '[Question]' + title + "[Focus Option]" + focus_text, time, event_id);
          }
          break;
        case "checkbox":
          var title = this.parentElement.parentElement.parentElement.childNodes[0].innerText;
          var focus_text = this.parentElement.innerText;
          logEvent(event, "option_focus", '[Question]' + title + "[Focus Option]" + focus_text, time, event_id);
          break;
      }
      
    }

  });
  
  $('textarea').focus(function(event) {
    enterTextfiled = true;
  });

  $(".instr_consent_link").on("click", function(event) {
    var time = event.timeStamp;
    event_id += 1;
    logEvent(event, "click_link", "consent_link", time, event_id);
  });


  $('input').click(function(event) {
      var time = event.timeStamp;
      event_id += 1;
      var check_value = $(this).val();
      var check_text = $(this).parent().text();
      check_text = check_text.replace(/^\s+|\s+$/g, '');
      check_text.trimStart();
      var classname = $(this).context.className.split(" ")[0];

      if ($(this).is(":checkbox")) {
        var title = $(this).parent().parent().parent().find('h2').text();
        var test = $(this).parent().parent().parent();
        var selected = test.find('input:checked').map(function(i,el){return el.value;}).get().join('[And]');
        if (title == ''){
          title = $(this).parent().parent().parent().find('p').text();
        }
        if ($(this).is(":checked")) {
          logEvent(event, "check_option", '[Question]' + title + "[Check Option]" + check_text + '[Checked Options]' + selected, time, event_id);
        } else {
          logEvent(event, "uncheck_option", '[Question]' + title + "[Uncheck Option]" + check_text + '[Checked Options]' + selected, time, event_id);
        }
        
      }
      else if (($(this).is(":text"))){
        var title = $(this).parent().parent().find('label').text();
        logEvent(event, "enter_text", "[Question]" + title, time, event_id);
        enterTextfiled = true;
      }
      else if (($(this).is(":radio"))){
        if ($(this).parent().prop('nodeName') == "TD"){
          var td_el = this.parentElement;
          var title = td_el.parentElement.parentElement.parentElement.parentElement.parentElement.childNodes[0].innerText;
          var index = Array.prototype.indexOf.call(td_el.parentNode.children, td_el)
          var check_text = td_el.parentElement.parentElement.parentElement.childNodes[1].childNodes[1].childNodes[2*index+1].innerText;
        }
        else{
          var title = $(this).parent().parent().parent().find('h2').text();
        }
        logEvent(event, "check_option", '[Question]' + title + "[Check Option]" + check_text, time, event_id);
      }
  });

  $("select").on("click", function(event) {
    var time = event.timeStamp;
    event_id += 1;
    var check_value = $(this).val();
    if(check_value == ""){
      check_value = "unknown"
    }
    var classname = $(this).context.className.split(" ")[0];
    var title = $(this).parent().parent().find('label').text();
    logEvent(event, "check_option", "[Question]" + title + "[Selected Option]" + check_value, time, event_id);
  });


$(window).unload(function(event) {
  post_id += 1;
  event_id += 1;
  var target_tagName = null;
  var target_id = null;
  var current_timestamp = Date.now();
  var event_time = event.timeStamp;

  var type = "unload";
  var sub_type = "unload";

  var data_id = event_id.toString() + '_' + post_id.toString();

  data = {
    data_id: data_id,
    timestamp: current_timestamp,
    event_time: event_time,
    worker_id: worker_id,
    worker_id: worker_id,
    job_id: job_id,
    dialogue_id: dialogue_id,
    assignment_id: assignment_id,
    useragent: useragent,
    type: type,
    sub_type: sub_type,
    DOC_CURSOR_X: DOC_CURSOR_X,
    DOC_CURSOR_Y: DOC_CURSOR_Y,
    WINDOW_CURSOR_X: WINDOW_CURSOR_X,
    WINDOW_CURSOR_Y: WINDOW_CURSOR_Y,
    target_tagName: target_tagName,
    target_id: target_id,
    CURSOR_SELECTION: CURSOR_SELECTION,
    CURSOR_SELECTION_CLASSNAME: CURSOR_SELECTION_CLASSNAME,
    lastScrollTop: lastScrollTop
  };

  post_data.push(data);

  var count = 0;
  var maxTries = 3;
  var first_id = post_data[0].data_id;
  while (true) {
    try {
      post_data[0].data_id = first_id + '_' + count.toString();
      $.ajax({
        url: TRACKING_SERVER_URL,
        type: 'POST',
        dataType: 'json',
        data: {
          'data': JSON.stringify(post_data)
        },
        success: function(data) {
        },
        error: function(err) {
        }
      });

      post_data = [];
      break;
    } catch (e) {
      count += 1;
    }
  }

});


$('#job_units').submit(function(event) {
  post_id += 1;
  var event_time = event.timeStamp;
  event_id += 1;
  var target_tagName = null;
  var target_id = null;
  var current_timestamp = Date.now();

  var type = "click_submit";
  var sub_type = "click_submit";

  var $inputs = $('#job_units :input');
  var values = '';
  $inputs.each(function(){
    if ($(this).is(':checked')) {
      values = values + this.name.split('[')[1].slice(0, -1) + '_' + $(this).val() + '#';
    }
  })

  var sub_type = values;

  if (DOC_CURSOR_TARGET) {
    try {
      target_tagName = DOC_CURSOR_TARGET.tagName;
      target_id = DOC_CURSOR_TARGET.name
    } catch (e) {
      ;
    }
  }

  var data_id = event_id.toString() + '_' + post_id.toString();
  data = {
    data_id: data_id,
    timestamp: current_timestamp,
    event_time: event_time,
    worker_id: worker_id,
    job_id: job_id,
    dialogue_id: dialogue_id,
    useragent: useragent,
    assignment_id: assignment_id,
    type: type,
    sub_type: sub_type,
    DOC_CURSOR_X: DOC_CURSOR_X,
    DOC_CURSOR_Y: DOC_CURSOR_Y,
    WINDOW_CURSOR_X: WINDOW_CURSOR_X,
    WINDOW_CURSOR_Y: WINDOW_CURSOR_Y,
    target_tagName: target_tagName,
    target_id: target_id,
    CURSOR_SELECTION: CURSOR_SELECTION,
    CURSOR_SELECTION_CLASSNAME: CURSOR_SELECTION_CLASSNAME,
    lastScrollTop: lastScrollTop
  };

  post_data.push(data);

  var count = 0;
  var maxTries = 3;
  var first_id = post_data[0].data_id;
  while (true) {
    try {
      post_data[0].data_id = first_id + '_' + count.toString();
      $.ajax({
        url: TRACKING_SERVER_URL,
        type: 'POST',
        dataType: 'json',
        data: {
          'data': JSON.stringify(post_data)
        },
        success: function(data) {},
        error: function(err) {}
      });

      post_data = [];
      break;
    } catch (e) {
      count += 1;
    }
  }
})

function logEvent(event, type, sub_type, time, event_id) {
  console.log('type: ', type, 'sub_type: ', sub_type, 'event_id: ', event_id);
  return
  var target_tagName = null;
  var target_id = null;
  var event_time = time;
  post_id += 1;

  var current_timestamp = Date.now();

  if (DOC_CURSOR_TARGET) {
    try {
      target_tagName = DOC_CURSOR_TARGET.tagName;
      target_id = DOC_CURSOR_TARGET.name
    } catch (e) {
      ;
    }
  }


  var data_id = event_id.toString() + '_' + post_id.toString();
  data = {
    data_id: data_id,
    timestamp: current_timestamp,
    event_time: event_time,
    worker_id: worker_id,
    job_id: job_id,
    dialogue_id: dialogue_id,
    useragent: useragent,
    assignment_id: assignment_id,
    type: type,
    sub_type: sub_type,
    DOC_CURSOR_X: DOC_CURSOR_X,
    DOC_CURSOR_Y: DOC_CURSOR_Y,
    WINDOW_CURSOR_X: WINDOW_CURSOR_X,
    WINDOW_CURSOR_Y: WINDOW_CURSOR_Y,
    target_tagName: target_tagName,
    target_id: target_id,
    CURSOR_SELECTION: CURSOR_SELECTION,
    CURSOR_SELECTION_CLASSNAME: CURSOR_SELECTION_CLASSNAME,
    lastScrollTop: lastScrollTop
  };

  post_data.push(data);
  if (post_data.length == 40 || type == 'mouse_click' || (type == 'mouse_leave' && sub_type == 'screen') || sub_type == 'blur') {
    var count = 0;
    var maxTries = 3;
    var first_id = post_data[0].data_id;

    while (true) {
      try {
        post_data[0].data_id = first_id + '_' + count.toString();
        $.ajax({
          url: TRACKING_SERVER_URL,
          type: 'POST',
          dataType: 'json',
          data: {
            'data': JSON.stringify(post_data)
          },
          success: function(data) {
          },
          error: function(err) {
          }
        });

        post_data = [];
        break;
      } catch (e) {
        count += 1;
      }
    }
  }
  return;
};

});
