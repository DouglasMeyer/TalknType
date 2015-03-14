angular.module('Draw', [])
.controller('WordsCtrl', function($scope, $timeout){
  $scope.words = "Hello Doug. How are you?";
  window.speechSynthesis.addEventListener('voiceschanged', function(e){
    $scope.$apply(function(){
      $scope.voices = window.speechSynthesis.getVoices();
      if (!$scope.voice) {
        $scope.voice = $scope.voices.filter(function(v){ return v.name == 'Fred'; })[0];
      }
    });
  });

  function speak(){
    if (!$scope.voice) return;
    window.speechSynthesis.cancel();
    var message = new SpeechSynthesisUtterance($scope.words);
    message.voice = $scope.voice;
    message.volume = 0.25;
    message.rate = 0.5;
    //message.addEventListener('boundary', function(e){
    //  e.charIndex
    //});
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

})
