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
    return "file_"+fn.replace(/[^a-z0-9-_]/g, '_');
  }

  function updateFileList(files) {
    for(var i in files) {
      if($("#"+filenameToID(files[i])).length == 0) {
        $("#logfile-list").append('<a class="list-group-item" id="'+filenameToID(files[i])+'" href="javascript:void();">'+files[i]+'</a>');
      }
    }
    $("#logfile-list a").unbind('click').click(function(){
      $("#logfile-list a").removeClass('active');
      $(this).addClass('active');
      $("#tail").empty();
      primus.write({
        action: "subscribe",
        file: $(this).text()
      })
    });    
  }

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
      }
    });

    setInterval(function(){
      $.get("/files.json", function(data){
        updateFileList(data.files);
      })
    }, 5000);

  });

});
