function decodeHTMLEntities (str) {
  var txt = document.createElement("textarea");
  txt.innerHTML = str;
  return txt.value;
}

function endsWithPeriod(str) {
  str = str.trim();
  if (!str) return false;
  if (str.endsWith('.')) {
    return true;
  } else {
    return false;
  }
}

function removePeriod(str) {
  str = str.trim().replace(/\./g, '');
  return str;
}

function replaceTypoQuotes(str) {
  if (str) {
    return str.replace(/”|„|“|‟|«|»/g, '"').replace(/‘|’|‛|‚|‹|›/g, "'");
  }
  return str;
}

function removeSpeCharaceters(str) {
  if (/^[0-9€$¢£.,-]*$/.test(str)) {
    return null;
  }

  str = replaceTypoQuotes(str);
  
  var specChars = "&—–-!?,;:[](){}<>'\"";
  var start = 0, 
        end = str.length;

    while(start < end && specChars.indexOf(str[start]) >= 0)
        ++start;

    while(end > start && specChars.indexOf(str[end - 1]) >= 0)
        --end;

    var res = (start > 0 || end < str.length) ? str.substring(start, end) : str;
    return res;
}

function onlyUnique(value, index, array) {
  return array.indexOf(value) === index;
}

function getWordVariations(str) {
  let upperCaseStr, cappitalizedStr, lowerCaseStr, resArr = [];
  if (!str) return null;

  // A word is all lowercase
  if (str.toLowerCase() === str) {
    resArr = [str];
  }
  // A word is all upppercase
  if (str === str.toUpperCase()) {
    upperCaseStr = str;
    cappitalizedStr = str.charAt(0).toUpperCase() + str.toLowerCase().slice(1);
    lowerCaseStr = str.toLowerCase();
    resArr = [str, upperCaseStr, cappitalizedStr, lowerCaseStr];
  } else { // A word is written with an initial upppercase
    if (str.charAt(0).toUpperCase() === str.charAt(0)) {
      if (str.slice(1).toLowerCase() === str.slice(1)) { // rest in lowercase
        cappitalizedStr = str.charAt(0).toUpperCase() + str.toLowerCase().slice(1);
        lowerCaseStr = str.toLowerCase();
        resArr = [str, cappitalizedStr, lowerCaseStr]
      } else { // one or more letters in uppercase
        upperCaseStr = str.toUpperCase();
        cappitalizedStr = str.charAt(0).toUpperCase() + str.toLowerCase().slice(1);
        lowerCaseStr = str.toLowerCase();
        resArr = [str, upperCaseStr, cappitalizedStr, lowerCaseStr]
      }
    } else { // A word is written with an initial lowercase but one or more letters in uppercase
      lowerCaseStr = str.toLowerCase();
      resArr = [str, lowerCaseStr];
    }
  }

  var res = resArr.filter(onlyUnique);
  return res;
}

function binarySearch(arr, xm, locale = null)
{
  let l = 0, r = arr.length - 1;
  while (l <= r) {
      let m = l + Math.floor((r - l) / 2);

      let res = locale? xm.localeCompare(arr[m], locale, {sensitivity:'base'}): xm.localeCompare(arr[m], {sensitivity:'base'});
          
      // Check if x is present at mid
      if (res == 0)
          return true;

      // If x greater, ignore left half
      if (res > 0)
          l = m + 1;

      // If x is smaller, ignore right half
      else
          r = m - 1;
  }

  return false;
}

function escapeRegExp(text) {
  return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
}

function searchPosition(items, value, locale) {
  let startIndex = 0;
  let stopIndex = items.length - 1;
  let middle = Math.floor((stopIndex + startIndex) / 2);

  while (items[middle] != value && startIndex < stopIndex) {

    var compareRes = value.localeCompare(items[middle], locale, {sensitivity:'base'})
    //adjust search area
    if (compareRes < 0) {
      stopIndex = middle - 1;
    } else if (compareRes > 0) {
      startIndex = middle + 1;
    }

    //recalculate middle
    middle = Math.floor((stopIndex + startIndex) / 2);
  }

  return middle;
}