var autoScroll = true;

$(function(){
  $(".full-height").css({
    height: ''+($(window).height() - $(".navbar-static-top").height() - parseInt($(".navbar-static-top").css('margin-bottom')) - 24)+'px'
  });

  $("#auto-scroll").click(function(){
    $(this).toggleClass('btn-primary');
    if($(this).hasClass("btn-primary")) {
      autoScroll = true;
    }else{
      autoScroll = false;
    }
  });
});

$(function(){
  var primus = new Primus('/');

  function filenameToID(fn) {
    return "file_"+fn.file.replace(/[^a-z0-9-_]/g, '_');
  }

  function updateFileList(files) {
    for(var i in files) {
      if($("#"+filenameToID(files[i])).length == 0) {
        $("#logfile-list").append('<a class="list-group-item" id="'+filenameToID(files[i])+'" data-filename="'+files[i].file+'" href="javascript:void();">'
              +'<span class="date">'+(files[i].age > 86400 ? files[i].date_text : files[i].age_text)+'</span>'
              +files[i].name
            +'</span>'
          +'</a>');
      }
    }
    $("#logfile-list a").unbind('click').click(function(){
      $("#logfile-list a").removeClass('active');
      $(this).addClass('active');
      $("#tail").empty();
      $("#filter").val('');
      primus.write({
        action: "subscribe",
        file: $(this).data('filename')
      })
    });
  }

  function refreshFileList() {
    $.get("/files.json", function(data){
      updateFileList(data.files);
    });
    setTimeout(refreshFileList, 5000);
  }

  setTimeout(refreshFileList, 5000);

  function filterLog() {
    var searchString = $("#filter").val();
    if(searchString) {
      var re = new RegExp(searchString, "i");
      $("#tail li").each(function(i,el){
        if((""+$(el).text()).match(re)) {
          $(el).show();
        } else {
          $(el).hide();
        }
      });
    } else {
      $("#tail li").show();
    }
  }

  $("#filter").bind('keyup', filterLog);

  primus.on('open', function() {
    $("#log-status").text('is connected');

    primus.write({
      action: "list"
    });

    primus.on('data', function(data){

      if(data.type == 'files') {
        $("#logfile-list").empty();
        updateFileList(data.files);

      } else if(data.type == 'line') {
        $("#tail").append('<li>'+data.line+'</li>');
        if(autoScroll) {
          $("#tail").scrollTop($("#tail li").length * 100);
        }
        filterLog();
      }
    });

  });

});
