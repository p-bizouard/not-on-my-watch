'use strict';


app.directive('sameas', function (){ 
   return {
      require: 'ngModel',
      link: function(scope, elem, attrs, ngModel) {
            scope.$watch(attrs.sameas, function (value) {
                ngModel.$setValidity('sameas', value === ngModel.$viewValue);
            });
            ngModel.$parsers.push(function (value) {
                var isValid = value === scope.$eval(attrs.sameas);
                ngModel.$setValidity('sameas', isValid);
                return isValid ? value : undefined;
            });
      }
   };
});
 
app.filter('startFrom', function() {
    return function(input, start) {
        start = +start; //parse to int
        return input.slice(start);
    }
});