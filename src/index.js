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
      debouncedTalk();
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
  var talkTimeout;
  function debouncedTalk(){
    if (talkTimeout) $timeout.cancel(talkTimeout);
    talkTimeout = $timeout(function(){
      talkTimeout = undefined;
      $scope.talk();
    }, 1000);
  }

  $scope.stop = function(){
    speech.stop();
    recognition && recognition.stop();
  };

  $scope.$watch('words', function(words, oldWords){
    speech.stop();
    debouncedTalk();
  });

  var recognition;
  $scope.listen = function(){
    $scope.listening = true;
    recognition = new webkitSpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;

    var newWords = $scope.words;
    recognition.onresult = function(event){
      $scope.$apply(function(){
        var newText = '';
        for (var i = event.resultIndex; i < event.results.length; ++i){
          if (event.results[i].isFinal){
            newWords += event.results[i][0].transcript;
          } else {
            newText += event.results[i][0].transcript;
          }
        }
        $scope.marks = $sce.trustAsHtml(newWords + ' <mark>' + newText + '</mark>');
      });
    };
    recognition.onerror = recognition.onend = function(event){
      $scope.$apply(function(){
        recognition = undefined;
        $scope.listening = false;
        $scope.words = newWords;
        $scope.marks = '';
      });
    };
    recognition.start();
  };

})
