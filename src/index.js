angular.module('Draw', ['contenteditable'])
.controller('WordsCtrl', function($scope, $timeout, $sce){
  $scope.words = "What does C.A.L.V.I.N. spell?";

  window.speechSynthesis.addEventListener('voiceschanged', function(e){
    $scope.$apply(function(){
      $scope.voices = window.speechSynthesis.getVoices();
      if (!$scope.voice) {
        $scope.voice = $scope.voices.filter(function(v){ return v.name == 'Fred'; })[0];
      }
    });
  });

  function clearMarks(){
    $scope.$apply(function(){ $scope.marks = ''; });
  }

  function speak(){
    if (!$scope.voice) return;
    window.speechSynthesis.cancel();
    var text = String($scope.words).replace(/<[^>]+>/gm, '').replace(/&[^;]+;/gm, '');
    var message = new SpeechSynthesisUtterance(text);
    message.voice = $scope.voice;
    message.rate = 0.5;
    message.addEventListener('boundary', function(e){
      $scope.$apply(function(){
        $scope.marks = $sce.trustAsHtml(text.replace(/[\w\d']+/g, function(word, offset){
          if (offset === e.charIndex){
            return "<mark>"+word+"</mark>";
          } else {
            return word;
          }
        }));
      });
    });
    message.addEventListener('end', clearMarks);
    message.addEventListener('error', clearMarks);
    window.speechSynthesis.speak(message);
  }

  var timeout;
  $scope.$watch('words', function(words, oldWords){
    window.speechSynthesis.cancel();
    if (timeout) $timeout.cancel(timeout);
    timeout = $timeout(function(){
      timeout = undefined;
      speak();
    }, 1000);
  });

  $scope.$watch('voice', function(voice, oldVoice){
    if (!voice || !oldVoice || voice.name === oldVoice.name) return;
    speak();
  });

  var recognition;
  $scope.listen = function(){
    if (recognition) {
      recognition.stop();
    } else {
      var recognition = new webkitSpeechRecognition();
      window.recognition = recognition;
      recognition.onerror = recognition.onend = recognition.onresult = function(event) {
        $scope.$apply(function(){
          $scope.words = event.results[0][0].transcript;
        });
      }
      recognition.start();
    }

  };

})
