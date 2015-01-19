##Installation

```shell
bower install e50-filter-bar
```

##Usage
Inject E50Filter into a controller or provider.

```javascript
var filterBar = $scope.filterBar = E50Filter.new();
```

Inside your template, pass the filterBar scope variable into the e50-filter-bar directive.
```html
<e50-filter-bar filter="filterBar"></e50-filter-bar>
```

## Default Options
```javascript
E50Filter.new({
  count: true,
  filters: true,
  views: true,
  sort: true, 
  actions: true,
  search: true
});
```

## Top level API
```javascript
// returns what value to filter on. 
filterBar.filterKey()
```

```javascript
// returns which key to sort by
filterBar.sortKey()
```

```javascript
// returns boolean, whether ascending or descending
filterBar.asc()
```

```javascript
// returns the text in the search field
filterBar.searchText()
```

## Dropdown API
Each filterBar instance has three dropdowns. filterBar.filter, filterBar.sort, and filterBar.actions all extend
the dropdown api

```javascript
var drop = filterBar.filter;
// Set the dropdown options
drop.setOptions([{value: 'user', label: 'Filter by User'}]);

// returns boolean,
drop.hasOptions();
```

```javascript
var drop = filterBar.sort;
// returns the current sort by option
drop.getKey(); 

// sort by creation date
drop.setKey({value: 'id', label: 'Creation Date'})
```

```javascript
// set onChange callback
drop.onChange(function(selectedOption) {
  this.setKey(selectedOption);
});
```

## Toggle API
Each dropdown extends the toggle api

```javascript
// return boolean, true if it's open
drop.isOpen();

// return boolean, true if it's closed
drop.isClosed();

// Opens the dropdown
drop.open();

// Closes the dropdown
drop.close();

// Toggles the dropdown
drop.toggle();

```

## Custom Template
Either override the templateUrl or create your own directive and pass in the filterBar instance.

Directive
```javascript
app.directive('customFilter', function() {
  return {
    restrict: 'EA',
    scope: {
      bar: '=filterBar'
    },
    templateUrl: 'your/tpl/path.html'
  }
});
```

Implementation
```html
<custom-filter bar="filterBar"></custom-filter>
```

Template
```html
<div class="custom-filter">
  In here, you have access to the filterBar instance api. 
  <div ng-if="bar.options.sort">Only show this if the sort option is available</div>
  <a href="" ng-click="bar.filter.toggle()">Toggle filter dropdown</a>
  <ul ng-if="bar.filter.isOpen()">
    <li ng-repeat="option in bar.filter.options">
      <a href="" ng-click="bar.filter.setKey(option)">{{option.label}}</>
    </li>
  </ul>
</div
```



