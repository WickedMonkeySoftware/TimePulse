//= require ninjascript
// javascript_include_tag "jquery.ui.datetimepicker.js"
//= require jquery.timepicker
//= require logical_tabs_jquery
//= require jquery.tools.min
//= require foundation
//= require ajax_flash
//= require jquery.selectBoxIt

$('document').ready( function(){
  startClock();
  addCurrentClassToCurrentProject();

  $('fieldset.rates tfoot').show();

  if ($('.rates-users-container').size() > 0) {
    setupRatesUsersDragDrop();
  }
  if ($('select#project_parent_id').val() != 1) { // Not sure the best way to not hard code the ID in this app
    $('fieldset.rates').hide();
  }

  $('.hide-initially').removeClass('hide-initially');
});

  $("Select#project_parent_id").selectBoxIt({
  });

Ninja.orders(function(Ninja){
    //ajaxSubmitConfigs = {
      //busyElement: function(elem){ return $('#timeclock')},
      //actions: {
        //timeclock: function(data) { $("#timeclock").replaceWith(data) },
        //project_picker: function(data) { $("#project_picker").replaceWith(data) }, //probably should select the project
        //current_project: function(data) { $("current_project").replaceWith(data) },
        //recent_work: function(data) { $("recent_work").replaceWith(data) }
      //}
    //}

    Ninja.behavior({
        'input[name="authenticity_token"]': {
          transform: updateInputAuthenticityToken,
          priority: -1
        },
        '.mizugumo_graceful_form': Ninja.becomesAjaxLink,
        '.fix_work_unit_button': Ninja.submitsAsAjax(),
        '*[data-remote=true]': Ninja.submitsAsAjax(),
        '#debug':        Ninja.suppressChangeEvents(),
        '#task_elapsed':  Ninja.suppressChangeEvents(),
        '.date_entry': { transform: function(elem){ $(elem).datepicker() }},
        '.datetime_entry': { transform: function(elem){
            $(elem).datetimepicker();
          }
        },
        '#work_unit_time_zone': { transform: function(elem) {
            var currentTime = new Date();
            var zone = -(currentTime.getTimezoneOffset() / 60); //GMT
            $(elem).val(zone);
          }
        },
        '#work_unit_select_all': { click: selectAllWorkUnits },
        '.expand-widget': { click: function(evnt, elem) {
            var target = $(elem).data('target');
            $(target).slideToggle("fast");
            $(elem).toggleClass("expanded")
          }
        },
        '.toggler': { click: function(evnt, elem) {
            if (window.matchMedia("(max-width: 767px)").matches) {
              var target = "#" + $(elem).data('target');
              $(target).slideToggle("fast");
            }
        },
            transform: function(elem) {
            var target = "#" + $(elem).data('target');
            $(target).addClass("toggle-target");
            }},
        '.work_unit_checkbox': { click: [ updateWorkUnitHoursTotal, "andDoDefault"] },

        '#timeclock form.edit_work_unit':    Ninja.submitsAsAjax({
            busyElement: function(elem){ return $('#timeclock')}
          }),
        '#timeclock form.clock_in':          Ninja.submitsAsAjax({
            busyElement: function(elem){ return $('#timeclock')}
          }),
        '#messages .flash': {
          transform: function(elem) {
            $(elem).delay(10000).slideUp(600, function(){$(elem).remove()})
          }
        },
        '.print-report-button': {
          click: function(evnt, elem) {
            print_target = "#" + $(elem).data('print-target');
            $(print_target)[0].contentWindow.print();
          }
        },
        '#timeclock input#work_unit_hours': {
          click: function(evnt, elem) {
            $(elem).val(hours_format(task_elapsed))
          }
        },
        '#timeclock a#override_trigger': {
          click: function(evnt, elem) {
            $('#timeclock #override_trigger').hide();
            $('#timeclock #overrides').slideDown();
          }
        },
        '.has_tooltip': {
          transform: function(elem){
            $(elem).tooltip({
              tip: "#tooltip_for_" + $(elem).attr('id'),
              offset: [ -10, 2 ],
              relative: true
            });
            return elem;
          }
        },
        'select#project_parent_id': {
          change: function(evnt, elem) {
            if ($(elem).val() == 1) {
              $('fieldset.rates').show();
            } else {
              $('fieldset.rates').hide();
            }
          }
        },
        '.rates .add-rate': {
          click: function(evnt, elem) {
            evnt.preventDefault();
            var tbody = $(elem).parents('table').find('tbody');
            var rows = tbody.find('tr');
            var rowCount = rows.size();
            var row = rows.first().clone();
            var inputs = row.find('input');
            inputs.val('');
            inputs.each(function (i, input) {
              input = $(input);
              var id = input.attr('id');
              var name = input.attr('name');
              input.attr('id', id.replace('0', rowCount));
              input.attr('name', name.replace('0', rowCount));
            });
            tbody.append(row);
          }
        }
      });

    Ninja.go();
  })

function setupRatesUsersDragDrop() {
  $('.rates-users-container').each(function() {
    $form = $(this);
    $form.find('select, input[type=submit]').hide();
    $form.submit(function(ev) {
      ev.preventDefault();
      $this = $(this);
      $.post($this.attr('action'), $this.serialize());
    });
  });

  var availableUsers = $('.rates-users-container select').first().find('option');
  var availableUsersContainer = $('<div class="available-users-container"></div>');

  availableUsers.each(function() {
    $option = $(this);

    if (null != $option.val() && '' != $option.val()) {
      draggableItem = $('<span class="rates-user" data-user-id="'+$option.val()+'">'+$option.html()+'</span>')

      var $selectedOption = $('.rates-users-container option[value='+$option.val()+']:selected');
      if ($selectedOption.size() > 0) {
        $selectedOption.parents('.rates-users-container').append(draggableItem);
      } else {
        availableUsersContainer.append(draggableItem);
      }
    }
  });
  $('div.rates').append('<p><strong>Available Users</strong></p>').append(availableUsersContainer);

  $('.rates-user').draggable();
  $('.rates-users-container, .available-users-container').droppable({
    drop: function(event, ui) {
      var $item = ui.draggable;
      var $from = $($item.parents('.ui-droppable'))
      var $to = $(this);
      var optionSelector = 'option[value='+$item.attr('data-user-id')+']';

      $from.find(optionSelector).attr('selected', false);
      $to.find(optionSelector).attr('selected', true);

      $to.prepend($item);
      $item.css({top: 0, left: 0});

      $from.submit();
      $to.submit();
    }
  });
}

function updateInputAuthenticityToken(elem) {
  token = $('meta[name="csrf-token"]').attr('content');
  if (token) {
    $(elem).val(token);
  }
}

function selectAllWorkUnits() {
  $('.work_unit_checkbox').prop('checked', true);
  updateWorkUnitHoursTotal();
}

function showHideDropdown() {

}

var task_elapsed;

function updateWorkUnitHoursTotal() {
  var total = 0.0;
  var count = 0;
  $('#new_invoice .work_unit .hours, #new_bill .work_unit .hours').each(function() {
    if ($(this).find('.work_unit_checkbox').is(':checked')) {
      total += $(this).find('.hours_count').html() * 1.0;
      count++;
    }
  });
  $('#work_unit_count').html(count);
  $('#hours_total').html(Math.round(total*100)/100);
}

function startClock() {
  $('#browsertime').html(now_sec());

  setInterval('updateClock()', 1000);
}

function updateClock() {
  b_page_time = parseInt($('#browsertime').html());
  s_page_time = parseInt($('#servertime').html());
  task_started = parseInt($('#tasktime').html());
  adjust = b_page_time - s_page_time;
  b_now = now_sec();
  s_now = b_now - adjust;
  task_elapsed = s_now - task_started;
  if (task_elapsed >= 0) {
    $('#task_elapsed').html( hhmmss_format(task_elapsed) );
  }
  $('#time_debug').html("<table class='listing'>" +
      debug_row("Browser Time Now:",new Date().toLocaleString()) +
      debug_row("Browser Render:",b_page_time) +
      debug_row("Server Render:",s_page_time) +
      debug_row("Task Started (sec):",task_started) +
      debug_row("Task Started (time):",new Date(task_started*1000).toLocaleString()) +
      debug_row("Adjustment:",adjust) +
      debug_row("Browser Now:",b_now) +
      debug_row("Server Now:",s_now) +
      debug_row("Task Elapsed", task_elapsed)
    + "<table>"
  );
}

function debug_row(label, value) {
  return "<tr><th>" + label + "</th><td>" + value + "</td></tr>";
}

function now_sec() {
  return Math.round(new Date().getTime()/1000);
}

function hours_format(sec) {
  return Math.floor(sec / 36.0) / 100.0;
}

function hhmm_format(sec) {
  return Math.floor(sec/3600) + ":" + zeropad(Math.floor(sec / 60) % 60);
}

function hhmmss_format(sec) {
  return hhmm_format(sec) + ":" + zeropad(sec % 60)
}

function zeropad(field) {
  if (field < 10)
    return "0"+field;
  else
    return field;
}

function addCurrentClassToCurrentProject() {
  var current_project_selector= "#project_" + $('meta[name="current project"]').attr("content");
  $(current_project_selector).addClass("current");
}
$(function(){ $(document).foundation(); });

$(document).foundation();

