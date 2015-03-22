angular.module('Draw', ['contenteditable'])
.factory('speech', function($rootScope, $window, $q){
  var speech = {
    voices: [],
    voice: null,
    say: function(words){
      window.speechSynthesis.cancel();
      var message = new SpeechSynthesisUtterance(words);
      message.voice = speech.voice;
      message.rate = 0.5;

      var sayDefer = $q.defer();
      message.addEventListener('boundary', function(e){
        sayDefer.notify(e.charIndex);
      });
      message.addEventListener('end', sayDefer.resolve);
      message.addEventListener('error', sayDefer.resolve);
      window.speechSynthesis.speak(message);

      return sayDefer.promise;
    },
    stop: function(){
      $window.speechSynthesis.cancel();
    }
  };

  $window.speechSynthesis.addEventListener('voiceschanged', function(e){
    $rootScope.$apply(function(){
      voices = $window.speechSynthesis.getVoices();
      Array.prototype.splice.apply(speech.voices,
        [0, speech.voices.length].concat(voices));
    });
  });

  return speech;
})
.controller('WordsCtrl', function($scope, $timeout, $sce, speech){
  $scope.words = "What does C.A.L.V.I.N. spell?";

  $scope.voices = speech.voices;
  unwatchVoices = $scope.$watchCollection('voices', function(voices){
    speech.voice = voices.filter(function(v){ return v.name == 'Fred'; })[0];
    if (speech.voice) {
      unwatchVoices();
      $scope.talk();
    }
  });

  $scope.talk = function(){
    if (!speech.voice) return;
    $scope.talking = true;
    var text = String($scope.words).replace(/<[^>]+>/gm, '').replace(/&[^;]+;/gm, '');
    speech.say(text)
    .finally(function(){
      $scope.marks = '';
      $scope.talking = false;
    }, function(charIndex){
      $scope.marks = $sce.trustAsHtml(text.replace(/[\w\d']+/g, function(word, offset){
        if (offset === charIndex){
          return "<mark>"+word+"</mark>";
        } else {
          return word;
        }
      }));
    });
  };

  $scope.stop = speech.stop

  var timeout;
  $scope.$watch('words', function(words, oldWords){
    if (words === oldWords) return;
    speech.stop();
    if (timeout) $timeout.cancel(timeout);
    timeout = $timeout(function(){
      timeout = undefined;
      $scope.talk();
    }, 1000);
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
