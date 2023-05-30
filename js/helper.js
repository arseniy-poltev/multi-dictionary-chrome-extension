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
  let upperCaseStr, capitalizedStr, lowerCaseStr, resArr = [];
  if (!str) return null;

  // A word is all lowercase
  if (str.toLowerCase() === str) {
    resArr = [str];
  }
  // A word is all upppercase
  if (str === str.toUpperCase()) {
    upperCaseStr = str;
    capitalizedStr = str.charAt(0).toUpperCase() + str.toLowerCase().slice(1);
    lowerCaseStr = str.toLowerCase();
    resArr = [str, upperCaseStr, capitalizedStr, lowerCaseStr];
  } else { // A word is written with an initial upppercase
    if (str.charAt(0).toUpperCase() === str.charAt(0)) {
      if (str.slice(1).toLowerCase() === str.slice(1)) { // rest in lowercase
        capitalizedStr = str.charAt(0).toUpperCase() + str.toLowerCase().slice(1);
        lowerCaseStr = str.toLowerCase();
        resArr = [str, capitalizedStr, lowerCaseStr]
      } else { // one or more letters in uppercase
        upperCaseStr = str.toUpperCase();
        capitalizedStr = str.charAt(0).toUpperCase() + str.toLowerCase().slice(1);
        lowerCaseStr = str.toLowerCase();
        resArr = [str, upperCaseStr, capitalizedStr, lowerCaseStr]
      }
    } else { // A word is written with an initial lowercase but one or more letters in uppercase
      lowerCaseStr = str.toLowerCase();
      resArr = [str, lowerCaseStr];
    }
  }

  var res = resArr.filter(onlyUnique);
  return res;
}

function binarySearch(arr, xm, locale, lowPriority = false)
{
  if (lowPriority) {
    xm = '~' + xm;
  }
  if (!arr || arr.length === 0) return false;
  let l = 0, r = arr.length - 1;
  while (l <= r) {
      let m = l + Math.floor((r - l) / 2);

      // let res = locale? xm.localeCompare(arr[m], locale, {sensitivity:'variant'}): xm.localeCompare(arr[m], {sensitivity:'variant'});
          
      // Check if x is present at mid
      if (xm == arr[m])
          return true;

      // If x greater, ignore left half
      if (xm > arr[m])
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

function insertSorted(arr, item, locale) {
  var comparator = function(a, b) {
    return a.localeCompare(b, locale, { sensitivity: 'variant'})
  };

  // get the index we need to insert the item at
  var min = 0;
  var max = arr.length;
  var index = Math.floor((min + max) / 2);
  while (max > min) {
      if (item < arr[index]) {
          max = index;
      } else {
          min = index + 1;
      }
      index = Math.floor((min + max) / 2);
  }

  // insert the item
  arr.splice(index, 0, item);
  return arr;
}

function searchPosition(items, value, locale) {
  let startIndex = 0;
  let stopIndex = items.length - 1;
  let middle = Math.floor((stopIndex + startIndex) / 2);
  while (items[middle] != value && startIndex < stopIndex) {

    var compareRes = value < items[middle];
    //adjust search area
    if (value < items[middle]) {
      stopIndex = middle - 1;
    } else if (value > items[middle]) {
      startIndex = middle + 1;
    }

    //recalculate middle
    middle = Math.floor((stopIndex + startIndex) / 2);
  }

  return middle;
}

function parseFile(str, localeInfo = false) {
  str = new TextDecoder("utf8", { ignoreBOM: true }).decode(new TextEncoder("utf8").encode(str));
  str = str.trim();
  var allText = str.split(/\r?\n/g);
  var res;
  if (localeInfo) {
    locales = allText[0].toLowerCase().split(",");
    allText.splice(0, 1);
    res = {
      words: allText,
      locales
    }
  } else {
    res = {
      words: allText,
    }
  }
  return res;
}

function capitalizeFirstLetter(str) {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toUpperCase() + str.toLowerCase().slice(1);
}

function lowercaseFirstLetter(str) {
  if (!str || str.length === 0) return str;
  return str.charAt(0).toLowerCase() + str.slice(1);
}