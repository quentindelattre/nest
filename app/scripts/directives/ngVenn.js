'use strict';

angular.module('nestApp.directives')
.directive('ngVenn', ['d3', function(d3) {
   return {
      restrict: 'A',
      require: '^ngModel',
      scope:{
         ngModel:'='
      },
      template: '<div class="venn_diagram"><h4>Venn-R-ated by {{ngModel}}</h4></div>'
   }
}]);
