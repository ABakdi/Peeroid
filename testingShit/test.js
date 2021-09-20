let products = new Proxy({
  browsers: ['Internet Explorer', 'Netscape']
},
{
  get: function(obj, prop) {
    // An extra property
    if (prop === 'latestBrowser') {
      return obj.browsers[obj.browsers.length - 1];
    }

    // The default behavior to return the value
    return obj[prop];
  },
  set: function(obj, prop, value) {
    // An extra property
    if (prop === 'latestBrowser') {
      obj.browsers.push(value);
      return true;
    }

    // Convert the value if it is not an array
    if (typeof value === 'string') {
      value = [value];
    }

    // The default behavior to store the value
    obj[prop] = value;

    // Indicate success
    return true;
  },

});


products.browsers.push('kkkkkkmm')
console.log(products.browsers)
//console.log(products.browsers);
/*
console.log(products.browsers);
//  ['Internet Explorer', 'Netscape']

products.browsers = 'Firefox';
//  pass a string (by mistake)

console.log(products.browsers);
//  ['Firefox'] <- no problem, the value is an array

products.latestBrowser = 'Chrome';

console.log(products.browsers);
//  ['Firefox', 'Chrome']

console.log(products.latestBrowser);
//  'Chrome'
*/
